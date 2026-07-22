import { createHmac, timingSafeEqual } from "node:crypto";
import { fetchAsanaTaskDetails } from "@/lib/asana";
import { createServiceClient } from "@/lib/supabase";
import { canStartAnalysis, startAnalysis } from "@/lib/start-analysis";

export const runtime = "nodejs";

/**
 * Asana 웹훅.
 * Env:
 * - ASANA_WEBHOOK_SECRET — 핸드셰이크 때 받은 X-Hook-Secret (wiring 단계에서 저장)
 * - ASANA_PAT — 태스크 재조회용
 */

type AsanaEvent = {
  action?: string;
  resource?: { gid?: string; resource_type?: string };
  parent?: { gid?: string; resource_type?: string };
};

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function collectTaskGids(events: AsanaEvent[]): string[] {
  const gids = new Set<string>();
  for (const event of events) {
    const candidates = [event.resource, event.parent];
    for (const c of candidates) {
      if (c?.resource_type === "task" && c.gid) gids.add(c.gid);
    }
  }
  return [...gids];
}

export async function POST(request: Request) {
  const hookSecret = request.headers.get("x-hook-secret");
  if (hookSecret) {
    // 최초 등록 핸드셰이크 — secret을 응답 헤더에 그대로 반환.
    // 이 값을 ASANA_WEBHOOK_SECRET으로 저장해야 이후 요청의 서명 검증이 된다.
    console.log("[asana webhook] handshake secret:", hookSecret);
    return new Response(null, {
      status: 200,
      headers: { "X-Hook-Secret": hookSecret },
    });
  }

  const storedSecret = process.env.ASANA_WEBHOOK_SECRET;
  if (!storedSecret) {
    return Response.json(
      {
        error:
          "ASANA_WEBHOOK_SECRET 환경변수가 없습니다. 핸드셰이크 secret을 wiring 단계에서 설정하세요.",
      },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hook-signature");
  if (!signature || !verifySignature(rawBody, signature, storedSecret)) {
    return Response.json({ error: "Invalid X-Hook-Signature" }, { status: 401 });
  }

  let events: AsanaEvent[] = [];
  try {
    const parsed = JSON.parse(rawBody) as { events?: AsanaEvent[] };
    events = parsed.events ?? [];
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 서명 검증 후 즉시 200 — 이후 처리는 best-effort (Asana 재시도 방지).
  const taskGids = collectTaskGids(events);
  if (taskGids.length === 0) {
    return Response.json({ ok: true, processed: 0 });
  }

  const db = createServiceClient();
  const started: string[] = [];

  for (const gid of taskGids) {
    try {
      const task = await fetchAsanaTaskDetails(gid);

      const { data: matchedConfigs } = await db
        .from("project_configs")
        .select("key, asana_project_value")
        .eq("is_active", true);

      const configs = (matchedConfigs ?? []) as {
        key: string;
        asana_project_value: string;
      }[];

      // asana_project_value는 항상 프로젝트 GID다 (이름은 바뀔 수 있어 매칭에 쓰지 않는다).
      const projectKey =
        configs.find((c) => task.projectGids.includes(c.asana_project_value))
          ?.key ?? null;

      // issues.project_key는 NOT NULL — 지원되는 프로젝트가 아니면 동기화하지 않는다 (문서 5.2).
      if (!projectKey) {
        console.error(`지원되지 않는 프로젝트, 동기화 건너뜀 (gid=${gid})`);
        continue;
      }

      const { data: upserted, error: upsertError } = await db
        .from("issues")
        .upsert(
          {
            asana_task_gid: task.gid,
            asana_url: task.asanaUrl,
            title: task.title,
            description: task.body,
            project_key: projectKey,
            asana_status: task.asanaStatus,
            source_modified_at: task.modifiedAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "asana_task_gid" }
        )
        .select(
          "id, asana_status, project_key, source_modified_at"
        )
        .single();

      if (upsertError || !upserted) {
        console.error("issues upsert 실패", upsertError?.message);
        continue;
      }

      const issue = upserted as {
        id: string;
        asana_status: string;
        project_key: string | null;
        source_modified_at: string;
      };

      if (await canStartAnalysis(db, issue)) {
        const result = await startAnalysis(db, issue.id);
        started.push(result.analysisRunId);
      }
    } catch (err) {
      console.error(
        `Asana webhook task 처리 실패 (${gid}):`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return Response.json({ ok: true, processed: taskGids.length, started });
}
