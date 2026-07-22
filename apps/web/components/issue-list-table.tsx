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
          <div
            key={key}
            className="rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-800"
          >
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          aria-label="프로젝트 필터"
        >
          <option value="">전체 프로젝트</option>
          {projectKeys.map((key) => (
            <option key={key} value={key}>
              {getProjectName(projects, key)}
            </option>
          ))}
        </select>
        <select
          value={analysisStatus}
          onChange={(e) => setAnalysisStatus(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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
          className="min-w-[12rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2 font-medium">이슈 제목</th>
              <th className="px-3 py-2 font-medium">프로젝트</th>
              <th className="px-3 py-2 font-medium">Asana 상태</th>
              <th className="px-3 py-2 font-medium">분석 상태</th>
              <th className="px-3 py-2 font-medium">AI 판정</th>
              <th className="px-3 py-2 font-medium">등록 시각</th>
              <th className="px-3 py-2 font-medium">최근 분석 시각</th>
              <th className="px-3 py-2 font-medium">Asana</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue) => {
              const run = getLatestRun(runs, issue.id);
              return (
                <tr
                  key={issue.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/issues/${issue.id}`}
                      className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                    >
                      {issue.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {getProjectName(projects, issue.projectKey)}
                  </td>
                  <td className="px-3 py-2">{issue.asanaStatus}</td>
                  <td className="px-3 py-2">
                    {run ? ANALYSIS_STATUS_LABEL[run.status] : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {run?.resultType ? RESULT_TYPE_LABEL[run.resultType] : "-"}
                  </td>
                  <td className="px-3 py-2">{formatDateTime(issue.createdAt)}</td>
                  <td className="px-3 py-2">
                    {formatDateTime(run?.finishedAt ?? run?.startedAt)}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={issue.asanaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300"
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
                  className="px-3 py-8 text-center text-zinc-500"
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
