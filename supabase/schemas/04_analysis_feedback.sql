-- AnalysisFeedback (docs/tria-production.md §12.4)

create table public.analysis_feedback (
  id uuid primary key default gen_random_uuid(),
  analysis_run_id uuid not null references public.analysis_runs (id) on delete cascade,
  result public.analysis_feedback_result not null,
  comment text,
  created_at timestamptz not null default now()
);

create index analysis_feedback_analysis_run_id_idx on public.analysis_feedback (analysis_run_id);
