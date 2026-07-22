import { SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth";

export const runtime = "nodejs";

// ponytail: 정식 SSO 붙기 전 임시 로그인. 자격증명은 하드코딩 — 실제 인증으로 교체 예정.
const VALID_USERNAME = "test";
const VALID_PASSWORD = "test";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username =
    typeof body === "object" && body !== null && "username" in body
      ? (body as { username: unknown }).username
      : null;
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? (body as { password: unknown }).password
      : null;

  if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${SESSION_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
  return response;
}
