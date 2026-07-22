"use client";

import type { AnalysisResult as AnalysisResultType } from "@tria/analysis";
import {
  ANALYSIS_STATUS_LABEL,
  RESULT_TYPE_LABEL,
  formatDateTime,
  type AnalysisRun,
  type Issue,
} from "./mock-data";

type Props = {
  issue: Issue;
  run: AnalysisRun | undefined;
  analysisResult: AnalysisResultType | null;
};

const FEEDBACK_OPTIONS = [
  { value: "CORRECT", label: "적중" },
  { value: "PARTIALLY_HELPFUL", label: "일부 도움" },
  { value: "NOT_HELPFUL", label: "도움 안 됨" },
  { value: "WRONG", label: "잘못된 분석" },
] as const;

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold text-zinc-500">{label}</h3>
      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        {value?.trim() ? value : "-"}
      </p>
    </div>
  );
}

export function IssueDetailCard({ issue, run, analysisResult }: Props) {
  async function handleReanalyze() {
    // TODO: /api/issues/[id]/reanalyze 연동
    window.alert("재분석 요청은 API 연동 후 동작합니다.");
  }

  async function handleCopy() {
    const text = analysisResult
      ? [
          `판정: ${analysisResult.result}`,
          analysisResult.summary,
          ...analysisResult.evidence.map((e) => `- ${e.path}: ${e.reason}`),
          ...analysisResult.externalChecks.map((c) => `점검: ${c}`),
          ...analysisResult.limitations.map((l) => `한계: ${l}`),
        ].join("\n")
      : run?.summary ?? issue.title;
    await navigator.clipboard.writeText(text);
    window.alert("분석 결과를 복사했습니다.");
  }

  function handleFeedback(value: string) {
    // TODO: /api/analysis-runs/[id]/feedback 연동
    window.alert(`피드백(${value})은 API 연동 후 저장됩니다.`);
  }

  const isCandidate = analysisResult?.result === "CODE_LIKELY";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleReanalyze}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          재분석
        </button>
        <a
          href={issue.asanaUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
        >
          Asana에서 열기
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
        >
          결과 복사
        </button>
        {run?.workflowRunUrl && (
          <a
            href={run.workflowRunUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
          >
            실행 로그 확인
          </a>
        )}
      </div>

      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">원본 이슈</h2>
        <Field label="제목" value={issue.title} />
        <Field label="본문" value={issue.description} />
        <Field label="재현 절차" value={issue.reproductionSteps} />
        <Field label="기대 결과" value={issue.expectedResult} />
        <Field label="실제 결과" value={issue.actualResult} />
        <Field label="발생 URL" value={issue.occurredUrl} />
        <Field label="환경" value={issue.environment} />
        <Field
          label="첨부파일"
          value={
            issue.attachments.length > 0 ? issue.attachments.join(", ") : null
          }
        />
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-zinc-500">Asana 링크</h3>
          <a
            href={issue.asanaUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
          >
            {issue.asanaUrl}
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">분석 결과</h2>
          {run && (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-800">
              {ANALYSIS_STATUS_LABEL[run.status]}
            </span>
          )}
        </div>

        {!run && (
          <p className="text-sm text-zinc-500">아직 분석 실행이 없습니다.</p>
        )}

        {run && (
          <>
            <Field
              label="판정"
              value={
                run.resultType ? RESULT_TYPE_LABEL[run.resultType] : "진행 중"
              }
            />

            {/* @tria/analysis AnalysisResult 기반 표시 */}
            {analysisResult && (
              <div className="flex flex-col gap-4">
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                    isCandidate
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {isCandidate ? "코드 원인 후보 발견" : "추가 점검 필요"}
                </span>
                <Field label="요약" value={analysisResult.summary} />
              </div>
            )}

            <Field label="의심 영역" value={run.suspectedArea} />

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-zinc-500">관련 파일</h3>
              {run.evidence.length === 0 ? (
                <p className="text-sm text-zinc-500">-</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {run.evidence.map((e) => (
                    <li key={`${e.path}-${e.symbol ?? ""}`} className="text-sm">
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                        {e.path}
                      </code>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                        {e.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-zinc-500">
                관련 함수 / 심볼
              </h3>
              {run.evidence.some((e) => e.symbol) ? (
                <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  {run.evidence
                    .filter((e) => e.symbol)
                    .map((e) => (
                      <li key={`${e.path}:${e.symbol}`}>
                        <code className="text-xs">{e.symbol}</code>
                        <span className="text-zinc-400"> ({e.path})</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">-</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-zinc-500">코드 근거</h3>
              {run.evidence.length === 0 ? (
                <p className="text-sm text-zinc-500">-</p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  {run.evidence.map((e) => (
                    <li key={`ev-${e.path}`}>{e.reason}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-zinc-500">
                추가 점검 항목
              </h3>
              {(analysisResult?.externalChecks ?? run.externalChecks).length ===
              0 ? (
                <p className="text-sm text-zinc-500">-</p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  {(analysisResult?.externalChecks ?? run.externalChecks).map(
                    (c) => (
                      <li key={c}>{c}</li>
                    ),
                  )}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-zinc-500">누락 정보</h3>
              {(analysisResult?.missingInformation ?? run.missingInformation)
                .length === 0 ? (
                <p className="text-sm text-zinc-500">-</p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  {(
                    analysisResult?.missingInformation ?? run.missingInformation
                  ).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
            </div>

            <Field
              label="분석 한계"
              value={
                (analysisResult?.limitations ?? run.limitations).length > 0
                  ? (analysisResult?.limitations ?? run.limitations).join("\n")
                  : null
              }
            />

            <Field
              label="분석 대상 저장소와 커밋"
              value={`${run.targetRepository}@${run.targetRef}${
                run.targetCommitSha ? ` (${run.targetCommitSha})` : ""
              }`}
            />

            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-zinc-500">
                GitHub Actions 실행 링크
              </h3>
              {run.workflowRunUrl ? (
                <a
                  href={run.workflowRunUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline-offset-2 hover:underline"
                >
                  {run.workflowRunUrl}
                </a>
              ) : (
                <p className="text-sm text-zinc-500">-</p>
              )}
            </div>

            <p className="text-xs text-zinc-500">
              시작 {formatDateTime(run.startedAt)} · 종료{" "}
              {formatDateTime(run.finishedAt)}
            </p>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">분석 피드백</h2>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleFeedback(opt.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
