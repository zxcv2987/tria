import Link from "next/link";
import { notFound } from "next/navigation";
import { IssueDetailCard } from "@/components/issue-detail-card";
import { getLatestRun, toAnalysisResult } from "@/components/mock-data";
import { fetchIssueDetailData } from "@/lib/app-data";
import { PageHeader, PageShell } from "@/components/ui/page";
import { linkClass } from "@/components/ui/styles";

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
    <PageShell width="medium">
      <PageHeader
        breadcrumb={
          <>
            <Link href="/issues" className={linkClass}>
              이슈 목록
            </Link>
            {" / "}
            <span className="font-mono text-[0.7rem]">{issue.id}</span>
          </>
        }
        title={issue.title}
      />

      <IssueDetailCard
        issue={issue}
        run={run}
        analysisResult={analysisResult}
      />
    </PageShell>
  );
}
