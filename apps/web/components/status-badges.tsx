import type { AnalysisResult } from "@tria/analysis";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ANALYSIS_STATUS_LABEL,
  RESULT_TYPE_LABEL,
  type AnalysisRun,
} from "@/components/mock-data";

const RESULT_CLASS: Record<AnalysisResult["result"], string> = {
  CODE_LIKELY:
    "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  CHECK_EXTERNAL:
    "border-transparent bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  NEED_MORE_INFO:
    "border-transparent bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
};

const ANALYSIS_STATUS_CLASS: Record<AnalysisRun["status"], string> = {
  QUEUED:
    "border-transparent bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  RUNNING:
    "border-transparent bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  SUCCEEDED:
    "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  FAILED:
    "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function ResultBadge({
  result,
}: {
  result: AnalysisResult["result"];
}) {
  return (
    <Badge variant="secondary" className={cn(RESULT_CLASS[result])}>
      {RESULT_TYPE_LABEL[result]}
    </Badge>
  );
}

export function AnalysisStatusBadge({
  status,
}: {
  status: AnalysisRun["status"];
}) {
  return (
    <Badge variant="secondary" className={cn(ANALYSIS_STATUS_CLASS[status])}>
      {ANALYSIS_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={
        active
          ? "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-transparent bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      }
    >
      {active ? "활성" : "비활성"}
    </Badge>
  );
}
