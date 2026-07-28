-- 이슈 소스 일반화 (docs/tria-production.md 5장, 12장)
--
-- 주의: 기존 issues/project_configs에 실 데이터가 있다면
-- asana_task_gid/asana_url/asana_status/asana_project_value 값은
-- 이 마이그레이션으로 유실된다. 적용 전 필요하면 백업할 것.

alter table public.project_configs
  drop column asana_project_value;

alter table public.issues
  drop constraint if exists issues_asana_task_gid_key;
drop index if exists public.issues_asana_task_gid_idx;

alter table public.issues
  drop column asana_task_gid,
  drop column asana_url,
  drop column asana_status,
  drop column source_modified_at,
  add column source text not null default 'api',
  add column external_ref text,
  add column external_url text;

create unique index issues_external_ref_key on public.issues (external_ref)
  where external_ref is not null;

alter table public.analysis_runs
  drop constraint if exists analysis_runs_issue_source_modified_key,
  drop column source_modified_at,
  add column notify_url text;
