import type { AnalysisResult as AnalysisResultType } from "@/lib/schemas";

type AnalysisResultProps = {
  result: AnalysisResultType;
};

export function AnalysisResult({ result }: AnalysisResultProps) {
  const isCandidate = result.result === "CODE_CANDIDATE";

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <span
        className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
          isCandidate
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        {isCandidate ? "코드 원인 후보 발견" : "추가 점검 필요"}
      </span>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">{result.summary}</p>

      {result.evidence.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">관련 파일</h3>
          <ul className="flex flex-col gap-2">
            {result.evidence.map((e) => (
              <li key={e.path} className="text-sm">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                  {e.path}
                </code>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">{e.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.nextChecks.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">다음 확인 항목</h3>
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {result.nextChecks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-500">분석 한계</h3>
        <p className="text-xs text-zinc-500">{result.limitation}</p>
      </div>
    </div>
  );
}
