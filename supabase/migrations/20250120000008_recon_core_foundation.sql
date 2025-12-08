-- Migration: recon_core_foundation
-- Created: 2025-01-20 00:00:08 UTC
-- Description: Foundational Recon Core Engine tables with strict multi-tenant RLS
-- Part of: Phase I - Platform Audit + Recon Core Foundation

BEGIN;

-- ============================================================================
-- RECON JOBS TABLE
-- Core reconciliation job definitions with templates and scheduling
-- ============================================================================

CREATE TABLE IF NOT EXISTS recon_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id UUID,
  source_adapter VARCHAR(100) NOT NULL,
  source_config_encrypted TEXT NOT NULL,
  target_adapter VARCHAR(100) NOT NULL,
  target_config_encrypted TEXT NOT NULL,
  mapping_template_id UUID,
  transform_recipe_id UUID,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  recon_strategy VARCHAR(50) NOT NULL DEFAULT 'deterministic',
  schedule_cron VARCHAR(100),
  schedule_timezone VARCHAR(50) DEFAULT 'UTC',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_tenant_id ON recon_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_user_id ON recon_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_status ON recon_jobs(status);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_template_id ON recon_jobs(template_id);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_active ON recon_jobs(tenant_id) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recon_jobs_schedule ON recon_jobs(tenant_id, schedule_cron) WHERE schedule_cron IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_recon_jobs_metadata_gin ON recon_jobs USING GIN (metadata);

