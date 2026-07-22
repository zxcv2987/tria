import type { CallbackPayload } from "@tria/analysis";
import { isCallbackPayload } from "@tria/analysis";
import { tryCreateServiceClient } from "@/lib/supabase";
import { addAsanaComment, updateAsanaTaskStatus } from "@/lib/asana";
import type { SupabaseClient } from "@supabase/supabase-js";

const RESULT_TYPE_LABEL: Record<string, string> = {
  CODE_LIKELY: "코드 원인 유력",
  CHECK_EXTERNAL: "외부 점검 권장",
  NEED_MORE_INFO: "추가 정보 필요",
};

/**
 * 분석 완료/실패를 Asana에도 반영한다 (문서 5.3 상태 흐름, 16장 결과 표시).
 * best-effort — Asana 쪽이 실패해도 우리 DB 갱신 자체는 이미 끝난 뒤라 응답을 막지 않는다.
 */
async function syncAsana(
  db: SupabaseClient,
  issueId: string,
  payload: CallbackPayload
): Promise<void> {
  const { data: issue } = await db
    .from("issues")
    .select("asana_task_gid")
    .eq("id", issueId)
    .maybeSingle();
  const taskGid = (issue as { asana_task_gid?: string } | null)
    ?.asana_task_gid;
  if (!taskGid) return;

  const baseUrl = process.env.TRIA_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const detailLink = baseUrl ? `${baseUrl}/issues/${issueId}` : null;

  if (payload.status === "SUCCEEDED") {
    const statusLabel =
      payload.result.result === "NEED_MORE_INFO" ? "추가 정보 필요" : "개발 검토";
    await updateAsanaTaskStatus(taskGid, statusLabel);
    await addAsanaComment(
      taskGid,
      [
        "🤖 Tria 분석 완료",
        "",
        `판정: ${RESULT_TYPE_LABEL[payload.result.result] ?? payload.result.result}`,
        "",
        "요약:",
        payload.result.summary,
        ...(detailLink ? ["", "상세 분석:", detailLink] : []),
      ].join("\n")
    );
  } else {
    await updateAsanaTaskStatus(taskGid, "분석 실패");
    await addAsanaComment(
      taskGid,
      ["🤖 Tria 분석 실패", "", `사유: ${payload.failureReason}`].join("\n")
    );
  }
}

export const runtime = "nodejs";

/**
 * Runner → Tria Callback.
 * Env: CALLBACK_SECRET (runner 트랙과 공유, docs/runner/README.md)
 *
 * note: packages/analysis의 validateResult는 checkout된 저장소 경로가 필요해
 * runner가 이미 수행한다. 웹에서는 isCallbackPayload로 스키마만 재검증한다.
 */

function authorize(request: Request): boolean {
  const secret = process.env.CALLBACK_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return header.slice("Bearer ".length) === secret;
}

export async function POST(request: Request) {
  if (!process.env.CALLBACK_SECRET) {
    return Response.json(
      {
        error:
          "CALLBACK_SECRET 환경변수가 없습니다. wiring 단계에서 runner와 공유 값을 설정하세요.",
      },
      { status: 500 }
    );
  }

  if (!authorize(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isCallbackPayload(body)) {
    return Response.json(
      { error: "Invalid CallbackPayload" },
      { status: 400 }
    );
  }

  const payload: CallbackPayload = body;
  const db = tryCreateServiceClient();

  // 완료 기준: DB 연결 여부와 무관하게 payload 검증 후 응답.
  if (!db) {
    return Response.json({
      ok: true,
      persisted: false,
      analysisRunId: payload.analysisRunId,
      status: payload.status,
    });
  }

  const { data: existing, error: fetchError } = await db
    .from("analysis_runs")
    .select("id, status, issue_id")
    .eq("id", payload.analysisRunId)
    .maybeSingle();

  if (fetchError) {
    return Response.json(
      { error: `analysis_runs 조회 실패: ${fetchError.message}` },
      { status: 500 }
    );
  }

  if (!existing) {
    return Response.json(
      { error: `analysisRunId not found: ${payload.analysisRunId}` },
      { status: 404 }
    );
  }

  const { status: current, issue_id: issueId } = existing as {
    id: string;
    status: string;
    issue_id: string;
  };
  // idempotency: 이미 완료된 실행의 중복 callback은 무시
  if (current === "SUCCEEDED" || current === "FAILED") {
    return Response.json({
      ok: true,
      ignored: true,
      analysisRunId: payload.analysisRunId,
      status: current,
    });
  }

  const finishedAt = new Date().toISOString();

  if (payload.status === "SUCCEEDED") {
    const { result } = payload;
    const { error: updateError } = await db
      .from("analysis_runs")
      .update({
        status: "SUCCEEDED",
        result_type: result.result,
        summary: result.summary,
        suspected_area: result.suspectedArea,
        evidence: result.evidence,
        external_checks: result.externalChecks,
        missing_information: result.missingInformation,
        limitations: result.limitations,
        target_commit_sha: payload.targetCommitSha ?? null,
        finished_at: finishedAt,
        failure_reason: null,
      })
      .eq("id", payload.analysisRunId);

    if (updateError) {
      return Response.json(
        { error: `analysis_runs 갱신 실패: ${updateError.message}` },
        { status: 500 }
      );
    }
  } else {
    const { error: updateError } = await db
      .from("analysis_runs")
      .update({
        status: "FAILED",
        failure_reason: payload.failureReason,
        finished_at: finishedAt,
      })
      .eq("id", payload.analysisRunId);

    if (updateError) {
      return Response.json(
        { error: `analysis_runs 갱신 실패: ${updateError.message}` },
        { status: 500 }
      );
    }
  }

  try {
    await syncAsana(db, issueId, payload);
  } catch (err) {
    console.error(
      "Asana 상태/댓글 동기화 실패 (무시하고 계속 진행):",
      err instanceof Error ? err.message : err
    );
  }

  return Response.json({
    ok: true,
    persisted: true,
    analysisRunId: payload.analysisRunId,
    status: payload.status,
  });
}
