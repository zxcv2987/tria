# Codex Runner 워크트리 가이드

역할: 이슈 텍스트를 받아 codex CLI로 대상 저장소를 분석하고, 구조화된 `AnalysisResult` JSON을 반환하는 백엔드.

참고 문서: [../tria-mvp.md](../tria-mvp.md) 7장(결과 유형), 8장(AI 출력 형식), 9.3(Codex CLI), 10장(프로젝트 구조)

## 만들 파일

* `app/api/analyze/route.ts`
* `lib/analyze-repository.ts`
* `prompts/analyze-issue.md`

## 공유 계약

`lib/schemas.ts` 의 `AnalysisResult` 타입과 `isAnalysisResult` 검증 함수를 그대로 사용한다. 이 파일은 수정하지 않는다.

## 구현 방향

* 환경변수 `TARGET_REPOSITORY_PATH`(분석 대상 로컬 저장소 경로)를 읽는다. `.env`에 설정 필요.
* `prompts/analyze-issue.md`: 이슈 제목/본문을 codex에게 전달할 프롬프트 템플릿. 문서 8장의 `AnalysisResult` JSON 스키마를 출력 형식으로 명시하고, 11.3의 "확정 표현 금지" 규칙을 포함시킨다.
* `lib/analyze-repository.ts`:
  * 프롬프트에 이슈 제목/본문을 채워 넣는다.
  * `codex exec`를 child_process로 실행한다 (cwd: `TARGET_REPOSITORY_PATH`).
  * 결과(파일 또는 stdout)를 읽어 `JSON.parse`한다.
  * `isAnalysisResult`로 형태를 검증하고, 실패 시 에러를 던진다.
* `app/api/analyze/route.ts`:
  * POST body에서 `title`, `body`를 받는다.
  * `analyze-repository`를 호출한다.
  * 결과를 JSON으로 응답한다. (`lib/validate-result.ts` 연동은 아직 안 되어 있어도 됨 — 최종 wiring 단계에서 import만 추가)

## codex exec 참고

로컬에 codex CLI가 설치되어 있다고 가정한다. 정확한 커맨드 옵션은 실행 환경에서 `codex exec --help`로 확인할 것.

## 건드리지 않을 것

* `components/*`, `app/page.tsx` — frontend-ui 워크트리 담당
* `lib/validate-result.ts` — result-validator 워크트리 담당 (나중에 route.ts에서 import만 추가)

## 완료 기준

* `POST /api/analyze`에 실제 이슈 제목/내용을 보내면 codex가 `TARGET_REPOSITORY_PATH`를 분석해 `AnalysisResult` 형태의 JSON을 반환한다.
* curl 또는 스크립트로 UI 없이 단독 테스트 가능하다.
