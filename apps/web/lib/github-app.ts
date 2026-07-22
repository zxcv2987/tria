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

export type RepoRef = { owner: string; repo: string };

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
    if (!tokenRes.ok) continue;
    const { token } = (await tokenRes.json()) as { token: string };

    const reposRes = await fetch(`${GITHUB_API}/installation/repositories`, {
      headers: { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` },
    });
    if (!reposRes.ok) continue;
    const data = (await reposRes.json()) as {
      repositories: { name: string; owner: { login: string } }[];
    };
    for (const r of data.repositories) {
      repos.push({ owner: r.owner.login, repo: r.name });
    }
  }

  return repos;
}
