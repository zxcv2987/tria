"use client";

import { useState } from "react";
import { IssueForm } from "@/components/issue-form";
import { AnalysisLoading } from "@/components/analysis-loading";
import { AnalysisResult } from "@/components/analysis-result";
import type {
  AnalysisResult as AnalysisResultType,
  AnalysisStatus,
} from "@/lib/schemas";

const MOCK_RESULT: AnalysisResultType = {
  result: "CODE_CANDIDATE",
  summary: "수정 후 목록 쿼리가 갱신되지 않을 가능성이 있습니다.",
  evidence: [
    {
      path: "src/features/course/hooks/useUpdateCourse.ts",
      reason: "수정 성공 후 상세 쿼리만 무효화하고 있습니다.",
    },
  ],
  nextChecks: [
    "수정 API 응답을 확인하세요.",
    "목록 조회 API 응답을 확인하세요.",
  ],
  limitation: "운영 환경에서 직접 재현하지 않았습니다.",
};

export default function Home() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(input: { title: string; body: string }) {
    setStatus("loading");
    setError(null);

    try {
      // TODO: POST /api/analyze 연동
      // const res = await fetch("/api/analyze", { method: "POST", body: JSON.stringify(input) });
      void input;
      const mockResult = await new Promise<AnalysisResultType>((resolve) =>
        setTimeout(() => resolve(MOCK_RESULT), 1000)
      );
      setResult(mockResult);
      setStatus("success");
    } catch {
      setError("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Tria 이슈 분석
        </h1>

        <IssueForm onSubmit={handleAnalyze} disabled={status === "loading"} />

        {status === "loading" && <AnalysisLoading />}
        {status === "success" && result && <AnalysisResult result={result} />}
        {status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </main>
    </div>
  );
}
