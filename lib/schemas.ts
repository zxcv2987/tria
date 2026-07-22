export type AnalysisEvidence = {
  path: string;
  reason: string;
};

export type AnalysisResult = {
  result: "CODE_CANDIDATE" | "NEED_MORE_CHECK";
  summary: string;
  evidence: AnalysisEvidence[];
  nextChecks: string[];
  limitation: string;
};

export type AnalysisStatus = "idle" | "loading" | "success" | "error";

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    (v.result === "CODE_CANDIDATE" || v.result === "NEED_MORE_CHECK") &&
    typeof v.summary === "string" &&
    Array.isArray(v.evidence) &&
    v.evidence.every(
      (e) =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as Record<string, unknown>).path === "string" &&
        typeof (e as Record<string, unknown>).reason === "string"
    ) &&
    Array.isArray(v.nextChecks) &&
    v.nextChecks.every((c) => typeof c === "string") &&
    typeof v.limitation === "string"
  );
}
