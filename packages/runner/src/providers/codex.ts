import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AnalysisProvider } from "./types";

const execFileAsync = promisify(execFile);

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

/** OpenAI Codex CLI. ChatGPT 로그인 세션 또는 `codex login --with-api-key`(OPENAI_API_KEY) 인증 필요. */
export const codexProvider: AnalysisProvider = {
  async run(prompt: string, repositoryPath: string) {
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
