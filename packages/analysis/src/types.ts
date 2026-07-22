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

export type AnalysisStatus = "idle" | "loading" | "success" | "error";
