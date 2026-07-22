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

      <IssueForm onSubmit={handleAnalyze} disabled={status === "loading"} />

      {status === "loading" && <AnalysisLoading />}
      {status === "success" && result && <AnalysisResult result={result} />}
      {status === "error" && <p className={errorTextClass}>{error}</p>}
    </PageShell>
  );
}
