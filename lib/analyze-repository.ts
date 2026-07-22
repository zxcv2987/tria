import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { AnalysisResult, isAnalysisResult } from "./schemas";

const execFileAsync = promisify(execFile);

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    result: { type: "string", enum: ["CODE_CANDIDATE", "NEED_MORE_CHECK"] },
    summary: { type: "string" },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          reason: { type: "string" },
        },
        required: ["path", "reason"],
        additionalProperties: false,
      },
    },
    nextChecks: { type: "array", items: { type: "string" } },
    limitation: { type: "string" },
  },
  required: ["result", "summary", "evidence", "nextChecks", "limitation"],
  additionalProperties: false,
};

export async function analyzeRepository(
  title: string,
  body: string
): Promise<AnalysisResult> {
  const repositoryPath = process.env.TARGET_REPOSITORY_PATH;
  if (!repositoryPath) {
    throw new Error("TARGET_REPOSITORY_PATH 환경변수가 설정되지 않았습니다.");
  }

  const template = await fs.readFile(
    path.join(process.cwd(), "prompts/analyze-issue.md"),
    "utf-8"
  );
  const prompt = template.replace("{{title}}", title).replace("{{body}}", body);

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
    const parsed = JSON.parse(raw);

    if (!isAnalysisResult(parsed)) {
      throw new Error("codex 출력이 AnalysisResult 형태와 일치하지 않습니다.");
    }

    return parsed;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
