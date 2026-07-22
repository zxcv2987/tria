import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "issue id가 필요합니다." }, { status: 400 });
  }

  try {
    const db = createServiceClient();
    const { error } = await db.from("issues").delete().eq("id", id);
    if (error) {
      return Response.json(
        { error: `이슈 삭제 실패: ${error.message}` },
        { status: 500 }
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "이슈 삭제 실패" },
      { status: 500 }
    );
  }
}
