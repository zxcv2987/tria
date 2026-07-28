-- ProjectConfig (docs/tria-production.md §12.3)
--
-- 외부 이슈 트래커의 프로젝트 식별자(예: Asana 프로젝트 GID)는 여기서
-- 관리하지 않는다 — 그 매핑은 각 소스의 어댑터가 자기 쪽에서 들고 있는다
-- (문서 5.4절).

create table public.project_configs (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  name text not null,
  github_owner text not null,
  github_repository text not null,
  default_ref text not null,
  is_active boolean not null default true,
  constraint project_configs_key_key unique (key)
);
