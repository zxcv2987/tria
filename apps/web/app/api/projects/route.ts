import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

type ProjectPayload = {
  key: string;
  name: string;
  githubOwner: string;
  githubRepository: string;
  defaultRef: string;
  isActive: boolean;
};

function isProjectPayload(value: unknown): value is ProjectPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.key === "string" &&
    typeof v.name === "string" &&
    typeof v.githubOwner === "string" &&
    typeof v.githubRepository === "string" &&
    typeof v.defaultRef === "string" &&
    typeof v.isActive === "boolean"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isProjectPayload(body)) {
    return Response.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
  }

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("project_configs")
      .insert({
        key: body.key,
        name: body.name,
        github_owner: body.githubOwner,
        github_repository: body.githubRepository,
        default_ref: body.defaultRef,
        is_active: body.isActive,
      })
      .select("id")
      .single();

    if (error || !data) {
      return Response.json(
        { error: `프로젝트 생성 실패: ${error?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    return Response.json({ id: (data as { id: string }).id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "프로젝트 생성 실패" },
      { status: 500 }
    );
  }
}