-- ============================================================================
-- RECON RESULTS TABLE
-- Detailed reconciliation results with match/unmatch tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS recon_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recon_job_id UUID NOT NULL REFERENCES recon_jobs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES executions(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  source_count INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_source_count INTEGER DEFAULT 0,
  unmatched_target_count INTEGER DEFAULT 0,
  conflict_count INTEGER DEFAULT 0,
  total_amount_source DECIMAL(15, 2),
  total_amount_target DECIMAL(15, 2),
  total_amount_matched DECIMAL(15, 2),
  total_amount_unmatched DECIMAL(15, 2),
  currency VARCHAR(10),
  confidence_avg DECIMAL(5, 4),
  confidence_min DECIMAL(5, 4),
  confidence_max DECIMAL(5, 4),
  duration_ms BIGINT,
  error_message TEXT,
  error_stack TEXT,
  summary JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recon_results_recon_job_id ON recon_results(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_recon_results_tenant_id ON recon_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_results_status ON recon_results(status);
CREATE INDEX IF NOT EXISTS idx_recon_results_started_at ON recon_results(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_recon_results_tenant_job_started ON recon_results(tenant_id, recon_job_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_recon_results_summary_gin ON recon_results USING GIN (summary);
CREATE INDEX IF NOT EXISTS idx_recon_results_metadata_gin ON recon_results USING GIN (metadata);

-- ============================================================================
-- RECON TEMPLATES TABLE
-- Reusable reconciliation templates for common patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS recon_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  source_adapter_type VARCHAR(100),
  target_adapter_type VARCHAR(100),
  recon_strategy VARCHAR(50) NOT NULL DEFAULT 'deterministic',
  matching_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  transform_rules JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recon_templates_tenant_id ON recon_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_templates_category ON recon_templates(category);
CREATE INDEX IF NOT EXISTS idx_recon_templates_public ON recon_templates(is_public, category) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recon_templates_adapter_types ON recon_templates(source_adapter_type, target_adapter_type);
CREATE INDEX IF NOT EXISTS idx_recon_templates_metadata_gin ON recon_templates USING GIN (metadata);

-- ============================================================================
-- RECON AUDITS TABLE
-- Comprehensive audit trail for reconciliation operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS recon_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recon_job_id UUID REFERENCES recon_jobs(id) ON DELETE CASCADE,
  recon_result_id UUID REFERENCES recon_results(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  audit_type VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  before_state JSONB,
  after_state JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recon_audits_tenant_id ON recon_audits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_audits_recon_job_id ON recon_audits(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_recon_audits_recon_result_id ON recon_audits(recon_result_id);
CREATE INDEX IF NOT EXISTS idx_recon_audits_audit_type ON recon_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_recon_audits_created_at ON recon_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recon_audits_tenant_created ON recon_audits(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recon_audits_metadata_gin ON recon_audits USING GIN (metadata);

-- ============================================================================
-- MAPPING TEMPLATES TABLE
-- Field mapping templates for data transformation
-- ============================================================================

CREATE TABLE IF NOT EXISTS mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_schema JSONB NOT NULL,
  target_schema JSONB NOT NULL,
  field_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  transformation_rules JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mapping_templates_tenant_id ON mapping_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mapping_templates_public ON mapping_templates(is_public) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mapping_templates_source_schema_gin ON mapping_templates USING GIN (source_schema);
CREATE INDEX IF NOT EXISTS idx_mapping_templates_target_schema_gin ON mapping_templates USING GIN (target_schema);
CREATE INDEX IF NOT EXISTS idx_mapping_templates_field_mappings_gin ON mapping_templates USING GIN (field_mappings);

-- ============================================================================
-- VALIDATION RULES TABLE
-- Reusable validation rule definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL,
  rule_config JSONB NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'error',
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_validation_rules_tenant_id ON validation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_rule_type ON validation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_validation_rules_active ON validation_rules(tenant_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_validation_rules_public ON validation_rules(is_public) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_validation_rules_rule_config_gin ON validation_rules USING GIN (rule_config);

-- ============================================================================
-- TRANSFORM RECIPES TABLE
-- Transformation recipe definitions for data processing
-- ============================================================================

CREATE TABLE IF NOT EXISTS transform_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  recipe_type VARCHAR(50) NOT NULL,
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  transformation_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transform_recipes_tenant_id ON transform_recipes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transform_recipes_recipe_type ON transform_recipes(recipe_type);
CREATE INDEX IF NOT EXISTS idx_transform_recipes_public ON transform_recipes(is_public) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transform_recipes_input_schema_gin ON transform_recipes USING GIN (input_schema);
CREATE INDEX IF NOT EXISTS idx_transform_recipes_output_schema_gin ON transform_recipes USING GIN (output_schema);
CREATE INDEX IF NOT EXISTS idx_transform_recipes_transformation_steps_gin ON transform_recipes USING GIN (transformation_steps);

-- ============================================================================
-- CONTRACT VERSIONS TABLE
-- Data contract versioning for schema evolution
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  schema_definition JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_deprecated BOOLEAN DEFAULT false,
  deprecated_at TIMESTAMPTZ,
  breaking_changes JSONB DEFAULT '[]'::jsonb,
  migration_guide TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, contract_name, version)
);

CREATE INDEX IF NOT EXISTS idx_contract_versions_tenant_id ON contract_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_contract_name ON contract_versions(contract_name);
CREATE INDEX IF NOT EXISTS idx_contract_versions_active ON contract_versions(tenant_id, contract_name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_contract_versions_schema_gin ON contract_versions USING GIN (schema_definition);

-- ============================================================================
-- DRIFT EVENTS TABLE
-- Schema and field drift detection events
-- ============================================================================

CREATE TABLE IF NOT EXISTS drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recon_job_id UUID REFERENCES recon_jobs(id) ON DELETE CASCADE,
  contract_version_id UUID REFERENCES contract_versions(id) ON DELETE SET NULL,
  drift_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'warning',
  field_path VARCHAR(500),
  expected_value JSONB,
  actual_value JSONB,
  drift_metrics JSONB DEFAULT '{}'::jsonb,
  auto_repaired BOOLEAN DEFAULT false,
  repair_action JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drift_events_tenant_id ON drift_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drift_events_recon_job_id ON drift_events(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_drift_events_drift_type ON drift_events(drift_type);
CREATE INDEX IF NOT EXISTS idx_drift_events_severity ON drift_events(severity);
CREATE INDEX IF NOT EXISTS idx_drift_events_created_at ON drift_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drift_events_unacknowledged ON drift_events(tenant_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_drift_events_metadata_gin ON drift_events USING GIN (metadata);

-- ============================================================================
-- WORKFLOW RUNS TABLE
-- Workflow execution tracking for orchestrated pipelines
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id VARCHAR(255) NOT NULL,
  workflow_name VARCHAR(255),
  workflow_version VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by VARCHAR(50),
  trigger_event JSONB,
  execution_graph JSONB,
  step_results JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  error_stack TEXT,
  duration_ms BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_tenant_id ON workflow_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON workflow_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_tenant_workflow_started ON workflow_runs(tenant_id, workflow_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_metadata_gin ON workflow_runs USING GIN (metadata);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- Add foreign keys after all tables are created
-- ============================================================================

ALTER TABLE recon_jobs
  ADD CONSTRAINT fk_recon_jobs_template_id
    FOREIGN KEY (template_id) REFERENCES recon_templates(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_recon_jobs_mapping_template_id
    FOREIGN KEY (mapping_template_id) REFERENCES mapping_templates(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_recon_jobs_transform_recipe_id
    FOREIGN KEY (transform_recipe_id) REFERENCES transform_recipes(id) ON DELETE SET NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation for all Recon Core tables
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE recon_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recon_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE recon_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recon_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transform_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recon_jobs
CREATE POLICY recon_jobs_tenant_isolation ON recon_jobs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY recon_jobs_public_templates ON recon_templates
  FOR SELECT
  USING (
    is_public = true AND deleted_at IS NULL
    OR tenant_id = current_setting('app.current_tenant_id', true)::UUID
  );

-- RLS Policies for recon_results
CREATE POLICY recon_results_tenant_isolation ON recon_results
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- RLS Policies for recon_templates
CREATE POLICY recon_templates_tenant_isolation ON recon_templates
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR is_public = true AND deleted_at IS NULL
  );

-- RLS Policies for recon_audits
CREATE POLICY recon_audits_tenant_isolation ON recon_audits
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- RLS Policies for mapping_templates
CREATE POLICY mapping_templates_tenant_isolation ON mapping_templates
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR is_public = true AND deleted_at IS NULL
  );

-- RLS Policies for validation_rules
CREATE POLICY validation_rules_tenant_isolation ON validation_rules
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR is_public = true AND deleted_at IS NULL
  );

-- RLS Policies for transform_recipes
CREATE POLICY transform_recipes_tenant_isolation ON transform_recipes
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
    OR is_public = true AND deleted_at IS NULL
  );

-- RLS Policies for contract_versions
CREATE POLICY contract_versions_tenant_isolation ON contract_versions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- RLS Policies for drift_events
CREATE POLICY drift_events_tenant_isolation ON drift_events
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- RLS Policies for workflow_runs
CREATE POLICY workflow_runs_tenant_isolation ON workflow_runs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recon_jobs_updated_at
  BEFORE UPDATE ON recon_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recon_results_updated_at
  BEFORE UPDATE ON recon_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recon_templates_updated_at
  BEFORE UPDATE ON recon_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mapping_templates_updated_at
  BEFORE UPDATE ON mapping_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validation_rules_updated_at
  BEFORE UPDATE ON validation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transform_recipes_updated_at
  BEFORE UPDATE ON transform_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_versions_updated_at
  BEFORE UPDATE ON contract_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_runs_updated_at
  BEFORE UPDATE ON workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
