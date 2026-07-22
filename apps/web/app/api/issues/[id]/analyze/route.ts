import { createServiceClient } from "@/lib/supabase";
import { startAnalysis } from "@/lib/start-analysis";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "issue id가 필요합니다." }, { status: 400 });
  }

  try {
    const db = createServiceClient();

    const { data: inFlight } = await db
      .from("analysis_runs")
      .select("id")
      .eq("issue_id", id)
      .in("status", ["QUEUED", "RUNNING"])
      .limit(1);
    if (inFlight && inFlight.length > 0) {
      return Response.json(
        { error: "이미 진행 중인 분석이 있습니다." },
        { status: 409 }
      );
    }

    const result = await startAnalysis(db, id, { force: true });
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "분석 실행 생성 실패";
    const status =
      message.includes("찾을 수 없습니다") ||
      message.includes("프로젝트 설정이 없습니다")
        ? 404
        : message.includes("환경변수")
          ? 500
          : 502;
    return Response.json({ error: message }, { status });
  }
}
