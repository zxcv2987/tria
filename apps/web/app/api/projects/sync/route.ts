import { listAccessibleRepositories } from "@/lib/github-app";
import {
  planProjectSync,
  type Conflict,
  type ExistingProject,
  type NewProject,
} from "@/lib/project-sync";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

type ProjectRow = {
  id: string;
  key: string;
  github_owner: string;
  github_repository: string;
  is_active: boolean;
};

export async function POST() {
  try {
    const repositories = await listAccessibleRepositories();
    const db = createServiceClient();
    const { data, error } = await db
      .from("project_configs")
      .select("id, key, github_owner, github_repository, is_active");

    if (error || !data) {
      return Response.json(
        { error: `프로젝트 목록 조회 실패: ${error?.message ?? "unknown"}` },
        { status: 500 },
      );
    }

    const existingProjects: ExistingProject[] = (data as ProjectRow[]).map(
      (project) => ({
        id: project.id,
        key: project.key,
        githubOwner: project.github_owner,
        githubRepository: project.github_repository,
        isActive: project.is_active,
      }),
    );
    const plan = planProjectSync(repositories, existingProjects);
    const inserted: (NewProject & { id: string })[] = [];
    const conflicts: Conflict[] = [...plan.conflicts];

    for (const project of plan.toInsert) {
      const { data: insertedRow, error: insertError } = await db
        .from("project_configs")
        .insert({
          key: project.key,
          name: project.name,
          github_owner: project.githubOwner,
          github_repository: project.githubRepository,
          default_ref: project.defaultRef,
          is_active: true,
        })
        .select("id")
        .single();

      if (insertError?.code === "23505") {
        conflicts.push({
          githubOwner: project.githubOwner,
          githubRepository: project.githubRepository,
          conflictingKey: project.key,
        });
        continue;
      }
      if (insertError || !insertedRow) {
        return Response.json(
          {
            error: `프로젝트 생성 실패: ${insertError?.message ?? "unknown"}`,
          },
          { status: 500 },
        );
      }
      inserted.push({ id: (insertedRow as { id: string }).id, ...project });
    }

    if (plan.toDeactivateIds.length > 0) {
      const { error: updateError } = await db
        .from("project_configs")
        .update({ is_active: false })
        .in("id", plan.toDeactivateIds);

      if (updateError) {
        return Response.json(
          { error: `프로젝트 비활성화 실패: ${updateError.message}` },
          { status: 500 },
        );
      }
    }

    return Response.json({
      inserted,
      deactivatedIds: plan.toDeactivateIds,
      conflicts,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "프로젝트 동기화 실패" },
      { status: 500 },
    );
  }
}
