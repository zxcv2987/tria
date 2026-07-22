import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  isAnalysisResult,
  type CallbackPayload,
} from "@tria/analysis";
import { buildPrompt } from "./build-prompt";
import { validateEvidence } from "./validate-evidence";
import { sendCallback } from "./send-callback";

const execFileAsync = promisify(execFile);

const REQUIRED_ENV = [
  "ANALYSIS_RUN_ID",
  "ISSUE_TITLE",
  "ISSUE_BODY",
  "TARGET_REPOSITORY_PATH",
  "CALLBACK_URL",
  "CALLBACK_SECRET",
] as const;

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

function requireEnv(): Record<(typeof REQUIRED_ENV)[number], string> {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return Object.fromEntries(
    REQUIRED_ENV.map((key) => [key, process.env[key]!])
  ) as Record<(typeof REQUIRED_ENV)[number], string>;
}

async function runCodex(
  repositoryPath: string,
  prompt: string
): Promise<unknown> {
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
    return JSON.parse(raw);
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  let env: ReturnType<typeof requireEnv>;
  try {
    env = requireEnv();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const {
    ANALYSIS_RUN_ID,
    ISSUE_TITLE,
    ISSUE_BODY,
    TARGET_REPOSITORY_PATH,
    CALLBACK_URL,
    CALLBACK_SECRET,
  } = env;

  let payload: CallbackPayload;

  try {
    const prompt = await buildPrompt(ISSUE_TITLE, ISSUE_BODY);
    const parsed = await runCodex(TARGET_REPOSITORY_PATH, prompt);

    if (!isAnalysisResult(parsed)) {
      throw new Error("codex 출력이 AnalysisResult 형태와 일치하지 않습니다.");
    }

    const result = validateEvidence(parsed, TARGET_REPOSITORY_PATH);
    payload = {
      analysisRunId: ANALYSIS_RUN_ID,
      status: "SUCCEEDED",
      result,
    };
  } catch (err) {
    // execFile 에러 message는 인자(프롬프트) 전체를 포함하므로 stderr를 우선한다.
    const execErr = err as Error & { stderr?: string };
    const failureReason =
      typeof execErr.stderr === "string" && execErr.stderr.trim()
        ? execErr.stderr.trim()
        : err instanceof Error
          ? err.message
          : String(err);
    payload = {
      analysisRunId: ANALYSIS_RUN_ID,
      status: "FAILED",
      failureReason,
    };
  }

  await sendCallback(CALLBACK_URL, CALLBACK_SECRET, payload);

  if (payload.status === "FAILED") {
    console.error(payload.failureReason);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
