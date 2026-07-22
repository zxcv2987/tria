import { listAccessibleRepositories } from "@/lib/github-app";

export const runtime = "nodejs";

export async function GET() {
  try {
    const repositories = await listAccessibleRepositories();
    return Response.json({ repositories });
  } catch (error) {
    return Response.json({
      repositories: [],
      error: error instanceof Error ? error.message : "조회 실패",
    });
  }
}
