# Web API 워크트리 가이드

역할: `apps/web`에 Asana 웹훅 수신, 분석 실행 트리거(비동기), Callback 수신 API를 만든다.

참고 문서: [../tria-production.md](../tria-production.md) 5장(Asana 워크플로), 13장(API 설계), 6장(전체 시스템 흐름), 18장(중복 및 동시 실행), 19장(운영 실패 처리)

## 만들 파일

* `apps/web/app/api/webhooks/asana/route.ts`
* `apps/web/app/api/issues/[id]/analyze/route.ts`
* `apps/web/app/api/analysis/callback/route.ts`
* `apps/web/app/api/analysis/[runId]/status/route.ts`

## 공유 계약

`@tria/analysis`의 `CallbackPayload`, `isCallbackPayload`, `AnalysisResult` 타입을 그대로 쓴다.

```ts
import type { CallbackPayload } from "@tria/analysis";
import { isCallbackPayload } from "@tria/analysis";
```

## DB 테이블 (db-schema 트랙과 병행 — 문서 12장 기준으로 먼저 짜도 됨)

`issues`, `analysis_runs`, `project_configs`, `analysis_feedback` 테이블이 db-schema 트랙에서 별도로 만들어지는 중이다. 정확한 컬럼명은 `docs/db-schema/README.md` 하단(완료되면 갱신됨)을 확인하고, 그 전까지는 문서 12장의 필드를 스네이크케이스로 가정하고 작성해도 된다 — 최종 wiring 단계에서 실제 컬럼명에 맞춰 조정한다.

Supabase 클라이언트는 `docs/supabase.md`와 supabase 스킬을 참고해서 서버 사이드(service role)로 연결한다.

## 각 라우트 구현 방향

### `POST /api/webhooks/asana`

* Asana 웹훅 핸드셰이크 처리 (최초 등록 시 `X-Hook-Secret` 헤더를 그대로 응답 헤더에 실어 200 반환)
* 이후 요청은 HMAC 서명 검증 (`X-Hook-Signature`, 저장해둔 핸드셰이크 secret 사용)
* 검증 통과하면 변경된 태스크 gid로 Asana API를 다시 조회해 최신 제목/본문/상태를 가져와 `issues` 테이블에 upsert
* 문서 5.2 분석 시작 조건(상태가 `AI 분석 요청`, 프로젝트 설정 있음, 진행 중/완료된 동일 분석 없음)을 만족하면 `POST /api/issues/[id]/analyze`와 같은 로직으로 분석 실행 생성

### `POST /api/issues/[id]/analyze`

* `analysis_runs`에 `status: "QUEUED"` row 생성
* GitHub API로 Tria 저장소에 `repository_dispatch` 호출 (`event_type: "analyze-issue"`, client_payload는 `docs/github-actions/README.md`의 payload 스키마 그대로 — `analysisRunId`, `projectKey`, `repositoryOwner`, `repositoryName`, `ref`, `issueTitle`, `issueBody`, `callbackUrl`)
* `repositoryOwner`/`repositoryName`/`ref`는 사용자 입력이 아니라 `project_configs`에서 조회한 값만 사용 (문서 14장 — allowlist). `repositoryOwner`는 Tria 자신의 owner와 다를 수 있다 (다른 조직 레포 지원).
* 즉시 `{ analysisRunId, status: "QUEUED" }` 응답 (동기로 기다리지 않음)
* 실제 GitHub App 토큰/PAT이 아직 없으면 `GITHUB_DISPATCH_TOKEN` 환경변수를 읽는 걸로 구현해두고, 없을 때는 에러를 명확히 반환 (다른 트랙이 나중에 실제 토큰을 채움)

### `POST /api/analysis/callback`

* `CALLBACK_SECRET`(runner 트랙과 공유하는 값, 문서 `docs/runner/README.md` 참고)로 `Authorization: Bearer` 헤더 검증
* body를 `isCallbackPayload`로 검증
* `status: "SUCCEEDED"`면 `result`를 `@tria/analysis`의 `validateResult`로 한 번 더 재검증 후 `analysis_runs`에 저장 (판정, 요약, evidence 등)
* `status: "FAILED"`면 `failure_reason` 저장
* 이미 완료 처리된 `analysisRunId`에 대한 중복 callback은 무시 (idempotency)

### `POST /api/analysis/[runId]/status`

* Runner가 `RUNNING` 상태를 알리는 용도. body의 `status`를 검증해서 `analysis_runs.status` 갱신만 하면 됨 (단순)

## 건드리지 않을 것

* `apps/web/app/page.tsx`, `apps/web/components/**`, `apps/web/app/issues/**`, `apps/web/app/settings/**` — web-ui 트랙 담당
* `packages/**`, `.github/**` — 다른 트랙 담당

## 완료 기준

* 4개 라우트가 타입체크/빌드를 통과한다.
* `POST /api/analysis/callback`에 `CallbackPayload` 형태의 목업 요청을 보내면 (실제 DB 연결 여부와 무관하게) 정상적으로 검증되고 응답이 오는 것을 curl로 확인한다.
* GitHub App 토큰, 실제 Asana secret 등 아직 없는 자격증명은 환경변수 이름과 함께 코드에 명확히 남겨두고, 최종 wiring 단계에서 채운다.
