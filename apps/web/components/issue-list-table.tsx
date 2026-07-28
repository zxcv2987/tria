"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ANALYSIS_STATUS_LABEL,
  RESULT_TYPE_LABEL,
  formatDateTime,
  getLatestRun,
  getProjectName,
  type AnalysisRun,
  type Issue,
  type ProjectConfig,
} from "./mock-data";
import {
  AnalysisStatusBadge,
  ResultBadge,
} from "@/components/status-badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  helpTextClass,
  inputClass,
  linkClass,
  metricCardClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/styles";

const ALL = "__all__";

type Props = {
  issues: Issue[];
  runs: AnalysisRun[];
  projects: ProjectConfig[];
};

type MetricKey =
  | "queued"
  | "running"
  | "review"
  | "needInfo"
  | "failed";

function metricFor(_issue: Issue, run: AnalysisRun | undefined): MetricKey | null {
  if (run?.status === "QUEUED") return "queued";
  if (run?.status === "RUNNING") return "running";
  if (run?.status === "FAILED") return "failed";
  if (run?.resultType === "NEED_MORE_INFO") return "needInfo";
  if (run?.resultType === "CODE_LIKELY") return "review";
  return null;
}

export function IssueListTable({ issues, runs, projects }: Props) {
  const [project, setProject] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [resultType, setResultType] = useState("");
  const [query, setQuery] = useState("");
  const projectKeys = projects.map((p) => p.key);

  const metrics = useMemo(() => {
    const counts = {
      queued: 0,
      running: 0,
      review: 0,
      needInfo: 0,
      failed: 0,
    };
    for (const issue of issues) {
      const key = metricFor(issue, getLatestRun(runs, issue.id));
      if (key) counts[key] += 1;
    }
    return counts;
  }, [issues, runs]);

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      const run = getLatestRun(runs, issue.id);
      if (project && issue.projectKey !== project) return false;
      if (analysisStatus && run?.status !== analysisStatus) return false;
      if (resultType && run?.resultType !== resultType) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!issue.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [issues, runs, project, analysisStatus, resultType, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ["queued", "분석 대기", metrics.queued],
            ["running", "분석 중", metrics.running],
            ["review", "개발 검토", metrics.review],
            ["needInfo", "추가 정보 필요", metrics.needInfo],
            ["failed", "분석 실패", metrics.failed],
          ] as const
        ).map(([key, label, count]) => (
          <div key={key} className={metricCardClass}>
            <p className={helpTextClass}>{label}</p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
              {count}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Select
          value={project || ALL}
          onValueChange={(value) => setProject(value === ALL ? "" : value)}
        >
          <SelectTrigger className="h-9 min-w-[10rem]" aria-label="프로젝트 필터">
            <SelectValue placeholder="전체 프로젝트" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL}>전체 프로젝트</SelectItem>
            {projectKeys.map((key) => (
              <SelectItem key={key} value={key}>
                {getProjectName(projects, key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={analysisStatus || ALL}
          onValueChange={(value) =>
            setAnalysisStatus(value === ALL ? "" : value)
          }
        >
          <SelectTrigger className="h-9 min-w-[10rem]" aria-label="분석 상태 필터">
            <SelectValue placeholder="전체 분석 상태" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL}>전체 분석 상태</SelectItem>
            {Object.entries(ANALYSIS_STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={resultType || ALL}
          onValueChange={(value) => setResultType(value === ALL ? "" : value)}
        >
          <SelectTrigger className="h-9 min-w-[10rem]" aria-label="AI 판정 필터">
            <SelectValue placeholder="전체 AI 판정" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL}>전체 AI 판정</SelectItem>
            {Object.entries(RESULT_TYPE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 검색"
          className={`${inputClass} h-9 min-w-[12rem] flex-1 py-0`}
        />
      </div>

      <div className={tableWrapClass}>
        <table className={`${tableClass} min-w-[56rem]`}>
          <thead className={tableHeadClass}>
            <tr>
              <th className={tableHeadCellClass}>이슈 제목</th>
              <th className={tableHeadCellClass}>프로젝트</th>
              <th className={tableHeadCellClass}>원본</th>
              <th className={tableHeadCellClass}>분석 상태</th>
              <th className={tableHeadCellClass}>AI 판정</th>
              <th className={tableHeadCellClass}>등록 시각</th>
              <th className={tableHeadCellClass}>최근 분석 시각</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue) => {
              const run = getLatestRun(runs, issue.id);
              return (
                <tr key={issue.id} className={tableRowClass}>
                  <td className={tableCellClass}>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                    >
                      {issue.title}
                    </Link>
                  </td>
                  <td className={`${tableCellClass} text-zinc-700 dark:text-zinc-300`}>
                    {getProjectName(projects, issue.projectKey)}
                  </td>
                  <td className={tableCellClass}>
                    {issue.externalUrl ? (
                      <a
                        href={issue.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={linkClass}
                      >
                        {issue.source}
                      </a>
                    ) : (
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {issue.source}
                      </span>
                    )}
                  </td>
                  <td className={tableCellClass}>
                    {run ? <AnalysisStatusBadge status={run.status} /> : "-"}
                  </td>
                  <td className={tableCellClass}>
                    {run?.resultType ? (
                      <ResultBadge result={run.resultType} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                    {formatDateTime(issue.createdAt)}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                    {formatDateTime(run?.finishedAt ?? run?.startedAt)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className={`${tableCellClass} py-10 text-center text-zinc-500 dark:text-zinc-400`}
                >
                  조건에 맞는 이슈가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
