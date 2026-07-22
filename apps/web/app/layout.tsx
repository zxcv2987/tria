import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tria",
  description: "AI 기반 이슈 코드 분석 도구",
};

const NAV_LINKS = [
  { href: "/", label: "단일 분석" },
  { href: "/issues", label: "이슈 목록" },
  { href: "/settings/projects", label: "프로젝트 설정" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="flex gap-4 border-b border-zinc-200 px-6 py-3 text-sm dark:border-zinc-800">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Tria
          </span>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {children}
      </body>
    </html>
  );
}
