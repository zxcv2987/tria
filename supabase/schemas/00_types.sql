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
