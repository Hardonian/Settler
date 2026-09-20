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
