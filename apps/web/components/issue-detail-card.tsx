"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { AnalysisResult as AnalysisResultType } from "@tria/analysis";
import {
  AnalysisStatusBadge,
  ResultBadge,
} from "@/components/status-badges";
import {
  formatDateTime,
  type AnalysisRun,
  type Issue,
} from "./mock-data";
import { useAlertDialog } from "@/components/ui/use-alert-dialog";
import { Button } from "@/components/ui/button";
import {
  bodyTextClass,
  cardClass,
  codeChipClass,
  helpTextClass,
  linkClass,
  metaLabelClass,
  mutedTextClass,
  sectionTitleClass,
} from "@/components/ui/styles";

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
    <div className="flex flex-col gap-1.5">
      <h3 className={metaLabelClass}>{label}</h3>
      <p className={`whitespace-pre-wrap ${bodyTextClass}`}>
        {value?.trim() ? value : "-"}
      </p>
    </div>
  );
}

function StringList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={metaLabelClass}>{label}</h3>
      {items.length === 0 ? (
        <p className={helpTextClass}>-</p>
      ) : (
        <ul className={`list-disc pl-5 ${mutedTextClass}`}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function IssueDetailCard({ issue, run, analysisResult }: Props) {
  const router = useRouter();
  const { alert, confirm, dialog } = useAlertDialog();
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  async function handleReanalyze() {
    setIsReanalyzing(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await alert("재분석을 요청했습니다.");
      router.refresh();
    } catch (err) {
      await alert(
        err instanceof Error ? err.message : "재분석 요청 중 오류가 발생했습니다.",
        { variant: "error" },
      );
    } finally {
      setIsReanalyzing(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm("이 이슈를 삭제할까요?", {
      title: "삭제",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/issues/${issue.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push("/issues");
    } catch (err) {
      await alert(
        err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.",
        { variant: "error" },
      );
    }
  }

  async function handleCopy() {
    const text = analysisResult
      ? [
          `판정: ${analysisResult.result}`,
          analysisResult.summary,
          analysisResult.suspectedArea
            ? `의심 영역: ${analysisResult.suspectedArea}`
            : null,
          ...analysisResult.evidence.map(
            (e) =>
              `- ${e.path}${e.symbol ? ` (${e.symbol})` : ""}: ${e.reason}`,
          ),
          ...analysisResult.externalChecks.map((c) => `점검: ${c}`),
          ...analysisResult.missingInformation.map((m) => `누락: ${m}`),
          ...analysisResult.limitations.map((l) => `한계: ${l}`),
        ]
          .filter(Boolean)
          .join("\n")
      : (run?.summary ?? issue.title);
    await navigator.clipboard.writeText(text);
    await alert("분석 결과를 복사했습니다.");
  }

  async function handleFeedback(value: string) {
    if (!run) return;
    try {
      const res = await fetch(`/api/analysis/${run.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await alert("피드백을 저장했습니다.");
    } catch (err) {
      await alert(
        err instanceof Error ? err.message : "피드백 저장 중 오류가 발생했습니다.",
        { variant: "error" },
      );
    }
  }

  const evidence = analysisResult?.evidence ?? run?.evidence ?? [];
  const externalChecks =
    analysisResult?.externalChecks ?? run?.externalChecks ?? [];
  const missingInformation =
    analysisResult?.missingInformation ?? run?.missingInformation ?? [];
  const limitations = analysisResult?.limitations ?? run?.limitations ?? [];
  const suspectedArea =
    analysisResult?.suspectedArea ?? run?.suspectedArea ?? null;
  const summary = analysisResult?.summary ?? run?.summary ?? null;
  const resultType = analysisResult?.result ?? run?.resultType ?? null;

  return (
    <div className="flex flex-col gap-6">
      {dialog}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleReanalyze}
          disabled={isReanalyzing}
        >
          {isReanalyzing ? "재분석 중..." : "재분석"}
        </Button>
        {issue.externalUrl && (
          <Button variant="outline" asChild>
            <a href={issue.externalUrl} target="_blank" rel="noreferrer">
              원본에서 보기
            </a>
          </Button>
        )}
        <Button type="button" variant="outline" onClick={handleCopy}>
          결과 복사
        </Button>
        {run?.workflowRunUrl && (
          <Button variant="outline" asChild>
            <a href={run.workflowRunUrl} target="_blank" rel="noreferrer">
              실행 로그 확인
            </a>
          </Button>
        )}
        <Button type="button" variant="destructive" onClick={handleDelete}>
          삭제
        </Button>
      </div>

      <section className={`${cardClass} flex flex-col gap-5`}>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className={sectionTitleClass}>분석 결과</h2>
          {run && <AnalysisStatusBadge status={run.status} />}
        </div>

        {!run && <p className={helpTextClass}>아직 분석 실행이 없습니다.</p>}

        {run && (
          <>
            {resultType ? (
              <ResultBadge result={resultType} />
            ) : (
              <Field label="판정" value="진행 중" />
            )}

            <Field label="요약" value={summary} />
            <Field label="의심 영역" value={suspectedArea} />

            <div className="flex flex-col gap-2">
              <h3 className={metaLabelClass}>관련 파일</h3>
              {evidence.length === 0 ? (
                <p className={helpTextClass}>-</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {evidence.map((e) => (
                    <li key={`${e.path}-${e.symbol ?? ""}`}>
                      <code className={codeChipClass}>
                        {e.path}
                        {e.symbol ? ` · ${e.symbol}` : ""}
                      </code>
                      <p className={`mt-1.5 ${mutedTextClass}`}>{e.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className={metaLabelClass}>관련 함수 / 심볼</h3>
              {evidence.some((e) => e.symbol) ? (
                <ul className={`list-disc pl-5 ${mutedTextClass}`}>
                  {evidence
                    .filter((e) => e.symbol)
                    .map((e) => (
                      <li key={`${e.path}:${e.symbol}`}>
                        <code className="font-mono text-xs">{e.symbol}</code>
                        <span className="text-muted-foreground"> ({e.path})</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className={helpTextClass}>-</p>
              )}
            </div>

            <StringList
              label="코드 근거"
              items={evidence.map((e) => e.reason)}
            />
            <StringList label="추가 점검 항목" items={externalChecks} />
            <StringList label="누락 정보" items={missingInformation} />
            <StringList label="분석 한계" items={limitations} />

            <Field
              label="분석 대상 저장소와 커밋"
              value={`${run.targetRepository}@${run.targetRef}${
                run.targetCommitSha ? ` (${run.targetCommitSha})` : ""
              }`}
            />

            <div className="flex flex-col gap-1.5">
              <h3 className={metaLabelClass}>GitHub Actions 실행 링크</h3>
              {run.workflowRunUrl ? (
                <a
                  href={run.workflowRunUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`break-all ${linkClass}`}
                >
                  {run.workflowRunUrl}
                </a>
              ) : (
                <p className={helpTextClass}>-</p>
              )}
            </div>

            <p className={helpTextClass}>
              시작 {formatDateTime(run.startedAt)} · 종료{" "}
              {formatDateTime(run.finishedAt)}
            </p>
          </>
        )}
      </section>

      <details className={`${cardClass} group`}>
        <summary
          className={`flex cursor-pointer list-none items-center justify-between ${sectionTitleClass} [&::-webkit-details-marker]:hidden`}
        >
          원본 이슈
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-5 flex flex-col gap-5">
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
              issue.attachments.length > 0
                ? issue.attachments.join(", ")
                : null
            }
          />
          <div className="flex flex-col gap-1.5">
            <h3 className={metaLabelClass}>원본</h3>
            {issue.externalUrl ? (
              <a
                href={issue.externalUrl}
                target="_blank"
                rel="noreferrer"
                className={`break-all ${linkClass}`}
              >
                {issue.externalUrl}
              </a>
            ) : (
              <p className={helpTextClass}>{issue.source}</p>
            )}
          </div>
        </div>
      </details>

      <section className={`${cardClass} flex flex-col gap-3.5`}>
        <h2 className={sectionTitleClass}>분석 피드백</h2>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant="outline"
              onClick={() => handleFeedback(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
