import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert";
import type { TokenUsage } from "@tria/analysis";
import type { AnalysisProvider } from "./types";

const execFileAsync = promisify(execFile);

// ponytail: gemini-cli는 codex의 --output-schema 같은 스키마 강제 출력이 없어서,
// 프롬프트가 요청한 "JSON만 출력" 지침에 의존해 응답 텍스트에서 JSON을 추출한다.
// 모델이 코드펜스나 설명을 덧붙이면 이 추출이 깨질 수 있음 — 실패 시 FAILED로 보고된다.
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Gemini 출력에서 JSON을 찾지 못했습니다.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

/** Gemini CLI `--output-format json`의 stats.models[*].tokens를 TokenUsage로 합산. */
export function usageFromGeminiStats(stats: unknown): TokenUsage | null {
  if (typeof stats !== "object" || stats === null) return null;
  const models = (stats as { models?: Record<string, unknown> }).models;
  if (!models || typeof models !== "object") return null;

  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let cachedTokens = 0;
  let model: string | undefined;

  for (const [name, metrics] of Object.entries(models)) {
    if (typeof metrics !== "object" || metrics === null) continue;
    const tokens = (metrics as { tokens?: Record<string, unknown> }).tokens;
    if (!tokens) continue;
    inputTokens += Number(tokens.prompt ?? tokens.input ?? 0) || 0;
    outputTokens += Number(tokens.candidates ?? 0) || 0;
    totalTokens += Number(tokens.total ?? 0) || 0;
    cachedTokens += Number(tokens.cached ?? 0) || 0;
    model ??= name;
  }

  if (inputTokens === 0 && outputTokens === 0 && totalTokens === 0) {
    return null;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens: totalTokens || inputTokens + outputTokens,
    ...(cachedTokens > 0 ? { cachedTokens } : {}),
    ...(model ? { model } : {}),
  };
}

// ponytail: gemini-cli가 기본으로 고르는 프리뷰 모델(gemini-3-flash 등)은
// 무료 티어 쿼터가 극단적으로 낮다(하루 5회 수준). 안정된 구버전 모델이
// 무료 쿼터가 더 넉넉해서 기본값으로 쓴다. GEMINI_MODEL로 언제든 바꿀 수 있음 —
// 계속 쿼터가 부족하면 이 값을 조정하는 게 실질적인 해결책.
const DEFAULT_MODEL = "gemini-2.0-flash";

/** Google Gemini CLI. GEMINI_API_KEY 환경변수만 있으면 별도 로그인 없이 인증된다. */
export const geminiProvider: AnalysisProvider = {
  async run(prompt: string, repositoryPath: string) {
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const { stdout } = await execFileAsync(
      "npx",
      [
        "--yes",
        "@google/gemini-cli",
        "-p",
        prompt,
        "-m",
        model,
        "--approval-mode",
        "plan",
        // GitHub Actions처럼 매번 새로 checkout되는 폴더는 Gemini CLI의
        // trusted-folder 검사를 통과 못 해서 헤드리스 실행이 막힌다.
        "--skip-trust",
        // response + stats(token usage)를 한 객체로 받는다.
        "--output-format",
        "json",
      ],
      {
        cwd: repositoryPath,
        timeout: 5 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const envelope = JSON.parse(stdout) as {
      response?: string;
      stats?: unknown;
      error?: { message?: string };
    };
    if (envelope.error?.message) {
      throw new Error(envelope.error.message);
    }
    if (typeof envelope.response !== "string") {
      throw new Error("Gemini JSON 출력에 response 필드가 없습니다.");
    }

    return {
      result: extractJson(envelope.response),
      usage: usageFromGeminiStats(envelope.stats),
    };
  },
};

// ponytail: assert 기반 self-check. 실행: node --experimental-strip-types packages/runner/src/providers/gemini.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  assert.deepStrictEqual(extractJson('앞에 설명\n```json\n{"a":1,"b":[2,3]}\n```\n뒤에 설명'), {
    a: 1,
    b: [2, 3],
  });
  assert.deepStrictEqual(extractJson('그냥 텍스트 { "a": 1 } 텍스트'), { a: 1 });
  assert.throws(() => extractJson("JSON이 전혀 없는 텍스트"));

  assert.deepStrictEqual(
    usageFromGeminiStats({
      models: {
        "gemini-2.0-flash": {
          tokens: { prompt: 100, candidates: 40, total: 140, cached: 10 },
        },
      },
    }),
    {
      inputTokens: 100,
      outputTokens: 40,
      totalTokens: 140,
      cachedTokens: 10,
      model: "gemini-2.0-flash",
    }
  );
  assert.strictEqual(usageFromGeminiStats(null), null);

  console.log("gemini extractJson/usage self-check passed");
}
