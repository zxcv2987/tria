import Link from "next/link";
import { IssueListTable } from "@/components/issue-list-table";
import { fetchIssuesPageData } from "@/lib/app-data";
import { PageHeader, PageShell } from "@/components/ui/page";
import { btnGhostClass, linkClass } from "@/components/ui/styles";

export default async function IssuesPage() {
  const { issues, runs, projects } = await fetchIssuesPageData();

  return (
    <PageShell width="wide">
      <PageHeader
        breadcrumb={
          <>
            <Link href="/" className={linkClass}>
              Tria
            </Link>
            {" / "}
            이슈
          </>
        }
        title="이슈 목록"
        description="프로젝트별 이슈와 분석 상태를 한눈에 확인합니다."
        actions={
          <Link
            href="/settings/projects"
            className={`${btnGhostClass} hidden sm:inline-flex`}
          >
            프로젝트 설정
          </Link>
        }
      />

      <IssueListTable issues={issues} runs={runs} projects={projects} />
    </PageShell>
  );
}
