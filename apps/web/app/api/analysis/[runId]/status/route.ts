import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED = new Set(["RUNNING", "QUEUED", "SUCCEEDED", "FAILED"]);

function authorize(request: Request): boolean {
  const secret = process.env.CALLBACK_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return header.slice("Bearer ".length) === secret;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  if (!process.env.CALLBACK_SECRET) {
    return Response.json(
      { error: "CALLBACK_SECRET 환경변수가 없습니다." },
      { status: 500 }
    );
  }
  if (!authorize(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await params;
  if (!runId) {
    return Response.json({ error: "runId가 필요합니다." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status =
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    typeof (body as { status: unknown }).status === "string"
      ? (body as { status: string }).status
      : null;

  if (!status || !ALLOWED.has(status)) {
    return Response.json(
      { error: "status는 QUEUED|RUNNING|SUCCEEDED|FAILED 중 하나여야 합니다." },
      { status: 400 }
    );
  }

  try {
    const db = createServiceClient();
    const patch: Record<string, string> = { status };
    if (status === "RUNNING") {
      patch.started_at = new Date().toISOString();
    }

    const { data, error } = await db
      .from("analysis_runs")
      .update(patch)
      .eq("id", runId)
      .select("id, status")
      .maybeSingle();

    if (error) {
      return Response.json(
        { error: `analysis_runs 갱신 실패: ${error.message}` },
        { status: 500 }
      );
    }
    if (!data) {
      return Response.json(
        { error: `analysisRunId not found: ${runId}` },
        { status: 404 }
      );
    }

    return Response.json({
      analysisRunId: (data as { id: string }).id,
      status: (data as { status: string }).status,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "상태 갱신 중 오류",
      },
      { status: 500 }
    );
  }
}
