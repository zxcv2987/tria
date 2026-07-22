import Link from "next/link";
import { IssueListTable } from "@/components/issue-list-table";
import { MOCK_ISSUES, MOCK_PROJECTS } from "@/components/mock-data";

export default function IssuesPage() {
  // TODO: /api/issues 연동
  const issues = MOCK_ISSUES;
  const projectKeys = MOCK_PROJECTS.map((p) => p.key);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500">
              <Link href="/" className="hover:underline">
                Tria
              </Link>
              {" / "}
              이슈
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              이슈 목록
            </h1>
          </div>
          <Link
            href="/settings/projects"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300"
          >
            프로젝트 설정
          </Link>
        </div>

        <IssueListTable issues={issues} projectKeys={projectKeys} />
      </main>
    </div>
  );
}
