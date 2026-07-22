# DB Schema 워크트리 가이드

역할: 운영형 Tria가 저장할 데이터 모델(이슈, 분석 실행, 프로젝트 설정, 피드백)을 Supabase에 실제 테이블로 만든다.

참고 문서: [../tria-production.md](../tria-production.md) 12장(데이터 모델), 7.6(데이터베이스), 17장(보안 - 웹 인증), [../supabase.md](../supabase.md)

## 시작하기 전에 반드시 확인할 것

`../supabase.md`에 이미 적혀 있듯 **마이그레이션 방식(declarative schemas `supabase/schemas/` vs imperative `supabase/migrations/`)이 아직 정해지지 않았다.** 임의로 정하지 말고, Supabase 스킬/MCP 도구로 프로젝트의 현재 상태(기존 테이블 유무, 기존 컨벤션)를 먼저 확인한 뒤에도 방식이 불명확하면 사용자에게 물어봐라. `supabase/` 디렉토리도 CLI도 아직 없다 — MCP 도구(`execute_sql`, `get_advisors`, `search_docs` 등)로 작업한다.

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
