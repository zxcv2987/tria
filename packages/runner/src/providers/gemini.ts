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

/** Google Gemini CLI. GEMINI_API_KEY 환경변수만 있으면 별도 로그인 없이 인증된다. */
export const geminiProvider: AnalysisProvider = {
  async run(prompt: string, repositoryPath: string): Promise<unknown> {
    const { stdout } = await execFileAsync(
      "npx",
      [
        "--yes",
        "@google/gemini-cli",
        "-p",
        prompt,
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
