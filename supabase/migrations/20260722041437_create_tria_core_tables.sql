-- Generated from supabase/schemas/* (declarative source of truth).
-- Bootstrapped without local Docker shadow DB; future changes: edit schemas/ then `supabase db diff -f <name>`.

-- >>> supabase/schemas/00_types.sql
-- Shared enums for Tria operational data model (docs/tria-production.md §12)

create type public.analysis_run_status as enum (
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED'
);

create type public.analysis_result_type as enum (
  'CODE_LIKELY',
  'CHECK_EXTERNAL',
  'NEED_MORE_INFO'
);

create type public.analysis_feedback_result as enum (
  'CORRECT',
  'PARTIALLY_HELPFUL',
  'NOT_HELPFUL',
  'WRONG'
);

-- >>> supabase/schemas/01_project_configs.sql
-- ProjectConfig (docs/tria-production.md §12.3)

create table public.project_configs (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  asana_project_value text not null,
  github_owner text not null,
  github_repository text not null,
  default_ref text not null,
  is_active boolean not null default true,
  constraint project_configs_key_key unique (key)
);

-- >>> supabase/schemas/02_issues.sql
-- Issue (docs/tria-production.md §12.1)

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  asana_task_gid text not null,
  asana_url text not null,
  title text not null,
  description text not null default '',
  project_key text not null,
  environment text,
  occurred_url text,
  reproduction_steps text,
  expected_result text,
  actual_result text,
  asana_status text not null,
  source_modified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint issues_asana_task_gid_key unique (asana_task_gid)
);

create index issues_asana_task_gid_idx on public.issues (asana_task_gid);

-- >>> supabase/schemas/03_analysis_runs.sql
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

-- >>> supabase/schemas/04_analysis_feedback.sql
-- AnalysisFeedback (docs/tria-production.md §12.4)

create table public.analysis_feedback (
  id uuid primary key default gen_random_uuid(),
  analysis_run_id uuid not null references public.analysis_runs (id) on delete cascade,
  result public.analysis_feedback_result not null,
  comment text,
  created_at timestamptz not null default now()
);

create index analysis_feedback_analysis_run_id_idx on public.analysis_feedback (analysis_run_id);

-- >>> supabase/schemas/05_rls.sql
-- RLS: 인증 시스템 도입 전 최소 정책
--
-- web-api는 service_role로 서버 사이드 접근한다.
-- Supabase에서 service_role은 RLS를 bypass 하므로, RLS만 켜 두고
-- anon/authenticated용 policy는 만들지 않으면 Data API로는 행이 보이지 않는다.
--
-- TODO(auth): 회사 Google/SSO 인증이 붙으면 authenticated 역할 기준
-- 내부 사용자 정책으로 교체할 것 (docs/tria-production.md §17).

alter table public.project_configs enable row level security;
alter table public.issues enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.analysis_feedback enable row level security;

