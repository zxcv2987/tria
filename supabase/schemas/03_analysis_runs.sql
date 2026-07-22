-- AnalysisRun (docs/tria-production.md §12.2)
--
-- 문서 18장 권장 UNIQUE(issue_id, source_modified_at)을 위해
-- 분석 시점의 issue.source_modified_at 스냅샷 컬럼을 둔다.
-- (12.2 TS 타입에는 없지만, 중복 실행 방지 제약을 DB에서 강제하기 위함)

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  source_modified_at timestamptz not null,
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
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint analysis_runs_issue_source_modified_key unique (issue_id, source_modified_at)
);

create index analysis_runs_issue_id_idx on public.analysis_runs (issue_id);
