-- Minimal schema for @settler/reconciliation-core merged-list + resolve integration tests.
-- Matches Prisma column expectations for recon_jobs, recon_results, reconciliation_runs,
-- tenants, users (see prisma/schema.prisma).
-- Safe to re-apply: drops and recreates the listed tables (CI uses a fresh database).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS public.recon_results CASCADE;
DROP TABLE IF EXISTS public.reconciliation_runs CASCADE;
DROP TABLE IF EXISTS public.recon_jobs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id uuid,
  slug text NOT NULL UNIQUE,
  primary_domain text,
  custom_domain text,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  email varchar NOT NULL,
  password_hash varchar NOT NULL,
  name varchar,
  role varchar DEFAULT 'developer',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant_id ON public.users (tenant_id);

CREATE TABLE public.recon_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name varchar NOT NULL,
  description text,
  template_id uuid,
  source_adapter varchar NOT NULL,
  source_config_encrypted text NOT NULL,
  target_adapter varchar NOT NULL,
  target_config_encrypted text NOT NULL,
  mapping_template_id uuid,
  transform_recipe_id uuid,
  validation_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  recon_strategy varchar NOT NULL DEFAULT 'deterministic',
  schedule_cron varchar,
  schedule_timezone varchar NOT NULL DEFAULT 'UTC',
  status varchar NOT NULL DEFAULT 'active',
  version int NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_recon_jobs_tenant_id ON public.recon_jobs (tenant_id);
CREATE INDEX idx_recon_jobs_created_at_desc ON public.recon_jobs (created_at DESC);

CREATE TABLE public.recon_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recon_job_id uuid NOT NULL REFERENCES public.recon_jobs (id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  execution_id uuid,
  snapshot_id uuid,
  input_hash text,
  status varchar NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  source_count int NOT NULL DEFAULT 0,
  target_count int NOT NULL DEFAULT 0,
  matched_count int NOT NULL DEFAULT 0,
  unmatched_source_count int NOT NULL DEFAULT 0,
  unmatched_target_count int NOT NULL DEFAULT 0,
  conflict_count int NOT NULL DEFAULT 0,
  total_amount_source numeric(15, 2),
  total_amount_target numeric(15, 2),
  total_amount_matched numeric(15, 2),
  total_amount_unmatched numeric(15, 2),
  currency text,
  confidence_avg numeric(5, 4),
  confidence_min numeric(5, 4),
  confidence_max numeric(5, 4),
  duration_ms bigint,
  error_message text,
  error_stack text,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  proof_capsule jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recon_results_recon_job_id ON public.recon_results (recon_job_id);
CREATE INDEX idx_recon_results_tenant_id ON public.recon_results (tenant_id);

CREATE TABLE public.reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id uuid,
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name varchar(255),
  status varchar(50) NOT NULL DEFAULT 'pending',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  source_count int NOT NULL DEFAULT 0,
  target_count int NOT NULL DEFAULT 0,
  matched_count int NOT NULL DEFAULT 0,
  unmatched_source_count int NOT NULL DEFAULT 0,
  unmatched_target_count int NOT NULL DEFAULT 0,
  confidence_avg numeric(5, 4),
  error_message text,
  trace_id varchar(255),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reconciliation_runs_tenant_id ON public.reconciliation_runs (tenant_id);
CREATE INDEX idx_reconciliation_runs_tenant_greatest_started_created
  ON public.reconciliation_runs (
    tenant_id,
    (GREATEST(started_at, created_at)) DESC NULLS LAST,
    id DESC
  );
