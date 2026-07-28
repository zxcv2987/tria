"use client";

import { useState } from "react";
import { IssueForm } from "@/components/issue-form";
import { AnalysisLoading } from "@/components/analysis-loading";
import { AnalysisResult } from "@/components/analysis-result";
import { PageHeader, PageShell } from "@/components/ui/page";
import { errorTextClass } from "@/components/ui/styles";
import type {
  AnalysisResult as AnalysisResultType,
  AnalysisStatus,
} from "@tria/analysis";

export default function Home() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(input: { title: string; body: string }) {
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "분석 중 오류가 발생했습니다.");
      }

      setResult(data as AnalysisResultType);
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "분석 중 오류가 발생했습니다. 다시 시도해주세요."
      );
      setStatus("error");
    }
  }

  return (
    <PageShell width="narrow">
      <PageHeader
        title="단일 분석"
        description="이슈 제목과 내용을 입력하면 관련 코드와 원인 후보를 찾아줍니다."
      />

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        이 화면은 로컬 전용입니다. codex CLI가 로그인돼 있고
        TARGET_REPOSITORY_PATH가 설정된 로컬 개발 서버(pnpm dev)에서만
        동작하며, 배포 환경에서는 사용할 수 없습니다. 운영 환경에서는
        이슈 접수 API(POST /api/issues)를 통한 분석 흐름을 이용하세요.
      </p>

      <IssueForm onSubmit={handleAnalyze} disabled={status === "loading"} />

      {status === "loading" && <AnalysisLoading />}
      {status === "success" && result && <AnalysisResult result={result} />}
      {status === "error" && <p className={errorTextClass}>{error}</p>}
    </PageShell>
  );
}
