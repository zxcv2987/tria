import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const FEEDBACK_VALUES = [
  "CORRECT",
  "PARTIALLY_HELPFUL",
  "NOT_HELPFUL",
  "WRONG",
] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result =
    typeof body === "object" && body !== null && "result" in body
      ? (body as { result: unknown }).result
      : null;

  if (
    typeof result !== "string" ||
    !FEEDBACK_VALUES.includes(result as (typeof FEEDBACK_VALUES)[number])
  ) {
    return Response.json(
      { error: "result는 CORRECT|PARTIALLY_HELPFUL|NOT_HELPFUL|WRONG 중 하나여야 합니다." },
      { status: 400 }
    );
  }

  const comment =
    typeof body === "object" && body !== null && "comment" in body
      ? (body as { comment: unknown }).comment
      : null;

  try {
    const db = createServiceClient();
    const { error } = await db.from("analysis_feedback").insert({
      analysis_run_id: runId,
      result,
      comment: typeof comment === "string" ? comment : null,
    });

    if (error) {
      return Response.json(
        { error: `피드백 저장 실패: ${error.message}` },
        { status: 500 }
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "피드백 저장 실패" },
      { status: 500 }
    );
  }
}
