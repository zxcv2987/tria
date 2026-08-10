"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
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
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <nav
        className="mx-auto flex h-12 max-w-6xl items-center gap-1 overflow-x-auto px-6 sm:px-8"
        aria-label="주요 메뉴"
      >
        <Link
          href={isLogin ? "/login" : "/issues"}
          className="mr-3 shrink-0 text-[0.9375rem] font-semibold tracking-tight text-foreground"
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
                      ? "shrink-0 rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium text-foreground"
                      : "shrink-0 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
