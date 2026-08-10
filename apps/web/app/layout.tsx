import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppNav } from "@/components/app-nav";
import { cn } from "@/lib/utils";
import "./globals.css";

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tria",
  description: "AI 기반 이슈 코드 분석 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={cn("h-full antialiased font-sans", pretendard.variable)}
    >
      <body className="flex min-h-full flex-col font-sans">
        <template dangerouslySetInnerHTML={{ __html: "<!-- THESIS: Evidence moves through an operational strip desk; refuses the generic AI dashboard. OWN-WORLD: charcoal console, warm paper strips, teal controls, amber signals, clipped corners. STORY: scan the queue, open a case, verify repository evidence, choose the next action. FIRST VIEWPORT: dense issue queue beside a dominant evidence sequence and quiet control ledger. FORM: Flight Progress Strip Desk, seed 119d0d3e. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md. -->" }} />
        <AppNav />
        {children}
      </body>
    </html>
  );
}
