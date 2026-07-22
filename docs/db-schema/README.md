# DB Schema 워크트리 가이드

역할: 운영형 Tria가 저장할 데이터 모델(이슈, 분석 실행, 프로젝트 설정, 피드백)을 Supabase에 실제 테이블로 만든다.

참고 문서: [../tria-production.md](../tria-production.md) 12장(데이터 모델), 7.6(데이터베이스), 17장(보안 - 웹 인증), [../supabase.md](../supabase.md)

## 시작하기 전에 반드시 확인할 것

마이그레이션 방식은 **Declarative schemas**로 확정됐다. 상세는 [../supabase.md](../supabase.md)와 아래 “채택 결과”를 본다. 스키마 변경 시 `supabase/schemas/`를 먼저 수정하고, Docker가 있을 때 `supabase db diff -f <name>`으로 마이그레이션을 생성한다. 원격 확인·적용은 MCP(`execute_sql`, `apply_migration`, `get_advisors` 등) 또는 CLI `db push`를 사용한다.

## 만들 테이블 (문서 12장 그대로)

* `issues` — 문서 12.1 `Issue` 타입 그대로 (asana_task_gid, asana_url, title, description, project_key, environment, occurred_url, reproduction_steps, expected_result, actual_result, asana_status, source_modified_at, created_at, updated_at)
* `analysis_runs` — 문서 12.2 `AnalysisRun` 타입 그대로 (status: QUEUED/RUNNING/SUCCEEDED/FAILED, result_type, target_repository, target_ref, target_commit_sha, summary, suspected_area, evidence jsonb, external_checks jsonb, missing_information jsonb, limitations jsonb, workflow_run_url, failure_reason, started_at, finished_at, created_at)
* `project_configs` — 문서 12.3 `ProjectConfig` 타입 그대로 (key, name, asana_project_value, github_owner, github_repository, default_ref, is_active)
* `analysis_feedback` — 문서 12.4 `AnalysisFeedback` 타입 그대로 (analysis_run_id, result: CORRECT/PARTIALLY_HELPFUL/NOT_HELPFUL/WRONG, comment, created_at)

타입 이름과 필드 이름은 스네이크케이스로, `AnalysisResult`의 `evidence`/`nextChecks`/`limitation` 배열은 `jsonb`로 저장한다 (packages/analysis의 타입과 나중에 web-api 트랙이 매핑한다).

## 제약과 인덱스

* 문서 18장(중복 및 동시 실행) 기준: `UNIQUE(issue_id, source_modified_at)` 같은 중복 방지 제약 고려
* `analysis_runs.issue_id`, `issues.asana_task_gid`에 인덱스
* 외래키: `analysis_runs.issue_id → issues.id`, `analysis_feedback.analysis_run_id → analysis_runs.id`

## RLS

문서 17장은 "회사 Google 계정 또는 SSO, 내부 사용자만 접근"이라고 하지만 인증 시스템은 아직 없다. 지금 단계에서는:

* RLS는 켜두되, 정책은 `service_role`만 전체 접근 가능하도록 최소한으로 만들어라 (web-api 트랙이 서버 사이드에서 service role로 접근할 것이므로).
* 실제 사용자 인증 기반 정책은 인증 시스템이 붙는 다음 단계로 미룬다 — 코드에 주석으로 명시.

## 건드리지 않을 것

* `apps/web/**`, `packages/**`, `.github/**` — 다른 트랙 담당

## 완료 기준

* 4개 테이블이 실제 Supabase 프로젝트(`ermjugtkrcqbheqnpanv`)에 생성되어 있다 (MCP `execute_sql` 등으로 확인).
* 각 테이블에 최소 하나씩 더미 row를 넣고 조회해서 제약/타입이 정상 동작하는지 확인한다.
* 채택한 마이그레이션 방식과 최종 테이블 스키마(컬럼명, 타입)를 이 문서 하단에 실제 반영한 내용으로 갱신해서, web-api 트랙이 그대로 참고할 수 있게 한다.

---

## 채택 결과 (2026-07-22)

### 마이그레이션 방식

