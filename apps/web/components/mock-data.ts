import type {
  AnalysisEvidence,
  AnalysisResult,
  TokenUsage,
} from "@tria/analysis";

// 문서 12장 형태 — UI mock 전용
export type Issue = {
  id: string;
  source: string;
  externalRef: string | null;
  externalUrl: string | null;
  title: string;
  description: string;
  projectKey: string;
  environment: string | null;
  occurredUrl: string | null;
  reproductionSteps: string | null;
  expectedResult: string | null;
  actualResult: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
};

export type AnalysisRun = {
  id: string;
  issueId: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  resultType: AnalysisResult["result"] | null;
  targetRepository: string;
  targetRef: string;
  targetCommitSha: string | null;
  summary: string | null;
  suspectedArea: string | null;
  evidence: AnalysisEvidence[];
  externalChecks: string[];
  missingInformation: string[];
  limitations: string[];
  workflowRunUrl: string | null;
  failureReason: string | null;
  tokenUsage: TokenUsage | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type ProjectConfig = {
  id: string;
  key: string;
  name: string;
  githubOwner: string;
  githubRepository: string;
  defaultRef: string;
  isActive: boolean;
  // ponytail: 12장 타입에 없으나 9.3 화면 항목
  analysisPrompt: string;
};

export const MOCK_PROJECTS: ProjectConfig[] = [
  {
    id: "proj-1",
    key: "classroom",
    name: "Classroom",
    githubOwner: "tria-org",
    githubRepository: "classroom-web",
    defaultRef: "main",
    isActive: true,
    analysisPrompt: "프론트엔드 캐시/상태 이슈를 우선 확인한다.",
  },
  {
    id: "proj-2",
    key: "billing",
    name: "Billing",
    githubOwner: "tria-org",
    githubRepository: "billing-api",
    defaultRef: "main",
    isActive: true,
    analysisPrompt: "결제 웹훅과 멱등성 처리를 우선 확인한다.",
  },
  {
    id: "proj-3",
    key: "admin",
    name: "Admin Console",
    githubOwner: "tria-org",
    githubRepository: "admin-console",
    defaultRef: "develop",
    isActive: false,
    analysisPrompt: "권한/역할 매핑 오류를 우선 확인한다.",
  },
];

export const MOCK_ISSUES: Issue[] = [
  {
    id: "issue-1",
    source: "asana",
    externalRef: "1201001",
    externalUrl: "https://app.asana.com/0/1200/1201001",
    title: "강의 수정 후 목록이 갱신되지 않음",
    description:
      "강의 제목을 수정하고 저장하면 목록 화면에서 이전 제목이 그대로 보입니다. 새로고침 후에는 반영됩니다.",
    projectKey: "classroom",
    environment: "production / Chrome 126",
    occurredUrl: "https://classroom.example.com/courses/42",
    reproductionSteps:
      "1. 강의 상세에서 제목 수정\n2. 저장\n3. 목록으로 이동",
    expectedResult: "목록에 수정된 제목이 바로 반영된다.",
    actualResult: "이전 제목이 유지되고, 새로고침 후에야 반영된다.",
    createdAt: "2026-07-20T08:50:00+09:00",
    updatedAt: "2026-07-20T10:05:00+09:00",
    attachments: ["screenshot-list.png"],
  },
  {
    id: "issue-2",
    source: "asana",
    externalRef: "1201002",
    externalUrl: "https://app.asana.com/0/1200/1201002",
    title: "결제 완료 후에도 미결제 배지 표시",
    description:
      "카드 결제가 성공했는데 마이페이지에 미결제 배지가 남아 있습니다.",
    projectKey: "billing",
    environment: "staging / Safari 17",
    occurredUrl: "https://billing.example.com/me",
    reproductionSteps:
      "1. 미결제 상태에서 결제 진행\n2. 성공 확인\n3. 마이페이지 진입",
    expectedResult: "미결제 배지가 사라진다.",
    actualResult: "배지가 계속 표시된다.",
    createdAt: "2026-07-21T13:40:00+09:00",
    updatedAt: "2026-07-21T14:10:00+09:00",
    attachments: [],
  },
  {
    id: "issue-3",
    source: "manual",
    externalRef: null,
    externalUrl: null,
    title: "관리자 메뉴가 일부 계정에서 비어 있음",
    description: "특정 관리자 계정으로 로그인하면 사이드 메뉴가 비어 있습니다.",
    projectKey: "admin",
    environment: null,
    occurredUrl: null,
    reproductionSteps: null,
    expectedResult: null,
    actualResult: "메뉴가 렌더링되지 않는다.",
    createdAt: "2026-07-22T08:30:00+09:00",
    updatedAt: "2026-07-22T09:20:00+09:00",
    attachments: [],
  },
];

export const MOCK_ANALYSIS_RUNS: AnalysisRun[] = [
  {
    id: "run-1",
    issueId: "issue-1",
    status: "SUCCEEDED",
    resultType: "CODE_LIKELY",
    targetRepository: "tria-org/classroom-web",
    targetRef: "main",
    targetCommitSha: "a1b2c3d4e5f67890",
    summary:
      "강의 수정 후 목록 쿼리 캐시가 invalidate되지 않아 stale 데이터가 유지되는 것으로 보입니다.",
    suspectedArea: "강의 수정 mutation / 목록 쿼리 캐시",
    evidence: [
      {
        path: "src/features/course/hooks/useUpdateCourse.ts",
        symbol: "useUpdateCourse",
        reason: "성공 콜백에서 목록 쿼리 invalidate가 없습니다.",
      },
      {
        path: "src/features/course/api/courseKeys.ts",
        symbol: "courseKeys.list",
        reason: "목록 쿼리 키 정의는 있으나 mutation과 연결되지 않습니다.",
      },
    ],
    externalChecks: ["CDN/브라우저 캐시 여부 확인"],
    missingInformation: [],
    limitations: [
      "런타임 네트워크 응답은 확인하지 못했습니다.",
      "서버 사이드 캐시는 분석 범위 밖입니다.",
    ],
    workflowRunUrl: "https://github.com/tria-org/classroom-web/actions/runs/101",
    failureReason: null,
    tokenUsage: {
      inputTokens: 12400,
      outputTokens: 1800,
      totalTokens: 14200,
      model: "gemini-2.0-flash",
    },
    startedAt: "2026-07-20T09:30:00+09:00",
    finishedAt: "2026-07-20T09:42:00+09:00",
    createdAt: "2026-07-20T09:28:00+09:00",
  },
  {
    id: "run-2",
    issueId: "issue-2",
    status: "RUNNING",
    resultType: null,
    targetRepository: "tria-org/billing-api",
    targetRef: "main",
    targetCommitSha: null,
    summary: null,
    suspectedArea: null,
    evidence: [],
    externalChecks: [],
    missingInformation: [],
    limitations: [],
    workflowRunUrl: "https://github.com/tria-org/billing-api/actions/runs/202",
    failureReason: null,
    tokenUsage: null,
    startedAt: "2026-07-21T14:05:00+09:00",
    finishedAt: null,
    createdAt: "2026-07-21T14:04:00+09:00",
  },
  {
    id: "run-3",
    issueId: "issue-3",
    status: "SUCCEEDED",
    resultType: "NEED_MORE_INFO",
    targetRepository: "tria-org/admin-console",
    targetRef: "develop",
    targetCommitSha: "9988776655443322",
    summary:
      "계정/역할 정보가 부족해 메뉴 비표시 원인을 특정하기 어렵습니다.",
    suspectedArea: "권한 가드 / 메뉴 필터",
    evidence: [],
    externalChecks: [],
    missingInformation: [
      "해당 계정의 역할(role) 값",
      "재현 절차와 기대 결과",
      "발생 URL",
    ],
    limitations: ["이슈 본문만으로는 화면/기능을 특정할 수 없습니다."],
    workflowRunUrl: "https://github.com/tria-org/admin-console/actions/runs/303",
    failureReason: null,
    tokenUsage: {
      inputTokens: 8200,
      outputTokens: 900,
      totalTokens: 9100,
      model: "gemini-2.0-flash",
    },
    startedAt: "2026-07-22T09:05:00+09:00",
    finishedAt: "2026-07-22T09:12:00+09:00",
    createdAt: "2026-07-22T09:04:00+09:00",
  },
];

export function getLatestRun(
  runs: AnalysisRun[],
  issueId: string,
): AnalysisRun | undefined {
  return runs
    .filter((r) => r.issueId === issueId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function getProjectName(
  projects: ProjectConfig[],
  projectKey: string,
): string {
  return projects.find((p) => p.key === projectKey)?.name ?? projectKey;
}

/** AnalysisRun → @tria/analysis AnalysisResult (결과 표시용, resultType 그대로) */
export function toAnalysisResult(run: AnalysisRun): AnalysisResult | null {
  if (!run.resultType || !run.summary) return null;
  return {
    result: run.resultType,
    summary: run.summary,
    suspectedArea: run.suspectedArea,
    evidence: run.evidence,
    externalChecks: run.externalChecks,
    missingInformation: run.missingInformation,
    limitations: run.limitations,
  };
}

export const ANALYSIS_STATUS_LABEL: Record<AnalysisRun["status"], string> = {
  QUEUED: "분석 대기",
  RUNNING: "분석 중",
  SUCCEEDED: "분석 완료",
  FAILED: "분석 실패",
};

export const RESULT_TYPE_LABEL: Record<
  NonNullable<AnalysisRun["resultType"]>,
  string
> = {
  CODE_LIKELY: "코드 원인 유력",
  CHECK_EXTERNAL: "외부 점검 권장",
  NEED_MORE_INFO: "추가 정보 필요",
};

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
}
