"use client";

import { AnalysisStatusBadge, ResultBadge } from "@/components/status-badges";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaperStrip } from "@/components/ui/workbench";
import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ANALYSIS_STATUS_LABEL, RESULT_TYPE_LABEL, formatDateTime, getLatestRun, getProjectName, type AnalysisRun, type Issue, type ProjectConfig } from "./mock-data";

const ALL = "ALL";

type Props = { issues: Issue[]; runs: AnalysisRun[]; projects: ProjectConfig[] };

function shortDate(value?: string | null) {
  if (!value) return "실행 없음";
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function IssueListTable({ issues, runs, projects }: Props) {
  const [status, setStatus] = useState(ALL);
  const [project, setProject] = useState(ALL);
  const [result, setResult] = useState(ALL);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => issues.map((issue) => ({ issue, run: getLatestRun(runs, issue.id) })), [issues, runs]);
  const counts = useMemo(() => ({
    ALL: rows.length,
    QUEUED: rows.filter(({ run }) => run?.status === "QUEUED" || !run).length,
    RUNNING: rows.filter(({ run }) => run?.status === "RUNNING").length,
    SUCCEEDED: rows.filter(({ run }) => run?.status === "SUCCEEDED").length,
    FAILED: rows.filter(({ run }) => run?.status === "FAILED").length,
  }), [rows]);
  const filtered = useMemo(() => rows.filter(({ issue, run }) => {
    if (status !== ALL && (status === "QUEUED" ? run && run.status !== "QUEUED" : run?.status !== status)) return false;
    if (project !== ALL && issue.projectKey !== project) return false;
    if (result !== ALL && run?.resultType !== result) return false;
    return issue.title.toLocaleLowerCase("ko").includes(query.trim().toLocaleLowerCase("ko"));
  }), [rows, status, project, result, query]);

  return (
    <section className="console-grid min-h-[520px] border border-console-line bg-console text-white" aria-label="이슈 운영 보드">
      <div className="flex flex-wrap items-center gap-1 border-b border-console-line bg-console-muted p-2">
        {(["ALL", "QUEUED", "RUNNING", "SUCCEEDED", "FAILED"] as const).map((key) => (
          <button key={key} type="button" onClick={() => setStatus(key)} aria-pressed={status === key} className={status === key ? "min-h-11 border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground sm:min-h-0" : "min-h-11 border border-console-line px-3 py-1.5 text-xs text-white/75 hover:text-white sm:min-h-0"}>
            {key === "ALL" ? "전체" : ANALYSIS_STATUS_LABEL[key]} <span className="ml-1 text-xs opacity-60">{counts[key]}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-xs font-medium text-white/70"><SlidersHorizontal className="size-3" /> 필터 제어</div>
      </div>

      <div className="grid gap-2 border-b border-console-line p-2 sm:grid-cols-[180px_180px_1fr]">
        <Select value={project} onValueChange={setProject}><SelectTrigger aria-label="프로젝트 필터" className="h-8 border-console-line bg-console text-xs text-white"><SelectValue placeholder="전체 프로젝트" /></SelectTrigger><SelectContent><SelectItem value={ALL}>전체 프로젝트</SelectItem>{projects.map((p) => <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>)}</SelectContent></Select>
        <Select value={result} onValueChange={setResult}><SelectTrigger aria-label="AI 판정 필터" className="h-8 border-console-line bg-console text-xs text-white"><SelectValue placeholder="전체 판정" /></SelectTrigger><SelectContent><SelectItem value={ALL}>전체 판정</SelectItem>{Object.entries(RESULT_TYPE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <div className="relative"><Search className="absolute left-2.5 top-2 size-3.5 text-white/60" /><Input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="제목 검색" placeholder="이슈 제목 검색" className="h-8 border-console-line bg-console pl-8 text-xs text-white placeholder:text-white/60" /></div>
      </div>

      <div className="hidden grid-cols-[minmax(260px,1.6fr)_minmax(110px,.6fr)_110px_150px_130px] border-b border-console-line px-4 py-2 text-xs font-medium text-white/70 md:grid">
        <span>이슈 스트립</span><span>프로젝트</span><span>상태</span><span>판정</span><span>최근 실행</span>
      </div>

      <div className="space-y-px p-2 sm:p-3">
        {filtered.length === 0 ? <div className="grid min-h-52 place-items-center px-4 text-center text-sm text-white/70">{issues.length === 0 ? "접수된 이슈가 없습니다. 접수 API로 첫 이슈를 연결하세요." : "조건에 맞는 이슈가 없습니다. 필터나 검색어를 바꿔보세요."}</div> : filtered.map(({ issue, run }, index) => (
          <PaperStrip key={issue.id} asChild animated className="group grid gap-2 px-3 py-3 transition-colors hover:bg-strip-raised focus-visible:outline-2 focus-visible:outline-primary md:grid-cols-[minmax(260px,1.6fr)_minmax(110px,.6fr)_110px_150px_130px] md:items-center">
          <Link href={`/issues/${issue.id}`} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
            <div className="min-w-0"><p className="line-clamp-2 text-sm font-semibold md:truncate">{issue.title}</p><p className="mt-1 text-xs text-black/65">{issue.source} · {issue.id.slice(0, 8)}</p></div>
            <span className="text-xs text-black/70 before:mr-2 before:font-sans before:text-xs before:font-semibold before:text-black/60 before:content-['프로젝트'] md:before:hidden">{getProjectName(projects, issue.projectKey)}</span>
            <span className="before:mr-2 before:font-sans before:text-xs before:font-semibold before:text-black/60 before:content-['상태'] md:before:hidden">{run ? <AnalysisStatusBadge status={run.status} /> : <span className="text-xs text-black/70">실행 없음</span>}</span>
            <span className="before:mr-2 before:font-sans before:text-xs before:font-semibold before:text-black/60 before:content-['판정'] md:before:hidden">{run?.resultType ? <ResultBadge result={run.resultType} /> : <span className="text-xs text-black/70">판정 대기</span>}</span>
            <span className="text-xs text-black/65 before:mr-2 before:font-semibold before:content-['최근_실행'] md:before:hidden" title={formatDateTime(run?.createdAt)}>{shortDate(run?.createdAt)}</span>
          </Link>
          </PaperStrip>
        ))}
      </div>
    </section>
  );
}
