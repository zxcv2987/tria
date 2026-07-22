import {
  isAnalysisResult,
  type CallbackPayload,
} from "@tria/analysis";
import { buildPrompt } from "./build-prompt";
import { validateEvidence } from "./validate-evidence";
import { sendCallback } from "./send-callback";
import { codexProvider } from "./providers/codex";
import { geminiProvider } from "./providers/gemini";
import type { AnalysisProvider } from "./providers/types";

const REQUIRED_ENV = [
  "ANALYSIS_RUN_ID",
  "ISSUE_TITLE",
  "ISSUE_BODY",
  "TARGET_REPOSITORY_PATH",
  "CALLBACK_URL",
  "CALLBACK_SECRET",
] as const;

/** ANALYSIS_PROVIDER=codex|gemini (기본 gemini — 무료 API 키로 테스트 가능). */
function selectProvider(): AnalysisProvider {
  const name = process.env.ANALYSIS_PROVIDER ?? "gemini";
  if (name === "codex") return codexProvider;
  if (name === "gemini") {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "ANALYSIS_PROVIDER=gemini인데 GEMINI_API_KEY 환경변수가 없습니다."
      );
    }
    return geminiProvider;
  }
  throw new Error(`알 수 없는 ANALYSIS_PROVIDER: ${name}`);
}

/** CALLBACK_URL(.../api/analysis/callback)에서 상태 갱신 엔드포인트 URL을 유도한다. */
function buildStatusUrl(callbackUrl: string, analysisRunId: string): string {
  const base = callbackUrl.replace(/\/api\/analysis\/callback\/?$/, "");
  return `${base}/api/analysis/${analysisRunId}/status`;
}

/** RUNNING 보고는 best-effort — 실패해도 분석 자체는 계속 진행한다. */
async function reportRunning(
  callbackUrl: string,
  callbackSecret: string,
  analysisRunId: string
): Promise<void> {
  try {
    await fetch(buildStatusUrl(callbackUrl, analysisRunId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${callbackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "RUNNING" }),
    });
  } catch (err) {
    console.error(
      "RUNNING 상태 보고 실패 (무시하고 계속 진행):",
      err instanceof Error ? err.message : err
    );
  }
}

function requireEnv(): Record<(typeof REQUIRED_ENV)[number], string> {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
  return Object.fromEntries(
    REQUIRED_ENV.map((key) => [key, process.env[key]!])
  ) as Record<(typeof REQUIRED_ENV)[number], string>;
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

  await reportRunning(CALLBACK_URL, CALLBACK_SECRET, ANALYSIS_RUN_ID);

  try {
    const provider = selectProvider();
    const prompt = await buildPrompt(ISSUE_TITLE, ISSUE_BODY);
    const parsed = await provider.run(prompt, TARGET_REPOSITORY_PATH);

    if (!isAnalysisResult(parsed)) {
      throw new Error("분석 결과가 AnalysisResult 형태와 일치하지 않습니다.");
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
