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
} from "./mock-data";
import {
  helpTextClass,
  inputClass,
  linkClass,
  metricCardClass,
  selectClass,
  tableCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/styles";

type Props = {
  issues: Issue[];
  projectKeys: string[];
};

type MetricKey =
  | "queued"
  | "running"
  | "review"
  | "needInfo"
  | "failed";

function metricFor(issue: Issue, run: AnalysisRun | undefined): MetricKey | null {
  if (run?.status === "QUEUED") return "queued";
  if (run?.status === "RUNNING") return "running";
  if (run?.status === "FAILED" || issue.asanaStatus === "분석 실패")
    return "failed";
  if (
    run?.resultType === "NEED_MORE_INFO" ||
    issue.asanaStatus === "추가 정보 필요"
  )
    return "needInfo";
  if (run?.resultType === "CODE_LIKELY" || issue.asanaStatus === "개발 검토")
    return "review";
  if (issue.asanaStatus === "AI 분석 요청") return "queued";
  if (issue.asanaStatus === "AI 분석 중") return "running";
  return null;
}

export function IssueListTable({ issues, projectKeys }: Props) {
  const [project, setProject] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [resultType, setResultType] = useState("");
  const [query, setQuery] = useState("");

  const metrics = useMemo(() => {
    const counts = {
      queued: 0,
      running: 0,
      review: 0,
      needInfo: 0,
      failed: 0,
    };
    for (const issue of issues) {
      const key = metricFor(issue, getLatestRun(issue.id));
      if (key) counts[key] += 1;
    }
    return counts;
  }, [issues]);

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      const run = getLatestRun(issue.id);
      if (project && issue.projectKey !== project) return false;
      if (analysisStatus && run?.status !== analysisStatus) return false;
      if (resultType && run?.resultType !== resultType) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!issue.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [issues, project, analysisStatus, resultType, query]);

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
        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className={`${selectClass} w-auto min-w-[10rem]`}
          aria-label="프로젝트 필터"
        >
          <option value="">전체 프로젝트</option>
          {projectKeys.map((key) => (
            <option key={key} value={key}>
              {getProjectName(key)}
            </option>
          ))}
        </select>
        <select
          value={analysisStatus}
          onChange={(e) => setAnalysisStatus(e.target.value)}
          className={`${selectClass} w-auto min-w-[10rem]`}
          aria-label="분석 상태 필터"
        >
          <option value="">전체 분석 상태</option>
          {Object.entries(ANALYSIS_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={resultType}
          onChange={(e) => setResultType(e.target.value)}
          className={`${selectClass} w-auto min-w-[10rem]`}
          aria-label="AI 판정 필터"
        >
          <option value="">전체 AI 판정</option>
          {Object.entries(RESULT_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 검색"
          className={`${inputClass} min-w-[12rem] flex-1`}
        />
      </div>

      {/* TODO: /api/issues 연동 */}
      <div className={tableWrapClass}>
        <table className={`${tableClass} min-w-[56rem]`}>
          <thead className={tableHeadClass}>
            <tr>
              <th className={tableHeadCellClass}>이슈 제목</th>
              <th className={tableHeadCellClass}>프로젝트</th>
              <th className={tableHeadCellClass}>Asana 상태</th>
              <th className={tableHeadCellClass}>분석 상태</th>
              <th className={tableHeadCellClass}>AI 판정</th>
              <th className={tableHeadCellClass}>등록 시각</th>
              <th className={tableHeadCellClass}>최근 분석 시각</th>
              <th className={tableHeadCellClass}>Asana</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue) => {
              const run = getLatestRun(issue.id);
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
                    {getProjectName(issue.projectKey)}
                  </td>
                  <td className={`${tableCellClass} text-zinc-700 dark:text-zinc-300`}>
                    {issue.asanaStatus}
                  </td>
                  <td className={`${tableCellClass} text-zinc-700 dark:text-zinc-300`}>
                    {run ? ANALYSIS_STATUS_LABEL[run.status] : "-"}
                  </td>
                  <td className={`${tableCellClass} text-zinc-700 dark:text-zinc-300`}>
                    {run?.resultType ? RESULT_TYPE_LABEL[run.resultType] : "-"}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                    {formatDateTime(issue.createdAt)}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                    {formatDateTime(run?.finishedAt ?? run?.startedAt)}
                  </td>
                  <td className={tableCellClass}>
                    <a
                      href={issue.asanaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={linkClass}
                    >
                      열기
                    </a>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
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
