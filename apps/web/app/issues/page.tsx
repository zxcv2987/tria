import Link from "next/link";
import { IssueListTable } from "@/components/issue-list-table";
import { fetchIssuesPageData } from "@/lib/app-data";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Button } from "@/components/ui/button";

export default async function IssuesPage() {
  const { issues, runs, projects } = await fetchIssuesPageData();

  return (
    <PageShell width="wide">
      <PageHeader
        breadcrumb="ISSUE OPERATIONS / LIVE QUEUE"
        title="이슈 조사 큐"
        description="분석 상태를 훑고, 검증된 코드 근거가 준비된 이슈부터 조사합니다."
        actions={
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link href="/settings/projects">프로젝트 설정</Link>
          </Button>
        }
      />

      <IssueListTable issues={issues} runs={runs} projects={projects} />
    </PageShell>
  );
}
