import type { AnalysisResult, TokenUsage } from "./types";
import { isAnalysisResult } from "./schema";

export type CallbackPayload =
  | {
      analysisRunId: string;
      status: "SUCCEEDED";
      result: AnalysisResult;
      targetCommitSha?: string;
      usage?: TokenUsage | null;
    }
  | {
      analysisRunId: string;
      status: "FAILED";
      failureReason: string;
    };

export function isTokenUsage(value: unknown): value is TokenUsage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.inputTokens === "number" &&
    typeof v.outputTokens === "number" &&
    typeof v.totalTokens === "number" &&
    (v.cachedTokens === undefined || typeof v.cachedTokens === "number") &&
    (v.model === undefined || typeof v.model === "string")
  );
}

export function isCallbackPayload(value: unknown): value is CallbackPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  if (typeof v.analysisRunId !== "string") return false;

  if (v.status === "SUCCEEDED") {
    if (!isAnalysisResult(v.result)) return false;
    if (v.usage !== undefined && v.usage !== null && !isTokenUsage(v.usage)) {
      return false;
    }
    return true;
  }

  if (v.status === "FAILED") {
    return typeof v.failureReason === "string";
  }

  return false;
}
