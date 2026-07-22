import type { AnalysisResult } from "./types";
import { isAnalysisResult } from "./schema";

export type CallbackPayload =
  | {
      analysisRunId: string;
      status: "SUCCEEDED";
      result: AnalysisResult;
      targetCommitSha?: string;
    }
  | {
      analysisRunId: string;
      status: "FAILED";
      failureReason: string;
    };

export function isCallbackPayload(value: unknown): value is CallbackPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  if (typeof v.analysisRunId !== "string") return false;

  if (v.status === "SUCCEEDED") {
    return isAnalysisResult(v.result);
  }

  if (v.status === "FAILED") {
    return typeof v.failureReason === "string";
  }

  return false;
}
