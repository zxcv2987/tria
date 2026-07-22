import { analyzeRepository } from "@/lib/analyze-repository";
import { validateResult } from "@tria/analysis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { title, body } = await request.json();

  if (typeof title !== "string" || typeof body !== "string") {
    return Response.json(
      { error: "title, body는 문자열이어야 합니다." },
      { status: 400 }
    );
  }

  const repositoryPath = process.env.TARGET_REPOSITORY_PATH;
  if (!repositoryPath) {
    return Response.json(
      { error: "TARGET_REPOSITORY_PATH 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const result = await analyzeRepository(title, body);
    return Response.json(validateResult(result, repositoryPath));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
