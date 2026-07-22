import Link from "next/link";
import { notFound } from "next/navigation";
import { IssueDetailCard } from "@/components/issue-detail-card";
import { getLatestRun, toAnalysisResult } from "@/components/mock-data";
import { fetchIssueDetailData } from "@/lib/app-data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params;

  const data = await fetchIssueDetailData(id);
  if (!data) notFound();
  const { issue, runs } = data;

  const run = getLatestRun(runs, issue.id);
  const analysisResult = run ? toAnalysisResult(run) : null;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/issues" className="hover:underline">
              이슈 목록
            </Link>
            {" / "}
            {issue.id}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {issue.title}
          </h1>
        </div>

        <IssueDetailCard
          issue={issue}
          run={run}
          analysisResult={analysisResult}
        />
      </main>
    </div>
  );
}
