-- Recovered from the live database's supabase_migrations.schema_migrations
-- (version 20260427002400, name "20260424_queue_system") on 2026-10-02. This migration was applied
-- via the Supabase migrations UI and existed only in database bookkeeping;
-- recorded here so the repository holds the full schema history.

-- Queue system: job_queue + job_runs for background job processing.
-- Service-role only; no creator/client access.

create table if not exists public.job_queue (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'retrying')),
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  run_at timestamptz not null default now(),
  locked_at timestamptz null,
  locked_by text null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.job_queue(id) on delete cascade,
  type text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  error text null,
  metadata jsonb not null default '{}'::jsonb
);

-- Indexes
create index if not exists job_queue_status_run_at_idx
  on public.job_queue (status, run_at asc) where status = 'pending';
create index if not exists job_queue_locked_at_idx
  on public.job_queue (locked_at asc) where locked_at is not null;
create index if not exists job_queue_type_status_idx
  on public.job_queue (type, status);
create index if not exists job_queue_created_at_idx
  on public.job_queue (created_at desc);
create index if not exists job_runs_job_id_idx
  on public.job_runs (job_id);
create index if not exists job_runs_type_status_idx
  on public.job_runs (type, status);
create index if not exists job_runs_started_at_idx
  on public.job_runs (started_at desc);

-- RLS: service-role only, no creator/client access
alter table public.job_queue enable row level security;
alter table public.job_runs enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['job_queue', 'job_runs']
  loop
    execute format(
      'create policy %I_service_role_all on public.%I for all to service_role using (true) with check (true)',
      tbl, tbl
    );
  end loop;
end $$;

-- Trigger for updated_at on job_queue
create or replace function public.set_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_job_queue_updated_at on public.job_queue;
create trigger set_job_queue_updated_at
  before update on public.job_queue
  for each row
  execute function public.set_updated_at_column();
