# Result Validator 워크트리 가이드

역할: AI가 만든 `AnalysisResult`에서 실제로 존재하지 않는 파일 근거를 제거하고, 유효한 근거가 없으면 판정을 보정하는 순수 검증 로직.

참고 문서: [../tria-mvp.md](../tria-mvp.md) 11장(최소 검증 규칙)

## 만들 파일

* `lib/validate-result.ts`

## 공유 계약

`lib/schemas.ts` 의 `AnalysisResult` 타입을 사용한다. 이 파일은 수정하지 않는다.

## 구현 방향

문서 11.1, 11.2의 의사코드를 그대로 함수화한다:

```ts
import fs from "node:fs";
import path from "node:path";
import type { AnalysisResult } from "./schemas";

export function validateResult(
  result: AnalysisResult,
  repositoryPath: string
): AnalysisResult {
  const validEvidence = result.evidence.filter((evidence) => {
    const fullPath = path.resolve(repositoryPath, evidence.path);
    return fullPath.startsWith(repositoryPath) && fs.existsSync(fullPath);
  });

  const correctedResult =
    result.result === "CODE_CANDIDATE" && validEvidence.length === 0
      ? "NEED_MORE_CHECK"
      : result.result;

  return { ...result, evidence: validEvidence, result: correctedResult };
}
```

path traversal 방지를 위해 `fullPath.startsWith(repositoryPath)` 체크를 유지한다. `repositoryPath` 뒤에 구분자를 붙여 비교하면 `../repo-evil` 같은 형제 디렉토리 오탐도 막을 수 있으니 고려할 것.

## 건드리지 않을 것

* 다른 모든 파일. 이 워크트리는 `lib/validate-result.ts` 하나만 완성하면 끝.

## 완료 기준

* 실제 존재하지 않는 파일 경로가 `evidence`에서 제거된다.
* 유효한 `evidence`가 0개면 `CODE_CANDIDATE` → `NEED_MORE_CHECK`로 보정된다.
* 위 두 동작을 확인하는 간단한 self-check(assert 기반 테스트 하나)를 남겨둔다.
