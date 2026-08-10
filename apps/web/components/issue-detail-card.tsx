"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clipboard, ExternalLink, FileCode2, RefreshCw, Trash2 } from "lucide-react";
import type { AnalysisResult as AnalysisResultType } from "@tria/analysis";
import { AnalysisStatusBadge, ResultBadge } from "@/components/status-badges";
import { formatDateTime, type AnalysisRun, type Issue } from "./mock-data";
import { useAlertDialog } from "@/components/ui/use-alert-dialog";
import { Button } from "@/components/ui/button";
import { ConsoleSectionHeader, MetaRow, PaperStrip } from "@/components/ui/workbench";

type Props = { issue: Issue; run: AnalysisRun | undefined; analysisResult: AnalysisResultType | null };
const feedback = [["CORRECT", "적중"], ["PARTIALLY_HELPFUL", "일부 도움"], ["NOT_HELPFUL", "도움 안 됨"], ["WRONG", "잘못된 분석"]] as const;

function TextList({ title, items, empty = "해당 없음" }: { title: string; items: string[]; empty?: string }) {
  return <section className="border-t border-console-line pt-3"><h3 className="mb-2 text-xs font-semibold text-white/75">{title}</h3>{items.length ? <ul className="space-y-2 text-sm leading-relaxed text-white/85">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2.5 size-1 shrink-0 bg-primary" />{item}</li>)}</ul> : <p className="text-sm text-white/70">{empty}</p>}</section>;
}

function OriginalField({ label, value }: { label: string; value?: string | null }) {
  return <div className="grid gap-1 border-t border-border py-2.5 sm:grid-cols-[105px_1fr]"><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap text-sm leading-relaxed">{value?.replace(/\\n/g, "\n") || "—"}</dd></div>;
}

export function IssueDetailCard({ issue, run, analysisResult }: Props) {
  const router = useRouter();
  const { alert, confirm, dialog } = useAlertDialog();
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const resultType = analysisResult?.result ?? run?.resultType ?? null;
  const summary = analysisResult?.summary ?? run?.summary ?? null;
  const suspectedArea = analysisResult?.suspectedArea ?? run?.suspectedArea ?? null;
  const evidence = analysisResult?.evidence ?? run?.evidence ?? [];
  const externalChecks = analysisResult?.externalChecks ?? run?.externalChecks ?? [];
  const missingInformation = analysisResult?.missingInformation ?? run?.missingInformation ?? [];
  const limitations = analysisResult?.limitations ?? run?.limitations ?? [];

  async function handleReanalyze() { setIsReanalyzing(true); try { const res = await fetch(`/api/issues/${issue.id}/analyze`, { method: "POST" }); const data = await res.json(); if (!res.ok) throw new Error(data.error); await alert("재분석을 요청했습니다."); router.refresh(); } catch (err) { await alert(err instanceof Error ? err.message : "재분석 요청에 실패했습니다.", { variant: "error" }); } finally { setIsReanalyzing(false); } }
  async function handleDelete() { if (!await confirm("이 이슈를 삭제할까요?", { title: "이슈 삭제", destructive: true })) return; try { const res = await fetch(`/api/issues/${issue.id}`, { method: "DELETE" }); if (!res.ok) throw new Error((await res.json()).error); router.push("/issues"); } catch (err) { await alert(err instanceof Error ? err.message : "삭제에 실패했습니다.", { variant: "error" }); } }
  async function handleCopy() { const text = analysisResult ? [`판정: ${analysisResult.result}`, analysisResult.summary, ...evidence.map((e) => `- ${e.path}${e.symbol ? ` (${e.symbol})` : ""}: ${e.reason}`)].join("\n") : (run?.summary ?? issue.title); await navigator.clipboard.writeText(text); await alert("분석 결과를 복사했습니다."); }
  async function handleFeedback(value: string) { if (!run) return; try { const res = await fetch(`/api/analysis/${run.id}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ result: value }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); await alert("피드백을 저장했습니다."); } catch (err) { await alert(err instanceof Error ? err.message : "피드백 저장에 실패했습니다.", { variant: "error" }); } }

  return (
    <div className="grid min-h-[680px] border border-console-line bg-console text-white lg:grid-cols-[minmax(0,1fr)_300px]">
      {dialog}
      <main className="console-grid min-w-0 border-console-line lg:border-r">
        <div className="grid grid-cols-2 gap-2 border-b border-console-line bg-console-muted p-3 sm:flex sm:flex-wrap sm:items-center">
          <Button className="h-11 sm:h-7" size="sm" onClick={handleReanalyze} disabled={isReanalyzing}><RefreshCw className={isReanalyzing ? "animate-spin" : ""} />{isReanalyzing ? "요청 중" : "재분석"}</Button>
          <Button className="h-11 sm:h-7" size="sm" variant="outline" onClick={handleCopy}><Clipboard />결과 복사</Button>
          {run?.workflowRunUrl ? <Button className="h-11 sm:h-7" size="sm" variant="outline" asChild><a href={run.workflowRunUrl} target="_blank" rel="noreferrer"><ExternalLink />실행 로그</a></Button> : null}
          <Button className="h-11 sm:ml-auto sm:h-7" size="sm" variant="destructive" onClick={handleDelete}><Trash2 />삭제</Button>
        </div>

        <div className="mx-auto max-w-4xl space-y-2 p-3 sm:p-5">
          <PaperStrip asChild animated className="p-4 sm:p-5"><section>
            <div className="flex flex-wrap items-center gap-2"><span className="size-2 bg-signal" aria-hidden="true" /><span className="text-xs font-semibold text-black/65">AI 판정</span>{run ? <AnalysisStatusBadge status={run.status} /> : null}{resultType ? <ResultBadge result={resultType} /> : null}</div>
            <p className="mt-4 max-w-[72ch] text-base font-medium leading-relaxed">{summary || (run?.status === "FAILED" ? run.failureReason : "분석 결과를 기다리고 있습니다.") || "분석 실행이 없습니다."}</p>
            {suspectedArea ? <p className="mt-3 text-xs text-black/55">의심 영역 · {suspectedArea}</p> : null}
          </section></PaperStrip>

          <section aria-labelledby="evidence-title" className="space-y-2 pt-3">
            <ConsoleSectionHeader title={<span id="evidence-title">검증된 코드 근거</span>} action={`근거 스트립 ${evidence.length}개`} />
            {evidence.length ? evidence.map((item, index) => <PaperStrip asChild key={`${item.path}-${item.symbol ?? ""}`} className="grid gap-3 p-3 sm:grid-cols-[34px_minmax(0,1fr)]"><article>
              <span className="grid size-7 place-items-center bg-primary text-xs text-primary-foreground">{index + 1}</span>
              <div className="min-w-0"><div className="flex items-center gap-2"><FileCode2 className="size-3.5 shrink-0 text-primary" /><code className="truncate text-xs font-medium">{item.path}{item.symbol ? ` · ${item.symbol}` : ""}</code></div><p className="mt-2 text-sm leading-relaxed text-black/65">{item.reason}</p></div>
            </article></PaperStrip>) : <div className="border border-dashed border-console-line p-8 text-center text-xs text-white/70">표시할 검증된 코드 근거가 없습니다.</div>}
          </section>

          <div className="grid gap-2 pt-4 md:grid-cols-3"><div className="border border-console-line bg-console-muted p-3"><TextList title="외부 점검" items={externalChecks} /></div><div className="border border-console-line bg-console-muted p-3"><TextList title="추가 정보" items={missingInformation} /></div><div className="border border-console-line bg-console-muted p-3"><TextList title="분석 한계" items={limitations} /></div></div>
        </div>
      </main>

      <aside className="bg-console-muted p-4" aria-label="조사 제어 정보">
        <ConsoleSectionHeader className="mb-5" title="실행 정보" description="조사 제어 원장" />
        <dl className="space-y-2 text-xs"><MetaRow label="저장소" valueClassName="truncate">{run?.targetRepository || "—"}</MetaRow><MetaRow label="기준">{run ? `${run.targetRef}${run.targetCommitSha ? `@${run.targetCommitSha.slice(0, 8)}` : ""}` : "—"}</MetaRow><MetaRow label="시작">{formatDateTime(run?.startedAt)}</MetaRow><MetaRow label="종료">{formatDateTime(run?.finishedAt)}</MetaRow></dl>

        <details className="mt-6 border-t border-console-line pt-4" open><summary className="cursor-pointer text-sm font-semibold">원본 이슈</summary><dl className="mt-3 border-b border-border bg-strip px-3 text-foreground"><OriginalField label="본문" value={issue.description} /><OriginalField label="재현 절차" value={issue.reproductionSteps} /><OriginalField label="기대 결과" value={issue.expectedResult} /><OriginalField label="실제 결과" value={issue.actualResult} /><OriginalField label="환경" value={issue.environment} /></dl>{issue.externalUrl ? <Button variant="outline" size="sm" className="mt-2 w-full" asChild><a href={issue.externalUrl} target="_blank" rel="noreferrer">원본에서 보기 <ExternalLink /></a></Button> : null}</details>

        {run ? <section className="mt-6 border-t border-console-line pt-4"><h2 className="text-sm font-semibold">분석 피드백</h2><p className="mt-1 text-xs text-white/70">이 분석이 조사 시작에 도움이 됐나요?</p><div className="mt-3 grid grid-cols-2 gap-1">{feedback.map(([value, label]) => <Button key={value} size="sm" variant="outline" onClick={() => handleFeedback(value)}>{label}</Button>)}</div></section> : null}
      </aside>
    </div>
  );
}
