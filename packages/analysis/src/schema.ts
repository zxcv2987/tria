import type { AnalysisResult } from "./types";

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    (v.result === "CODE_LIKELY" ||
      v.result === "CHECK_EXTERNAL" ||
      v.result === "NEED_MORE_INFO") &&
    typeof v.summary === "string" &&
    (v.suspectedArea === null || typeof v.suspectedArea === "string") &&
    Array.isArray(v.evidence) &&
    v.evidence.every(
      (e) =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as Record<string, unknown>).path === "string" &&
        ((e as Record<string, unknown>).symbol === undefined ||
          typeof (e as Record<string, unknown>).symbol === "string") &&
        typeof (e as Record<string, unknown>).reason === "string"
    ) &&
    Array.isArray(v.externalChecks) &&
    v.externalChecks.every((c) => typeof c === "string") &&
    Array.isArray(v.missingInformation) &&
    v.missingInformation.every((c) => typeof c === "string") &&
    Array.isArray(v.limitations) &&
    v.limitations.every((c) => typeof c === "string")
  );
}
