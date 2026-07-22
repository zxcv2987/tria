import type { AnalysisResult as AnalysisResultType } from "@tria/analysis";

type AnalysisResultProps = {
  result: AnalysisResultType;
};

const RESULT_LABEL: Record<AnalysisResultType["result"], string> = {
  CODE_LIKELY: "코드 원인 유력",
  CHECK_EXTERNAL: "외부 점검 권장",
  NEED_MORE_INFO: "추가 정보 필요",
};

const RESULT_BADGE_CLASS: Record<AnalysisResultType["result"], string> = {
  CODE_LIKELY: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CHECK_EXTERNAL: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  NEED_MORE_INFO: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <span
        className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${RESULT_BADGE_CLASS[result.result]}`}
      >
        {RESULT_LABEL[result.result]}
      </span>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">{result.summary}</p>

      {result.suspectedArea && (
        <p className="text-xs text-zinc-500">의심 영역: {result.suspectedArea}</p>
      )}

      {result.evidence.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">관련 파일</h3>
          <ul className="flex flex-col gap-2">
            {result.evidence.map((e) => (
              <li key={e.path} className="text-sm">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                  {e.path}
                  {e.symbol ? ` · ${e.symbol}` : ""}
                </code>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">{e.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.externalChecks.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">다음 확인 항목</h3>
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {result.externalChecks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {result.missingInformation.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">부족한 정보</h3>
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {result.missingInformation.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {result.limitations.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500">분석 한계</h3>
          <ul className="text-xs text-zinc-500">
            {result.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
