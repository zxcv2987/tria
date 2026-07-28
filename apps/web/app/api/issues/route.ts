import { createServiceClient } from "@/lib/supabase";
import { hasInFlightRun, startAnalysis } from "@/lib/start-analysis";

export const runtime = "nodejs";

/**
 * 소스 무관 이슈 접수 API (문서 5.1절).
 * Asana든, 사내 폼이든, 다른 이슈 트래커든 이 계약만 지키면 연동된다.
 * Env: TRIA_INGEST_API_KEY
 */

type IssueIntake = {
  title: string;
  description?: string;
  projectKey: string;
  environment?: string;
  occurredUrl?: string;
  reproductionSteps?: string;
  expectedResult?: string;
  actualResult?: string;
  source?: string;
  externalRef?: string;
  externalUrl?: string;
  notifyUrl?: string;
};

function isIssueIntake(value: unknown): value is IssueIntake {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const optionalString = (key: string) =>
    v[key] === undefined || typeof v[key] === "string";

  return (
    typeof v.title === "string" &&
    v.title.trim().length > 0 &&
    typeof v.projectKey === "string" &&
    v.projectKey.trim().length > 0 &&
    optionalString("description") &&
    optionalString("environment") &&
    optionalString("occurredUrl") &&
    optionalString("reproductionSteps") &&
    optionalString("expectedResult") &&
    optionalString("actualResult") &&
    optionalString("source") &&
    optionalString("externalRef") &&
    optionalString("externalUrl") &&
    optionalString("notifyUrl")
  );
}

function authorize(request: Request): boolean {
  const key = process.env.TRIA_INGEST_API_KEY;
  if (!key) return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return header.slice("Bearer ".length) === key;
}

export async function POST(request: Request) {
  if (!process.env.TRIA_INGEST_API_KEY) {
    return Response.json(
      {
        error:
          "TRIA_INGEST_API_KEY 환경변수가 없습니다. 접수 API를 쓰려면 먼저 설정하세요.",
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

  if (!isIssueIntake(body)) {
    return Response.json(
      { error: "title, projectKey가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const db = createServiceClient();

    const { data: issueRow, error: upsertError } = await db
      .from("issues")
      .upsert(
        {
          title: body.title,
          description: body.description ?? "",
          project_key: body.projectKey,
          environment: body.environment ?? null,
          occurred_url: body.occurredUrl ?? null,
          reproduction_steps: body.reproductionSteps ?? null,
          expected_result: body.expectedResult ?? null,
          actual_result: body.actualResult ?? null,
          source: body.source ?? "api",
          external_ref: body.externalRef ?? null,
          external_url: body.externalUrl ?? null,
          updated_at: new Date().toISOString(),
        },
        body.externalRef ? { onConflict: "external_ref" } : undefined
      )
      .select("id")
      .single();

    if (upsertError || !issueRow) {
      return Response.json(
        { error: `이슈 접수 실패: ${upsertError?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    const issueId = (issueRow as { id: string }).id;

    if (await hasInFlightRun(db, issueId)) {
      const { data: existingRun } = await db
        .from("analysis_runs")
        .select("id")
        .eq("issue_id", issueId)
        .in("status", ["QUEUED", "RUNNING"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return Response.json({
        issueId,
        analysisRunId: (existingRun as { id: string } | null)?.id ?? null,
        status: "QUEUED",
      });
    }

    const { analysisRunId, status } = await startAnalysis(db, issueId, {
      notifyUrl: body.notifyUrl,
    });

    return Response.json({ issueId, analysisRunId, status }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "이슈 접수 실패" },
      { status: 502 }
    );
  }
}
