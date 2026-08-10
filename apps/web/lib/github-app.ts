import { createSign } from "node:crypto";

const GITHUB_API = "https://api.github.com";
const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signAppJwt(): string {
  const appId = process.env.TRIA_READER_CLIENT_ID;
  const rawKey = process.env.TRIA_READER_PRIVATE_KEY;
  if (!appId || !rawKey) {
    throw new Error(
      "TRIA_READER_CLIENT_ID/TRIA_READER_PRIVATE_KEY 환경변수가 필요합니다."
    );
  }
  // .env에 pem을 한 줄로 넣으면 개행이 \n 문자열로 저장되는 경우가 많다.
  const privateKey = rawKey.includes("\\n")
    ? rawKey.replace(/\\n/g, "\n")
    : rawKey;

  const now = Math.floor(Date.now() / 1000);
  const unsigned = [
    base64url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    base64url(JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: appId })),
  ].join(".");
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);

  return `${unsigned}.${base64url(signature)}`;
}

export type RepoRef = { owner: string; repo: string; defaultBranch: string };

/** TRIA_READER App이 설치된 모든 저장소 목록 (여러 installation에 걸쳐 합산). */
export async function listAccessibleRepositories(): Promise<RepoRef[]> {
  const jwt = signAppJwt();

  const installationsRes = await fetch(`${GITHUB_API}/app/installations`, {
    headers: { ...GITHUB_HEADERS, Authorization: `Bearer ${jwt}` },
  });
  if (!installationsRes.ok) {
    throw new Error(
      `GitHub App installations 조회 실패 (${installationsRes.status})`
    );
  }
  const installations = (await installationsRes.json()) as { id: number }[];

  const repos: RepoRef[] = [];
  for (const installation of installations) {
    const tokenRes = await fetch(
      `${GITHUB_API}/app/installations/${installation.id}/access_tokens`,
      {
        method: "POST",
        headers: { ...GITHUB_HEADERS, Authorization: `Bearer ${jwt}` },
      }
    );
    // 목록이 불완전하면 project-sync가 여전히 설치된 저장소를 "해제됨"으로
    // 오판해 비활성화할 수 있다 — 그냥 건너뛰지 않고 실패를 드러낸다.
    if (!tokenRes.ok) {
      throw new Error(
        `installation ${installation.id} 토큰 발급 실패 (${tokenRes.status})`
      );
    }
    const { token } = (await tokenRes.json()) as { token: string };

    // GitHub 기본 페이지 크기(30)로는 저장소가 많은 installation의 뒷부분이
    // 잘려서 같은 이유로 오판된 비활성화를 유발한다 — 끝까지 페이지네이션한다.
    for (let page = 1; ; page++) {
      const reposRes = await fetch(
        `${GITHUB_API}/installation/repositories?per_page=100&page=${page}`,
        { headers: { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` } }
      );
      if (!reposRes.ok) {
        throw new Error(
          `installation ${installation.id} 저장소 목록 조회 실패 (${reposRes.status})`
        );
      }
      const data = (await reposRes.json()) as {
        repositories: {
          name: string;
          owner: { login: string };
          default_branch: string;
        }[];
      };
      for (const r of data.repositories) {
        repos.push({
          owner: r.owner.login,
          repo: r.name,
          defaultBranch: r.default_branch,
        });
      }
      if (data.repositories.length < 100) break;
    }
  }

  return repos;
}
