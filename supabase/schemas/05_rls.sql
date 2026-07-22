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
