import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import type { AnalysisResult } from "./schemas";

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
    result.result === "CODE_CANDIDATE" && validEvidence.length === 0
      ? "NEED_MORE_CHECK"
      : result.result;

  return { ...result, evidence: validEvidence, result: correctedResult };
}

// ponytail: assert 기반 self-check. 실행: node --experimental-strip-types lib/validate-result.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const repositoryPath = process.cwd();

  const base: AnalysisResult = {
    result: "CODE_CANDIDATE",
    summary: "test",
    evidence: [
      { path: "lib/schemas.ts", reason: "exists" },
      { path: "lib/does-not-exist.ts", reason: "missing" },
      { path: "../outside-evil.ts", reason: "traversal" },
    ],
    nextChecks: [],
    limitation: "",
  };

  const withRealEvidence = validateResult(base, repositoryPath);
  assert.deepStrictEqual(
    withRealEvidence.evidence.map((e) => e.path),
    ["lib/schemas.ts"],
    "존재하지 않거나 경로 탈출한 evidence는 제거되어야 한다"
  );
  assert.strictEqual(
    withRealEvidence.result,
    "CODE_CANDIDATE",
    "유효 evidence가 있으면 판정을 유지해야 한다"
  );

  const noValidEvidence = validateResult(
    { ...base, evidence: [{ path: "lib/does-not-exist.ts", reason: "missing" }] },
    repositoryPath
  );
  assert.strictEqual(
    noValidEvidence.result,
    "NEED_MORE_CHECK",
    "유효 evidence가 0개면 CODE_CANDIDATE는 NEED_MORE_CHECK로 보정되어야 한다"
  );

  console.log("validate-result self-check passed");
}
