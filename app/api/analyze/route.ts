import { analyzeRepository } from "@/lib/analyze-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { title, body } = await request.json();

  if (typeof title !== "string" || typeof body !== "string") {
    return Response.json(
      { error: "title, body는 문자열이어야 합니다." },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeRepository(title, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
