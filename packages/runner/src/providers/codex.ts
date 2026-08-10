import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AnalysisProvider } from "./types";

const execFileAsync = promisify(execFile);

/** 세션이 없을 때 API 키 로그인이 필요한지 결정하는 순수 함수 (부수효과 없이 테스트 가능). */
export function needsApiKeyLogin(mode: string, hasSession: boolean): boolean {
  if (mode === "session") return false;
  if (mode === "api-key") return true;
  if (mode !== "auto") {
    throw new Error(`알 수 없는 CODEX_AUTH_MODE: ${mode}`);
  }
  return !hasSession;
}

async function hasLoggedInSession(): Promise<boolean> {
  try {
    await execFileAsync("codex", ["login", "status"]);
    return true;
  } catch {
    return false;
  }
}

async function loginWithApiKey(apiKey: string): Promise<void> {
  const run = execFileAsync("codex", ["login", "--with-api-key"]);
  run.child.stdin?.end(apiKey);
  await run;
}

function requireApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "codex 로그인 세션이 없고 OPENAI_API_KEY도 없습니다. `codex login`으로 로그인하거나 OPENAI_API_KEY를 설정하세요."
    );
  }
  return apiKey;
}

/**
 * CODEX_AUTH_MODE=auto(기본) | session | api-key.
 * auto: 로컬 개발처럼 이미 `codex login` 세션이 있으면 그대로 쓰고, GitHub Actions처럼
 * 세션이 없는 환경에서는 OPENAI_API_KEY로 자동 로그인한다. 세션/API 키 중 무엇을 쓸지
 * 강제하고 싶으면 이 플래그 하나만 바꾸면 된다.
 */
async function ensureAuth(): Promise<void> {
  const mode = process.env.CODEX_AUTH_MODE ?? "auto";
  const hasSession = mode === "auto" ? await hasLoggedInSession() : false;
  if (needsApiKeyLogin(mode, hasSession)) {
    await loginWithApiKey(requireApiKey());
  }
}

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    result: {
      type: "string",
      enum: ["CODE_LIKELY", "CHECK_EXTERNAL", "NEED_MORE_INFO"],
    },
    summary: { type: "string" },
    suspectedArea: { type: ["string", "null"] },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          symbol: { type: "string" },
          reason: { type: "string" },
        },
        // Codex structured output은 properties 키가 전부 required여야 한다.
        required: ["path", "symbol", "reason"],
        additionalProperties: false,
      },
    },
    externalChecks: { type: "array", items: { type: "string" } },
    missingInformation: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: [
    "result",
    "summary",
    "suspectedArea",
    "evidence",
    "externalChecks",
    "missingInformation",
    "limitations",
  ],
  additionalProperties: false,
};

/** OpenAI Codex CLI. 인증은 ensureAuth()가 CODEX_AUTH_MODE에 따라 자동 처리한다. */
export const codexProvider: AnalysisProvider = {
  async run(prompt: string, repositoryPath: string) {
    await ensureAuth();

    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "tria-codex-"));
    const schemaPath = path.join(workDir, "schema.json");
    const outputPath = path.join(workDir, "output.json");

    try {
      await fs.writeFile(schemaPath, JSON.stringify(OUTPUT_SCHEMA));

      const run = execFileAsync(
        "codex",
        [
          "exec",
          "-C",
          repositoryPath,
          "-s",
          "read-only",
          "--skip-git-repo-check",
          "--output-schema",
          schemaPath,
          "-o",
          outputPath,
          prompt,
        ],
        { timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 }
      );
      // codex는 프롬프트를 인자로 받아도 stdin이 열려 있으면 EOF를 기다리며 멈춘다.
      run.child.stdin?.end();
      await run;

      const raw = await fs.readFile(outputPath, "utf-8");
      // ponytail: codex -o는 분석 JSON만 쓰고 usage 이벤트를 안 남김. --json JSONL
      // 파싱은 필요할 때 추가.
      return { result: JSON.parse(raw), usage: null };
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  },
};

// ponytail: assert 기반 self-check. 실행: node --experimental-strip-types packages/runner/src/providers/codex.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  assert.strictEqual(needsApiKeyLogin("session", false), false);
  assert.strictEqual(needsApiKeyLogin("session", true), false);
  assert.strictEqual(needsApiKeyLogin("api-key", false), true);
  assert.strictEqual(needsApiKeyLogin("api-key", true), true);
  assert.strictEqual(needsApiKeyLogin("auto", true), false);
  assert.strictEqual(needsApiKeyLogin("auto", false), true);
  assert.throws(() => needsApiKeyLogin("bogus", true));

  console.log("codex auth-mode self-check passed");
}
