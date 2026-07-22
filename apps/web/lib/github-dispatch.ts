export type AnalyzeDispatchPayload = {
  analysisRunId: string;
  projectKey: string;
  repositoryName: string;
  ref: string;
  issueTitle: string;
  issueBody: string;
  callbackUrl: string;
};

/**
 * Tria 저장소에 repository_dispatch (event_type: analyze-issue).
 * Env:
 * - GITHUB_DISPATCH_TOKEN — GitHub App 설치 토큰 또는 PAT
 * - TRIA_GITHUB_OWNER / TRIA_GITHUB_REPO — dispatch 대상(Tria 자신)
 */
export async function dispatchAnalyzeIssue(
  payload: AnalyzeDispatchPayload
): Promise<void> {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_DISPATCH_TOKEN 환경변수가 없습니다. GitHub App 설치 토큰 또는 PAT을 설정하세요."
    );
  }

  const owner = process.env.TRIA_GITHUB_OWNER;
  const repo = process.env.TRIA_GITHUB_REPO;
  if (!owner || !repo) {
    throw new Error(
      "TRIA_GITHUB_OWNER/TRIA_GITHUB_REPO 환경변수가 필요합니다."
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "analyze-issue",
        client_payload: payload,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `GitHub repository_dispatch 실패 (${res.status}): ${body}`
    );
  }
}

export function buildCallbackUrl(): string {
  const base = process.env.TRIA_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error("TRIA_PUBLIC_BASE_URL 환경변수가 필요합니다.");
  }
  return `${base.replace(/\/$/, "")}/api/analysis/callback`;
}
