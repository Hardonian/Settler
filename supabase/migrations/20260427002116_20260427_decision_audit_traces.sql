-- Recovered from the live database's supabase_migrations.schema_migrations
-- (version 20260427002116, name "20260427_decision_audit_traces") on 2026-10-02. This migration was applied
-- via the Supabase migrations UI and existed only in database bookkeeping;
-- recorded here so the repository holds the full schema history.

-- Decision audit and replay substrate.
-- Creation is append-only: only outcome fields can be attached after prediction.

create extension if not exists pgcrypto;

create table if not exists public.decision_traces (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  session_id text not null,
  decision_type text not null check (decision_type in ('layout', 'CTA', 'offer', 'routing', 'budget')),
  input_snapshot jsonb not null,
  output_decision jsonb not null,
  reasoning_summary text not null,
  confidence_score double precision not null check (confidence_score >= 0 and confidence_score <= 1),
  expected_value double precision not null default 0,
  actual_outcome jsonb,
  delta double precision,
  created_at timestamptz not null default now(),
  evaluated_at timestamptz
);

create index if not exists decision_traces_org_session_idx
  on public.decision_traces (org_id, session_id, created_at desc);

create index if not exists decision_traces_org_type_idx
  on public.decision_traces (org_id, decision_type, created_at desc);

create index if not exists decision_traces_session_idx
  on public.decision_traces (session_id, created_at desc);

alter table public.decision_traces enable row level security;

drop policy if exists decision_traces_owner_read on public.decision_traces;
create policy decision_traces_owner_read
  on public.decision_traces for select to authenticated
  using (org_id = auth.jwt()->>'sub');

drop policy if exists decision_traces_service_role_all on public.decision_traces;
create policy decision_traces_service_role_all
  on public.decision_traces for all to service_role
  using (true)
  with check (true);

create or replace function public.enforce_decision_trace_outcome_only_update()
returns trigger
language plpgsql
as $$
begin
  if old.id <> new.id
    or old.org_id <> new.org_id
    or old.session_id <> new.session_id
    or old.decision_type <> new.decision_type
    or old.input_snapshot <> new.input_snapshot
    or old.output_decision <> new.output_decision
    or old.reasoning_summary <> new.reasoning_summary
    or old.confidence_score <> new.confidence_score
    or old.expected_value <> new.expected_value
    or old.created_at <> new.created_at
  then
    raise exception 'decision_traces are immutable after creation except outcome fields';
  end if;

  if old.actual_outcome is not null
    and old.actual_outcome <> new.actual_outcome
  then
    raise exception 'decision trace outcomes are append-only once evaluated';
  end if;

  if old.delta is not null
    and old.delta <> new.delta
  then
    raise exception 'decision trace deltas are append-only once evaluated';
  end if;

  if old.evaluated_at is not null
    and old.evaluated_at <> new.evaluated_at
  then
    raise exception 'decision trace evaluation time is append-only once set';
  end if;

  return new;
end;
$$;

drop trigger if exists decision_trace_outcome_only_update on public.decision_traces;
create trigger decision_trace_outcome_only_update
before update on public.decision_traces
for each row execute function public.enforce_decision_trace_outcome_only_update();
