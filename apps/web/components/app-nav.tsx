"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListFilter, Settings2 } from "lucide-react";

const links = [
  { href: "/issues", label: "이슈 큐", icon: ListFilter, match: (p: string) => p.startsWith("/issues") },
  { href: "/settings/projects", label: "프로젝트", icon: Settings2, match: (p: string) => p.startsWith("/settings") },
];

export function AppNav() {
  const pathname = usePathname();
  if (pathname === "/login") return <header className="h-1 bg-primary" />;

  return (
    <header className="sticky top-0 z-30 border-b border-console-line bg-console text-white">
      <nav className="mx-auto flex h-12 max-w-[1600px] items-center px-4 sm:px-6 lg:px-8" aria-label="주요 메뉴">
        <Link href="/issues" className="mr-6 flex items-center gap-2 text-sm font-semibold tracking-[0.08em] text-strip">
          <span className="grid size-6 place-items-center border border-primary bg-primary/15 text-xs text-primary">T</span>
          TRIA
        </Link>
        <div className="flex h-full items-center">
          {links.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "flex h-full items-center gap-2 border-b-2 border-primary px-3 text-sm text-white" : "flex h-full items-center gap-2 border-b-2 border-transparent px-3 text-sm text-white/60 hover:text-white"}>
                <Icon className="size-3.5" aria-hidden="true" />{label}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto hidden items-center gap-2 text-xs font-medium text-white/70 sm:flex">
          개발자 조사 작업대
        </div>
      </nav>
    </header>
  );
}
