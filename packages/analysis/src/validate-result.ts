import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import type { AnalysisResult } from "./types";

export function validateResult(
  result: AnalysisResult,
  repositoryPath: string
): AnalysisResult {
  const repoRoot = path.resolve(repositoryPath);
  const repoRootWithSep = repoRoot + path.sep;

  const validEvidence = result.evidence.filter((evidence) => {
    const fullPath = path.resolve(repoRoot, evidence.path);
    return fullPath === repoRoot || fullPath.startsWith(repoRootWithSep)
      ? fs.existsSync(fullPath)
      : false;
  });

  const correctedResult =
    result.result === "CODE_LIKELY" && validEvidence.length === 0
      ? "CHECK_EXTERNAL"
      : result.result;

  return { ...result, evidence: validEvidence, result: correctedResult };
}

// ponytail: assert 기반 self-check. 실행: node --experimental-strip-types packages/analysis/src/validate-result.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const repositoryPath = path.dirname(new URL(import.meta.url).pathname);

  const base: AnalysisResult = {
    result: "CODE_LIKELY",
    summary: "test",
    suspectedArea: null,
    evidence: [
      { path: "types.ts", reason: "exists" },
      { path: "does-not-exist.ts", reason: "missing" },
      { path: "../outside-evil.ts", reason: "traversal" },
    ],
    externalChecks: [],
    missingInformation: [],
    limitations: [],
  };

  const withRealEvidence = validateResult(base, repositoryPath);
  assert.deepStrictEqual(
    withRealEvidence.evidence.map((e) => e.path),
    ["types.ts"],
    "존재하지 않거나 경로 탈출한 evidence는 제거되어야 한다"
  );
  assert.strictEqual(
    withRealEvidence.result,
    "CODE_LIKELY",
    "유효 evidence가 있으면 판정을 유지해야 한다"
  );

  const noValidEvidence = validateResult(
    { ...base, evidence: [{ path: "does-not-exist.ts", reason: "missing" }] },
    repositoryPath
  );
  assert.strictEqual(
    noValidEvidence.result,
    "CHECK_EXTERNAL",
    "유효 evidence가 0개면 CODE_LIKELY는 CHECK_EXTERNAL로 보정되어야 한다"
  );

  console.log("validate-result self-check passed");
}
