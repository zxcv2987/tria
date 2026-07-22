import { listAsanaProjects } from "@/lib/asana-projects";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listAsanaProjects();
    return Response.json({ projects });
  } catch (error) {
    return Response.json({
      projects: [],
      error: error instanceof Error ? error.message : "조회 실패",
    });
  }
}
