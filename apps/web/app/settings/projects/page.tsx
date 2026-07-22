import Link from "next/link";
import { ProjectConfigForm } from "@/components/project-config-form";
import { MOCK_PROJECTS } from "@/components/mock-data";

export default function ProjectSettingsPage() {
  // TODO: /api/projects 연동
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/issues" className="hover:underline">
              이슈 목록
            </Link>
            {" / "}
            설정
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            프로젝트 설정
          </h1>
        </div>

        <ProjectConfigForm initialProjects={MOCK_PROJECTS} />
      </main>
    </div>
  );
}
