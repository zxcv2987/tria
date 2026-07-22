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
