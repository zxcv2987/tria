import type { TokenUsage } from "@tria/analysis";

export type ProviderOutput = {
  /** 파싱된(검증 전) 분석 JSON */
  result: unknown;
  /** provider가 제공하지 못하면 null */
  usage: TokenUsage | null;
};

/** 저장소를 자율 탐색해 분석하는 코딩 에이전트 CLI 추상화. */
export type AnalysisProvider = {
  /** repositoryPath를 read-only로 탐색해 prompt에 답한다. */
  run(prompt: string, repositoryPath: string): Promise<ProviderOutput>;
};
