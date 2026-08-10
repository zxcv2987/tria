export type AnalysisEvidence = {
  path: string;
  symbol?: string;
  reason: string;
};

export type AnalysisResult = {
  result: "CODE_LIKELY" | "CHECK_EXTERNAL" | "NEED_MORE_INFO";
  summary: string;
  suspectedArea: string | null;
  evidence: AnalysisEvidence[];
  externalChecks: string[];
  missingInformation: string[];
  limitations: string[];
};

/** 한 번의 분석 실행에서 소비한 토큰. provider가 제공하지 못하면 null. */
export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  model?: string;
};

export type AnalysisStatus = "idle" | "loading" | "success" | "error";
