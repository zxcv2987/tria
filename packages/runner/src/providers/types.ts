/** 저장소를 자율 탐색해 분석하는 코딩 에이전트 CLI 추상화. */
export type AnalysisProvider = {
  /** repositoryPath를 read-only로 탐색해 prompt에 답하고, 파싱된(검증 전) JSON을 반환한다. */
  run(prompt: string, repositoryPath: string): Promise<unknown>;
};
