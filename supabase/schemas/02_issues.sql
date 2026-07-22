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
