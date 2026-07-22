import Link from "next/link";
import { notFound } from "next/navigation";
import { IssueDetailCard } from "@/components/issue-detail-card";
import {
  MOCK_ISSUES,
  getLatestRun,
  toAnalysisResult,
} from "@/components/mock-data";
import { PageHeader, PageShell } from "@/components/ui/page";
import { linkClass } from "@/components/ui/styles";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params;

  // TODO: /api/issues/[id] 연동
  const issue = MOCK_ISSUES.find((item) => item.id === id);
  if (!issue) notFound();

  const run = getLatestRun(issue.id);
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
