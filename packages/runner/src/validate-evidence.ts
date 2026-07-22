import { validateResult, type AnalysisResult } from "@tria/analysis";

export function validateEvidence(
  result: AnalysisResult,
  repositoryPath: string
): AnalysisResult {
  return validateResult(result, repositoryPath);
}
