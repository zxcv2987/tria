import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCallbackUrl, dispatchAnalyzeIssue } from "./github-dispatch";

export type StartAnalysisResult = {
  analysisRunId: string;
  status: "QUEUED";
};

type IssueRow = {
  id: string;
  title: string;
  description: string;
  project_key: string;
};

type ProjectConfigRow = {
  key: string;
  github_owner: string;
  github_repository: string;
  default_ref: string;
  is_active: boolean;
};

/** 같은 이슈에 대해 QUEUED/RUNNING 상태인 실행이 이미 있는지 (문서 5.2, 18장). */
export async function hasInFlightRun(
  db: SupabaseClient,
  issueId: string
): Promise<boolean> {
  const { data } = await db
    .from("analysis_runs")
    .select("id")
    .eq("issue_id", issueId)
    .in("status", ["QUEUED", "RUNNING"])
    .limit(1);
  return !!data && data.length > 0;
}

/**
 * project_configs에서 allowlist된 repository/ref만 사용 (문서 14장).
 *
 * notifyUrl: 접수 API(문서 5.1절)로 시작된 실행에만 채워진다 — 완료/실패 시
 * 이 주소로 결과를 통보한다 (analysis/callback route 참고). UI 재분석
 * 버튼으로 시작된 실행은 notifyUrl 없이 Tria 웹에서만 결과를 확인한다.
 */
export async function startAnalysis(
  db: SupabaseClient,
  issueId: string,
  options: { notifyUrl?: string } = {}
): Promise<StartAnalysisResult> {
  const { data: issue, error: issueError } = await db
    .from("issues")
    .select("id, title, description, project_key")
    .eq("id", issueId)
    .maybeSingle();

  if (issueError) throw new Error(`이슈 조회 실패: ${issueError.message}`);
  if (!issue) throw new Error(`이슈를 찾을 수 없습니다: ${issueId}`);

  const row = issue as IssueRow;

  const { data: config, error: configError } = await db
    .from("project_configs")
    .select("key, github_owner, github_repository, default_ref, is_active")
    .eq("key", row.project_key)
    .eq("is_active", true)
    .maybeSingle();

  if (configError) {
    throw new Error(`프로젝트 설정 조회 실패: ${configError.message}`);
  }
  if (!config) {
    throw new Error(
      `활성 프로젝트 설정이 없습니다 (project_key=${row.project_key}).`
    );
  }

  const project = config as ProjectConfigRow;

  const { data: run, error: insertError } = await db
    .from("analysis_runs")
    .insert({
      issue_id: row.id,
      status: "QUEUED",
      target_repository: project.github_repository,
      target_ref: project.default_ref,
      notify_url: options.notifyUrl ?? null,
      evidence: [],
      external_checks: [],
      missing_information: [],
      limitations: [],
    })
    .select("id")
    .single();

  if (insertError || !run) {
    throw new Error(
      `analysis_runs 생성 실패: ${insertError?.message ?? "unknown"}`
    );
  }

  const analysisRunId = (run as { id: string }).id;

  try {
    await dispatchAnalyzeIssue({
      analysisRunId,
      projectKey: project.key,
      repositoryOwner: project.github_owner,
      repositoryName: project.github_repository,
      ref: project.default_ref,
      issueTitle: row.title,
      issueBody: row.description ?? "",
      callbackUrl: buildCallbackUrl(),
    });
  } catch (err) {
    await db
      .from("analysis_runs")
      .update({
        status: "FAILED",
        failure_reason:
          err instanceof Error ? err.message : "repository_dispatch 실패",
        finished_at: new Date().toISOString(),
      })
      .eq("id", analysisRunId);
    throw err;
  }

  return { analysisRunId, status: "QUEUED" };
}
