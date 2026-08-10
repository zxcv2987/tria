-- AnalysisRun (docs/tria-production.md §12.2)
--
-- 중복 실행 방지는 "이슈 수정 버전 비교"가 아니라 in-flight(QUEUED/RUNNING)
-- 체크만으로 한다 (문서 5.2, 18장) — 접수 API 호출 자체가 명시적 분석
-- 요청이라 호출 시점 관리는 호출자 책임이다.

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  status public.analysis_run_status not null default 'QUEUED',
  result_type public.analysis_result_type,
  target_repository text not null,
  target_ref text not null,
  target_commit_sha text,
  summary text,
  suspected_area text,
  evidence jsonb not null default '[]'::jsonb,
  external_checks jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  workflow_run_url text,
  failure_reason text,
  notify_url text,
  -- TokenUsage JSON: { inputTokens, outputTokens, totalTokens, cachedTokens?, model? }
  token_usage jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index analysis_runs_issue_id_idx on public.analysis_runs (issue_id);
