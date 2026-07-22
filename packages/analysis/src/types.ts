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
