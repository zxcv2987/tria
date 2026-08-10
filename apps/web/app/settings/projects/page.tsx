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
        breadcrumb={<><Link href="/issues" className={linkClass}>ISSUE QUEUE</Link>{" / PROJECT CONTROL"}</>}
        title="프로젝트 관제"
        description="접수 키와 GitHub 저장소의 분석 경로를 관리합니다."
      />

      <ProjectConfigForm initialProjects={projects} />
    </PageShell>
  );
}
