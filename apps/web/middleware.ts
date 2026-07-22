import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth";

// ponytail: 정식 SSO(문서 17장, TODO(auth)) 붙기 전까지의 임시 방어선.
// /issues, /settings와 그 안에서 쓰는 쓰기 API만 막는다 — Asana 웹훅,
// Runner callback/status는 각자 별도 secret으로 인증하므로 여기서 막지 않는다.
const PROTECTED_PAGE_PATHS = ["/issues", "/settings"];

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isProtectedApi(pathname: string): boolean {
  if (pathname === "/api/projects" || pathname.startsWith("/api/projects/")) {
    return true;
  }
  // /api/issues/[id], /api/issues/[id]/analyze — 이슈 삭제/재분석
  if (/^\/api\/issues\/[^/]+(\/analyze)?$/.test(pathname)) return true;
  // /api/analysis/[runId]/feedback — 분석 피드백 저장
  return /^\/api\/analysis\/[^/]+\/feedback$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPage = isProtectedPage(pathname);
  const isApi = isProtectedApi(pathname);
  if (!isPage && !isApi) return NextResponse.next();

  const authed = request.cookies.get(SESSION_COOKIE)?.value === SESSION_VALUE;
  if (authed) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/issues/:path*", "/settings/:path*", "/api/:path*"],
};
