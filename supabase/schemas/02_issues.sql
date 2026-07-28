-- Issue (docs/tria-production.md §12.1)
--
-- 소스 무관 접수 API(문서 5.1절) 기준. 특정 이슈 트래커의 필드를
-- 직접 담지 않고, source/external_ref/external_url로 일반화한다.

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'api',
  external_ref text,
  external_url text,
  title text not null,
  description text not null default '',
  project_key text not null,
  environment text,
  occurred_url text,
  reproduction_steps text,
  expected_result text,
  actual_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- external_ref는 호출자가 재접수 시 upsert 키로 쓰는 선택 필드라
-- null은 여러 개 허용해야 한다 (수동/API 입력은 값이 없을 수 있음).
create unique index issues_external_ref_key on public.issues (external_ref)
  where external_ref is not null;
