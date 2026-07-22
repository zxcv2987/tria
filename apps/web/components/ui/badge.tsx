import type { AnalysisResult } from "@tria/analysis";

const RESULT_LABEL: Record<AnalysisResult["result"], string> = {
  CODE_LIKELY: "코드 원인 유력",
  CHECK_EXTERNAL: "외부 점검 권장",
  NEED_MORE_INFO: "추가 정보 필요",
};

const RESULT_BADGE_CLASS: Record<AnalysisResult["result"], string> = {
  CODE_LIKELY:
    "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
  CHECK_EXTERNAL:
    "bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-900",
  NEED_MORE_INFO:
    "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
};

const BASE_BADGE =
  "inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset";

export function ResultBadge({
  result,
}: {
  result: AnalysisResult["result"];
}) {
  return (
    <span className={`${BASE_BADGE} ${RESULT_BADGE_CLASS[result]}`}>
      {RESULT_LABEL[result]}
    </span>
  );
}

export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={`${BASE_BADGE} bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700`}
    >
      {children}
    </span>
  );
}

export { RESULT_LABEL };
