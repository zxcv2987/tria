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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  helpTextClass,
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

type MetricKey = "queued" | "running" | "review" | "needInfo" | "failed";

function metricFor(run: AnalysisRun | undefined): MetricKey | null {
  if (run?.status === "QUEUED") return "queued";
  if (run?.status === "RUNNING") return "running";
  if (run?.status === "FAILED") return "failed";
  if (run?.resultType === "NEED_MORE_INFO") return "needInfo";
  if (run?.resultType === "CODE_LIKELY") return "review";
  return null;
}

// 배지(status-badges.tsx)와 같은 상태를 가리키므로 라벨은 항상 그쪽 상수를 재사용한다 —
// 별도 문자열을 두면 화면 안에서 같은 값이 두 가지 이름으로 불리는 문제가 생긴다.
const METRIC_TILES = [
  {
    key: "queued",
    label: ANALYSIS_STATUS_LABEL.QUEUED,
    field: "analysisStatus",
    value: "QUEUED",
    dot: "bg-zinc-400 dark:bg-zinc-500",
  },
  {
    key: "running",
    label: ANALYSIS_STATUS_LABEL.RUNNING,
    field: "analysisStatus",
    value: "RUNNING",
    dot: "bg-sky-500",
  },
  {
    key: "review",
    label: RESULT_TYPE_LABEL.CODE_LIKELY,
    field: "resultType",
    value: "CODE_LIKELY",
    dot: "bg-amber-500",
  },
  {
    key: "needInfo",
    label: RESULT_TYPE_LABEL.NEED_MORE_INFO,
    field: "resultType",
    value: "NEED_MORE_INFO",
    dot: "bg-zinc-400 dark:bg-zinc-500",
  },
  {
    key: "failed",
    label: ANALYSIS_STATUS_LABEL.FAILED,
    field: "analysisStatus",
    value: "FAILED",
    dot: "bg-red-500",
  },
] as const satisfies readonly {
  key: MetricKey;
  label: string;
  field: "analysisStatus" | "resultType";
  value: string;
  dot: string;
}[];

const cardLinkClass =
  "rounded-xl border border-border bg-card p-3.5 shadow-xs transition-colors hover:bg-muted/40 dark:shadow-none";

export function IssueListTable({ issues, runs, projects }: Props) {
  const [project, setProject] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [resultType, setResultType] = useState("");
  const [query, setQuery] = useState("");
  const projectKeys = projects.map((p) => p.key);

  const metrics = useMemo(() => {
    const counts: Record<MetricKey, number> = {
      queued: 0,
      running: 0,
      review: 0,
      needInfo: 0,
      failed: 0,
    };
    for (const issue of issues) {
      const key = metricFor(getLatestRun(runs, issue.id));
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

  function toggleTile(field: "analysisStatus" | "resultType", value: string) {
    if (field === "analysisStatus") {
      setAnalysisStatus((prev) => (prev === value ? "" : value));
    } else {
      setResultType((prev) => (prev === value ? "" : value));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {METRIC_TILES.map((tile) => {
          const active =
            tile.field === "analysisStatus"
              ? analysisStatus === tile.value
              : resultType === tile.value;
          return (
            <button
              key={tile.key}
              type="button"
              aria-pressed={active}
              onClick={() => toggleTile(tile.field, tile.value)}
              className={cn(
                metricCardClass,
                "text-left transition-colors hover:bg-muted/60",
                active && "bg-muted ring-1 ring-ring/40 hover:bg-muted",
              )}
            >
              <p className={`flex items-center gap-1.5 ${helpTextClass}`}>
                <span className={`size-1.5 shrink-0 rounded-full ${tile.dot}`} />
                {tile.label}
              </p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {metrics[tile.key]}
              </p>
            </button>
          );
        })}
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

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목 검색"
          className="h-9 min-w-[12rem] flex-1 py-0"
        />
      </div>

      {/* 모바일(<md): 카드형 — 제목 + 분석 상태 + AI 판정을 항상 노출.
          데스크톱(md+): 기존 7열 표, 가로 스크롤 없이 한 화면에 다 보임. */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {filtered.map((issue) => {
          const run = getLatestRun(runs, issue.id);
          return (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              className={`${cardLinkClass} flex flex-col gap-2`}
            >
              <p className="font-medium text-foreground">{issue.title}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {run ? <AnalysisStatusBadge status={run.status} /> : null}
                {run?.resultType ? (
                  <ResultBadge result={run.resultType} />
                ) : null}
              </div>
              <p className={helpTextClass}>
                {getProjectName(projects, issue.projectKey)} · {issue.source} ·{" "}
                {formatDateTime(issue.createdAt)}
              </p>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className={`${helpTextClass} py-10 text-center`}>
            조건에 맞는 이슈가 없습니다.
          </p>
        )}
      </div>

      <div className={`hidden md:block ${tableWrapClass}`}>
        <table className={tableClass}>
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
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {issue.title}
                    </Link>
                  </td>
                  <td className={`${tableCellClass} text-foreground`}>
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
                      <span className="text-muted-foreground">
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
                  <td className={`${tableCellClass} whitespace-nowrap text-muted-foreground`}>
                    {formatDateTime(issue.createdAt)}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap text-muted-foreground`}>
                    {formatDateTime(run?.finishedAt ?? run?.startedAt)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className={`${tableCellClass} py-10 text-center text-muted-foreground`}
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
