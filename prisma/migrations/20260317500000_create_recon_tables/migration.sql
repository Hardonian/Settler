-- Create recon_templates table (referenced by later migrations but never created)
CREATE TABLE IF NOT EXISTS recon_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  source_adapter_type TEXT,
  target_adapter_type TEXT,
  recon_strategy TEXT NOT NULL DEFAULT 'deterministic',
  matching_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  transform_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recon_templates_tenant ON recon_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_templates_category ON recon_templates(category);
CREATE INDEX IF NOT EXISTS idx_recon_templates_public ON recon_templates(is_public);

-- Create recon_jobs table (referenced by deterministic_core FK but never created)
CREATE TABLE IF NOT EXISTS recon_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID,
  source_adapter TEXT NOT NULL,
  source_config_encrypted TEXT NOT NULL,
  target_adapter TEXT NOT NULL,
  target_config_encrypted TEXT NOT NULL,
  mapping_template_id UUID,
  transform_recipe_id UUID,
  validation_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  recon_strategy TEXT NOT NULL DEFAULT 'deterministic',
  schedule_cron TEXT,
  schedule_timezone TEXT NOT NULL DEFAULT 'UTC',
  next_execution_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_tenant ON recon_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_template ON recon_jobs(template_id);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_status ON recon_jobs(status);

-- Create recon_results table (referenced by deterministic_core but never created)
CREATE TABLE IF NOT EXISTS recon_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recon_job_id UUID,
  tenant_id UUID NOT NULL,
  ingestion_id UUID,
  execution_id UUID,
  snapshot_id UUID,
  input_hash TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  source_count INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  unmatched_source_count INTEGER NOT NULL DEFAULT 0,
  unmatched_target_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  total_amount_source DECIMAL(15, 2),
  total_amount_target DECIMAL(15, 2),
  total_amount_matched DECIMAL(15, 2),
  total_amount_unmatched DECIMAL(15, 2),
  currency TEXT,
  confidence_avg DECIMAL(5, 4),
  confidence_min DECIMAL(5, 4),
  confidence_max DECIMAL(5, 4),
  duration_ms BIGINT,
  error_message TEXT,
  error_stack TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  proof_capsule JSONB,
  proofpack_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_recon_results_tenant ON recon_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_results_job ON recon_results(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_recon_results_status ON recon_results(status);
CREATE INDEX IF NOT EXISTS idx_recon_results_snapshot_id ON recon_results(snapshot_id);

-- Create users table (referenced by many FKs)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create tenants table (referenced by FKs)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  primary_domain TEXT,
  custom_domain TEXT,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create billing_accounts table
CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID,
  stripe_customer_id TEXT UNIQUE,
  stripe_account_id TEXT,
  email TEXT NOT NULL,
  name TEXT,
  address JSONB,
  tax_id TEXT,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create reconciliation_runs table
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id UUID,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  source_count INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  unmatched_source_count INTEGER NOT NULL DEFAULT 0,
  unmatched_target_count INTEGER NOT NULL DEFAULT 0,
  confidence_avg DECIMAL(5, 4),
  error_message TEXT,
  trace_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reconciliation_matches table
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  source_transaction_id UUID NOT NULL,
  target_transaction_id UUID,
  tenant_id UUID NOT NULL,
  match_type TEXT NOT NULL,
  confidence DECIMAL(5, 4) NOT NULL,
  match_reason TEXT,
  amount_diff DECIMAL(15, 2),
  date_diff INTEGER,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  resolution_reason VARCHAR(100),
  notes TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create run_deltas table
CREATE TABLE IF NOT EXISTS run_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  current_run_id UUID NOT NULL,
  previous_run_id UUID,
  job_id UUID NOT NULL,
  delta_generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  input_changed BOOLEAN NOT NULL DEFAULT false,
  input_delta JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_data_changed BOOLEAN NOT NULL DEFAULT false,
  target_data_changed BOOLEAN NOT NULL DEFAULT false,
  total_delta INTEGER NOT NULL DEFAULT 0,
  matched_delta INTEGER NOT NULL DEFAULT 0,
  unmatched_delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant ON reconciliation_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_status ON reconciliation_runs(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_run ON reconciliation_matches(run_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_tenant ON reconciliation_matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_user ON billing_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_tenant ON billing_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_run_deltas_tenant ON run_deltas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_run_deltas_current_run ON run_deltas(current_run_id);
