import { fetchAsanaTask } from "@/lib/asana";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { taskIdOrUrl } = await request.json();

  if (typeof taskIdOrUrl !== "string" || !taskIdOrUrl.trim()) {
    return Response.json(
      { error: "Asana Task ID 또는 URL을 입력하세요." },
      { status: 400 }
    );
  }

  try {
    const task = await fetchAsanaTask(taskIdOrUrl);
    return Response.json(task);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Asana 조회 중 오류가 발생했습니다.",
      },
      { status: 502 }
    );
  }
}
