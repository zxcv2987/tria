"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "단일 분석", match: (path: string) => path === "/" },
  {
    href: "/issues",
    label: "이슈 목록",
    match: (path: string) => path.startsWith("/issues"),
  },
  {
    href: "/settings/projects",
    label: "프로젝트 설정",
    match: (path: string) => path.startsWith("/settings"),
  },
];

export function AppNav() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav
        className="mx-auto flex h-12 max-w-6xl items-center gap-1 overflow-x-auto px-6 sm:px-8"
        aria-label="주요 메뉴"
      >
        <Link
          href={isLogin ? "/login" : "/"}
          className="mr-3 shrink-0 text-[0.9375rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Tria
        </Link>
        {!isLogin ? (
          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = link.match(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "shrink-0 rounded-md bg-zinc-100 px-2.5 py-1.5 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "shrink-0 rounded-md px-2.5 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  }
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
