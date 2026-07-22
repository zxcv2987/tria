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
  source_modified_at: string;
};

type ProjectConfigRow = {
  key: string;
  github_repository: string;
  default_ref: string;
  is_active: boolean;
};

/** project_configs에서 allowlist된 repository/ref만 사용 (문서 14장). */
export async function startAnalysis(
  db: SupabaseClient,
  issueId: string
): Promise<StartAnalysisResult> {
  const { data: issue, error: issueError } = await db
    .from("issues")
    .select("id, title, description, project_key, source_modified_at")
    .eq("id", issueId)
    .maybeSingle();

  if (issueError) throw new Error(`이슈 조회 실패: ${issueError.message}`);
  if (!issue) throw new Error(`이슈를 찾을 수 없습니다: ${issueId}`);

  const row = issue as IssueRow;

  const { data: config, error: configError } = await db
    .from("project_configs")
    .select("key, github_repository, default_ref, is_active")
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

/** 문서 5.2 분석 시작 조건. */
export async function canStartAnalysis(
  db: SupabaseClient,
  issue: {
    id: string;
    asana_status: string;
    project_key: string | null;
    source_modified_at: string;
  }
): Promise<boolean> {
  if (issue.asana_status !== "AI 분석 요청") return false;
  if (!issue.project_key) return false;

  const { data: config } = await db
    .from("project_configs")
    .select("id")
    .eq("key", issue.project_key)
    .eq("is_active", true)
    .maybeSingle();
  if (!config) return false;

  const { data: inFlight } = await db
    .from("analysis_runs")
    .select("id")
    .eq("issue_id", issue.id)
    .in("status", ["QUEUED", "RUNNING"])
    .limit(1);
  if (inFlight && inFlight.length > 0) return false;

  const { data: done } = await db
    .from("analysis_runs")
    .select("id")
    .eq("issue_id", issue.id)
    .eq("status", "SUCCEEDED")
    .gte("created_at", issue.source_modified_at)
    .limit(1);
  if (done && done.length > 0) return false;

  return true;
}
