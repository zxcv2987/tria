# Runner 워크트리 가이드

역할: GitHub Actions 안에서 실행되는 분석 코드(`packages/runner`)를 만든다. 별도 서버가 아니라, Tria 저장소의 GitHub Actions가 시작될 때만 실행되는 코드다.

참고 문서: [../tria-production.md](../tria-production.md) 7.3(Tria Runner), 14장(GitHub Actions 흐름)

## 만들 파일

* `packages/runner/package.json`
* `packages/runner/src/build-prompt.ts`
* `packages/runner/src/validate-evidence.ts`
* `packages/runner/src/send-callback.ts`
* `packages/runner/src/run.ts` (엔트리포인트)
* `packages/runner/prompts/analyze-issue.md`

## 공유 계약

`packages/analysis` (`@tria/analysis`)의 타입과 함수를 그대로 쓴다. 이 패키지는 이미 완성되어 있고 수정하지 않는다.

```ts
import type { AnalysisResult } from "@tria/analysis";
import { isAnalysisResult, validateResult } from "@tria/analysis";
import type { CallbackPayload } from "@tria/analysis";
import { isCallbackPayload } from "@tria/analysis";
```

`packages/analysis` 의존을 위해 `packages/runner/package.json`에 `"@tria/analysis": "workspace:*"`를 추가한다.

## 참고할 기존 코드

`apps/web/lib/analyze-repository.ts`에 MVP 단계에서 이미 만든 codex 실행 로직이 있다 (프롬프트 채우기 → `codex exec` 실행 → 결과 파일 파싱 → `isAnalysisResult` 검증). 이 로직을 참고해서 GitHub Actions 실행 환경에 맞게 재구성하면 된다. 그 파일은 건드리지 마라 (apps/web은 다른 트랙 담당).

## run.ts 실행 계약 (github-actions 트랙과 공유)

GitHub Actions 워크플로는 다음 환경변수를 설정한 뒤 `packages/runner`의 엔트리포인트를 실행한다. 이 계약은 고정값이니 그대로 구현할 것 — github-actions 트랙이 동시에 이 계약을 보고 워크플로를 작성한다.

```text
환경변수:
  ANALYSIS_RUN_ID       분석 실행 ID
  ISSUE_TITLE           이슈 제목
  ISSUE_BODY            이슈 본문
  TARGET_REPOSITORY_PATH  분석 대상 저장소가 checkout된 경로 (예: GITHUB_WORKSPACE/target)
  CALLBACK_URL          결과를 보낼 Tria Callback API 주소
  CALLBACK_SECRET       Callback 요청 인증에 쓸 공유 secret (헤더에 실어 보냄)

실행:
  node packages/runner/dist/run.js
  (또는 tsx/ts-node로 직접 실행 — package.json의 "start" 스크립트로 고정해서 워크플로가 스크립트 이름만 알면 되게 할 것)
```

## 구현 방향

* `build-prompt.ts`: `prompts/analyze-issue.md` 템플릿에 `ISSUE_TITLE`/`ISSUE_BODY`를 채워 넣는다.
* `run.ts`:
  1. 환경변수 읽고 없으면 실패로 종료 (exit code 1, 이유를 stderr에 출력)
  2. 프롬프트 생성 → `codex exec`를 `TARGET_REPOSITORY_PATH`에서 실행 (`apps/web/lib/analyze-repository.ts`의 execFile 패턴 참고, 특히 stdin 닫는 부분 — 안 닫으면 codex가 멈춘다)
  3. 결과 JSON 파싱 → `isAnalysisResult`로 검증
  4. `validate-evidence.ts` (= `@tria/analysis`의 `validateResult`를 호출하는 얇은 래퍼) 로 파일 존재 여부 검증 + 판정 보정
  5. 성공하면 `send-callback.ts`로 `CallbackPayload` (`status: "SUCCEEDED"`) 를 `CALLBACK_URL`에 POST
  6. 실패(코덱스 실행 실패, JSON 파싱 실패, 타임아웃 등)하면 `status: "FAILED"` + `failureReason`으로 Callback 호출
* `send-callback.ts`: `fetch(CALLBACK_URL, { method: "POST", headers: { Authorization: \`Bearer ${CALLBACK_SECRET}\` }, body: JSON.stringify(payload) })`. Callback 응답이 실패(2xx 아님)해도 이 프로세스 자체는 예외를 던지고 GitHub Actions가 실패로 기록하게 둔다 (재시도는 워크플로/Actions 몫).

## 건드리지 않을 것

* `apps/web/**` — web-api, web-ui 트랙 담당
* `.github/workflows/**` — github-actions 트랙 담당
* `packages/analysis/**` — 이미 완성된 공유 계약, 수정 금지

## 완료 기준

* `ANALYSIS_RUN_ID`, `ISSUE_TITLE`, `ISSUE_BODY`, `TARGET_REPOSITORY_PATH`, `CALLBACK_URL`, `CALLBACK_SECRET` 환경변수를 넣고 `packages/runner`를 로컬에서 직접 실행했을 때 (`TARGET_REPOSITORY_PATH`를 아무 로컬 저장소로 지정) 실제로 codex가 분석하고 `CallbackPayload` 형태의 JSON을 만들어 `CALLBACK_URL`로 POST하는 것까지 확인한다 (`CALLBACK_URL`은 `https://httpbin.org/post`나 로컬에 띄운 임시 서버로 테스트해도 됨).
* 코덱스 실행 실패 시에도 `status: "FAILED"` Callback이 나가는 것을 확인한다.