* **Declarative schemas**: `supabase/schemas/`가 소스 오브 트루스
* `config.toml` → `[db.migrations].schema_paths`에 스키마 파일 순서 고정
* 생성된 마이그레이션: `supabase/migrations/20260722041437_create_tria_core_tables.sql` (원격 history version `20260722041437`)
* 이후 변경 절차: schemas 수정 → (Docker 필요) `supabase db diff -f <name>` → 리뷰 → 원격 적용 (`supabase db push` 또는 MCP `apply_migration`)
* 초기 적용은 Docker(shadow DB) 부재로 MCP `apply_migration`으로 부트스트랩함

### Enums

| 타입 | 값 |
|------|----|
| `analysis_run_status` | `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED` |
| `analysis_result_type` | `CODE_LIKELY`, `CHECK_EXTERNAL`, `NEED_MORE_INFO` |
| `analysis_feedback_result` | `CORRECT`, `PARTIALLY_HELPFUL`, `NOT_HELPFUL`, `WRONG` |

### `project_configs`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `key` | `text` | UNIQUE NOT NULL |
| `name` | `text` | NOT NULL |
| `asana_project_value` | `text` | NOT NULL |
| `github_owner` | `text` | NOT NULL |
| `github_repository` | `text` | NOT NULL |
| `default_ref` | `text` | NOT NULL |
| `is_active` | `boolean` | NOT NULL DEFAULT true |

### `issues`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | `uuid` | PK |
| `asana_task_gid` | `text` | UNIQUE NOT NULL, 인덱스 |
| `asana_url` | `text` | NOT NULL |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL DEFAULT `''` |
| `project_key` | `text` | NOT NULL |
| `environment` | `text` | nullable |
| `occurred_url` | `text` | nullable |
| `reproduction_steps` | `text` | nullable |
| `expected_result` | `text` | nullable |
| `actual_result` | `text` | nullable |
| `asana_status` | `text` | NOT NULL |
| `source_modified_at` | `timestamptz` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() |

### `analysis_runs`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | `uuid` | PK |
| `issue_id` | `uuid` | FK → `issues.id` ON DELETE CASCADE, 인덱스 |
| `source_modified_at` | `timestamptz` | NOT NULL. 문서 18장 `UNIQUE(issue_id, source_modified_at)`용 스냅샷 (12.2 TS 타입 외 추가) |
| `status` | `analysis_run_status` | NOT NULL DEFAULT `QUEUED` |
| `result_type` | `analysis_result_type` | nullable |
| `target_repository` | `text` | NOT NULL |
| `target_ref` | `text` | NOT NULL |
| `target_commit_sha` | `text` | nullable |
| `summary` | `text` | nullable |
| `suspected_area` | `text` | nullable |
| `evidence` | `jsonb` | NOT NULL DEFAULT `[]` |
| `external_checks` | `jsonb` | NOT NULL DEFAULT `[]` |
| `missing_information` | `jsonb` | NOT NULL DEFAULT `[]` |
| `limitations` | `jsonb` | NOT NULL DEFAULT `[]` |
| `workflow_run_url` | `text` | nullable |
| `failure_reason` | `text` | nullable |
| `started_at` | `timestamptz` | nullable |
| `finished_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() |

제약: `UNIQUE (issue_id, source_modified_at)`

### `analysis_feedback`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `id` | `uuid` | PK |
| `analysis_run_id` | `uuid` | FK → `analysis_runs.id` ON DELETE CASCADE, 인덱스 |
| `result` | `analysis_feedback_result` | NOT NULL |
| `comment` | `text` | nullable |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() |

### RLS

* 4개 테이블 모두 RLS enabled
* anon/authenticated용 policy 없음 → Data API로는 행 비공개
* `service_role`은 RLS bypass (web-api 서버 사이드 접근)
* advisor `rls_enabled_no_policy` INFO는 의도된 상태. 인증 도입 시 policy 추가 예정 (`05_rls.sql` TODO 주석)

### 검증

* 원격에 4테이블 생성 확인 (`list_tables`)
* 각 테이블 더미 1행 insert/join 조회 성공
* `UNIQUE(issue_id, source_modified_at)` 중복 insert → `unique_violation` 확인
