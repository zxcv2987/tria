import Link from "next/link";
import { ProjectConfigForm } from "@/components/project-config-form";
import { fetchProjectsData } from "@/lib/app-data";
import { PageHeader, PageShell } from "@/components/ui/page";
import { linkClass } from "@/components/ui/styles";

export default async function ProjectSettingsPage() {
  const projects = await fetchProjectsData();

  return (
    <PageShell width="wide">
      <PageHeader
        breadcrumb={
          <>
            <Link href="/issues" className={linkClass}>
              이슈 목록
            </Link>
            {" / "}
            설정
          </>
        }
        title="프로젝트 설정"
        description="Asana 프로젝트와 GitHub 저장소 매핑을 관리합니다."
      />

      <ProjectConfigForm initialProjects={projects} />
    </PageShell>
  );
}
