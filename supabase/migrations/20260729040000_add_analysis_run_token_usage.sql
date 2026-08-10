-- 분석 실행별 토큰 사용량 저장 (문서 20장 비용 지표)
alter table public.analysis_runs
  add column if not exists token_usage jsonb;
