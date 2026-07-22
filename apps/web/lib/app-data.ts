import { tryCreateServiceClient } from "./supabase";
import {
  MOCK_ANALYSIS_RUNS,
  MOCK_ISSUES,
  MOCK_PROJECTS,
  type AnalysisRun,
  type Issue,
  type ProjectConfig,
} from "@/components/mock-data";

type IssueRow = {
  id: string;
  asana_task_gid: string;
  asana_url: string;
  title: string;
  description: string;
  project_key: string;
  environment: string | null;
  occurred_url: string | null;
  reproduction_steps: string | null;
  expected_result: string | null;
  actual_result: string | null;
  asana_status: string;
  source_modified_at: string;
  created_at: string;
  updated_at: string;
};

type AnalysisRunRow = {
  id: string;
  issue_id: string;
  status: AnalysisRun["status"];
  result_type: AnalysisRun["resultType"];
  target_repository: string;
  target_ref: string;
  target_commit_sha: string | null;
  summary: string | null;
  suspected_area: string | null;
  evidence: AnalysisRun["evidence"] | null;
  external_checks: string[] | null;
  missing_information: string[] | null;
  limitations: string[] | null;
  workflow_run_url: string | null;
  failure_reason: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

type ProjectConfigRow = {
  id: string;
  key: string;
  name: string;
  asana_project_value: string;
  github_owner: string;
  github_repository: string;
  default_ref: string;
  is_active: boolean;
};

// ponytail: analysisPrompt는 12장 타입/DB 스키마에 없는 화면 전용 필드라 읽기 전용 빈 값으로 채운다.
function mapIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    asanaTaskGid: row.asana_task_gid,
    asanaUrl: row.asana_url,
    title: row.title,
    description: row.description,
    projectKey: row.project_key,
    environment: row.environment,
    occurredUrl: row.occurred_url,
    reproductionSteps: row.reproduction_steps,
    expectedResult: row.expected_result,
    actualResult: row.actual_result,
    asanaStatus: row.asana_status,
    sourceModifiedAt: row.source_modified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments: [],
  };
}

function mapRun(row: AnalysisRunRow): AnalysisRun {
  return {
    id: row.id,
    issueId: row.issue_id,
    status: row.status,
    resultType: row.result_type,
    targetRepository: row.target_repository,
    targetRef: row.target_ref,
    targetCommitSha: row.target_commit_sha,
    summary: row.summary,
    suspectedArea: row.suspected_area,
    evidence: row.evidence ?? [],
    externalChecks: row.external_checks ?? [],
    missingInformation: row.missing_information ?? [],
    limitations: row.limitations ?? [],
    workflowRunUrl: row.workflow_run_url,
    failureReason: row.failure_reason,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  };
}

function mapProject(row: ProjectConfigRow): ProjectConfig {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    asanaProjectValue: row.asana_project_value,
    githubOwner: row.github_owner,
    githubRepository: row.github_repository,
    defaultRef: row.default_ref,
    isActive: row.is_active,
    analysisPrompt: "",
  };
}

export async function fetchIssuesPageData(): Promise<{
  issues: Issue[];
  runs: AnalysisRun[];
  projects: ProjectConfig[];
}> {
  const db = tryCreateServiceClient();
  if (!db) {
    return {
      issues: MOCK_ISSUES,
      runs: MOCK_ANALYSIS_RUNS,
      projects: MOCK_PROJECTS,
    };
  }

  const [issuesRes, runsRes, projectsRes] = await Promise.all([
    db.from("issues").select("*").order("created_at", { ascending: false }),
    db.from("analysis_runs").select("*"),
    db.from("project_configs").select("*"),
  ]);

  return {
    issues: ((issuesRes.data as IssueRow[]) ?? []).map(mapIssue),
    runs: ((runsRes.data as AnalysisRunRow[]) ?? []).map(mapRun),
    projects: ((projectsRes.data as ProjectConfigRow[]) ?? []).map(
      mapProject,
    ),
  };
}

export async function fetchIssueDetailData(
  id: string,
): Promise<{ issue: Issue; runs: AnalysisRun[] } | null> {
  const db = tryCreateServiceClient();
  if (!db) {
    const issue = MOCK_ISSUES.find((item) => item.id === id);
    return issue ? { issue, runs: MOCK_ANALYSIS_RUNS } : null;
  }

  const { data: issueRow } = await db
    .from("issues")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!issueRow) return null;

  const { data: runRows } = await db
    .from("analysis_runs")
    .select("*")
    .eq("issue_id", id);

  return {
    issue: mapIssue(issueRow as IssueRow),
    runs: ((runRows as AnalysisRunRow[]) ?? []).map(mapRun),
  };
}

export async function fetchProjectsData(): Promise<ProjectConfig[]> {
  const db = tryCreateServiceClient();
  if (!db) return MOCK_PROJECTS;

  const { data } = await db
    .from("project_configs")
    .select("*")
    .order("name", { ascending: true });

  return ((data as ProjectConfigRow[]) ?? []).map(mapProject);
}
