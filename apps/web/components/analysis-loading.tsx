import { mutedTextClass } from "@/components/ui/styles";

export function AnalysisLoading() {
  return (
    <div
      className={`flex items-center gap-2.5 ${mutedTextClass}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200"
        aria-hidden
      />
      분석 중...
    </div>
  );
}
