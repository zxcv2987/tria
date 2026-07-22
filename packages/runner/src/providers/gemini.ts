import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert";
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

// ponytail: gemini-cli가 기본으로 고르는 프리뷰 모델(gemini-3-flash 등)은
// 무료 티어 쿼터가 극단적으로 낮다(하루 5회 수준). 안정된 구버전 모델이
// 무료 쿼터가 더 넉넉해서 기본값으로 쓴다. GEMINI_MODEL로 언제든 바꿀 수 있음 —
// 계속 쿼터가 부족하면 이 값을 조정하는 게 실질적인 해결책.
const DEFAULT_MODEL = "gemini-2.0-flash";

/** Google Gemini CLI. GEMINI_API_KEY 환경변수만 있으면 별도 로그인 없이 인증된다. */
export const geminiProvider: AnalysisProvider = {
  async run(prompt: string, repositoryPath: string): Promise<unknown> {
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
      ],
      {
        cwd: repositoryPath,
        timeout: 5 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    return extractJson(stdout);
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

  console.log("gemini extractJson self-check passed");
}
