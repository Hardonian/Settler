-- ============================================================================
-- CONSOLIDATED MIGRATION: Missing Tables from Prisma Schema
-- Created: 2026-02-02 00:00:00 UTC
-- Description: Ensures all tables defined in Prisma schema exist in database
-- This migration uses CREATE TABLE IF NOT EXISTS for idempotency
-- ============================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- BILLING INFRASTRUCTURE TABLES
-- ============================================================================

-- Billing Accounts (already exists in 20250120000000_billing_schema.sql, but ensuring completeness)
CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_account_id VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  address JSONB,
  tax_id VARCHAR(255),
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_user_id ON billing_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_tenant_id ON billing_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe_customer_id ON billing_accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_accounts_status ON billing_accounts(status);

-- Subscriptions (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  plan_id VARCHAR(100) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_account_id ON subscriptions(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Stripe Events (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'received',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT,
  user_id UUID,
  tenant_id UUID,
  billing_account_id UUID,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_status ON stripe_events(status);
CREATE INDEX IF NOT EXISTS idx_stripe_events_received_at ON stripe_events(received_at);
CREATE INDEX IF NOT EXISTS idx_stripe_events_user_id ON stripe_events(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant_id ON stripe_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_billing_account_id ON stripe_events(billing_account_id);

-- Add Ons (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  base_price_monthly DECIMAL(10, 2) NOT NULL,
  usage_price_per_unit DECIMAL(10, 6),
  usage_unit VARCHAR(50),
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_standard BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_ons_integration_id ON add_ons(integration_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_is_active ON add_ons(is_active);
CREATE INDEX IF NOT EXISTS idx_add_ons_is_standard ON add_ons(is_standard);

-- Add On Purchases (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS add_on_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL REFERENCES add_ons(id) ON DELETE RESTRICT,
  stripe_subscription_item_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_on_purchases_billing_account_id ON add_on_purchases(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_add_on_purchases_add_on_id ON add_on_purchases(add_on_id);
CREATE INDEX IF NOT EXISTS idx_add_on_purchases_status ON add_on_purchases(status);

-- Usage Events (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  project_id UUID,
  user_id UUID,
  tenant_id UUID,
  event_type VARCHAR(100) NOT NULL,
  integration_id VARCHAR(100),
  add_on_id UUID REFERENCES add_ons(id) ON DELETE SET NULL,
  quantity DECIMAL(15, 6) NOT NULL,
  unit VARCHAR(50),
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  aggregated BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account_id ON usage_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_project_id ON usage_events(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_id ON usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_integration_id ON usage_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_events_aggregated ON usage_events(aggregated);
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account_event_timestamp ON usage_events(billing_account_id, event_type, timestamp);

-- Usage Aggregate Daily (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS usage_aggregate_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  project_id UUID,
  tenant_id UUID,
  date DATE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  integration_id VARCHAR(100),
  add_on_id UUID REFERENCES add_ons(id) ON DELETE SET NULL,
  total_quantity DECIMAL(15, 6) NOT NULL,
  event_count INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(billing_account_id, project_id, date, event_type, integration_id, add_on_id)
);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_billing_account_id ON usage_aggregate_daily(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_project_id ON usage_aggregate_daily(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_tenant_id ON usage_aggregate_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_date ON usage_aggregate_daily(date);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_event_type ON usage_aggregate_daily(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_integration_id ON usage_aggregate_daily(integration_id);

-- Usage Counters (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  service VARCHAR(100) NOT NULL,
  period VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  count INTEGER DEFAULT 0,
  limit_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(billing_account_id, service, period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_billing_account_service_period ON usage_counters(billing_account_id, service, period);
CREATE INDEX IF NOT EXISTS idx_usage_counters_period_start ON usage_counters(period_start);

-- ============================================================================
-- RECON CORE ENGINE TABLES
-- ============================================================================

-- Recon Jobs (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS recon_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id UUID REFERENCES recon_templates(id) ON DELETE SET NULL,
  source_adapter VARCHAR(100) NOT NULL,
  source_config_encrypted TEXT NOT NULL,
  target_adapter VARCHAR(100) NOT NULL,
  target_config_encrypted TEXT NOT NULL,
  mapping_template_id UUID REFERENCES mapping_templates(id) ON DELETE SET NULL,
  transform_recipe_id UUID REFERENCES transform_recipes(id) ON DELETE SET NULL,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  recon_strategy VARCHAR(50) DEFAULT 'deterministic',
  schedule_cron VARCHAR(100),
  schedule_timezone VARCHAR(50) DEFAULT 'UTC',
  status VARCHAR(50) DEFAULT 'active',
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

-- Recon Results (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS recon_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recon_job_id UUID NOT NULL REFERENCES recon_jobs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  execution_id UUID,
  status VARCHAR(50) DEFAULT 'running',
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

-- Recon Templates (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS recon_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  source_adapter_type VARCHAR(100),
  target_adapter_type VARCHAR(100),
  recon_strategy VARCHAR(50) DEFAULT 'deterministic',
  matching_rules JSONB DEFAULT '[]'::jsonb,
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
CREATE INDEX IF NOT EXISTS idx_recon_templates_is_public ON recon_templates(is_public);

-- Recon Audits (already exists, ensuring completeness)
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

-- Mapping Templates (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_schema JSONB NOT NULL,
  target_schema JSONB NOT NULL,
  field_mappings JSONB DEFAULT '{}'::jsonb,
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
CREATE INDEX IF NOT EXISTS idx_mapping_templates_is_public ON mapping_templates(is_public);

-- Validation Rules (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(100) NOT NULL,
  rule_config JSONB NOT NULL,
  severity VARCHAR(50) DEFAULT 'error',
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
CREATE INDEX IF NOT EXISTS idx_validation_rules_is_active ON validation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_validation_rules_is_public ON validation_rules(is_public);

-- Transform Recipes (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS transform_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  recipe_type VARCHAR(100) NOT NULL,
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  transformation_steps JSONB DEFAULT '[]'::jsonb,
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
CREATE INDEX IF NOT EXISTS idx_transform_recipes_is_public ON transform_recipes(is_public);

-- Contract Versions (already exists, ensuring completeness)
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
CREATE INDEX IF NOT EXISTS idx_contract_versions_is_active ON contract_versions(is_active);

-- Drift Events (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recon_job_id UUID,
  contract_version_id UUID REFERENCES contract_versions(id) ON DELETE SET NULL,
  drift_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) DEFAULT 'warning',
  field_path VARCHAR(255),
  expected_value JSONB,
  actual_value JSONB,
  drift_metrics JSONB DEFAULT '{}'::jsonb,
  auto_repaired BOOLEAN DEFAULT false,
  repair_action JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drift_events_tenant_id ON drift_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drift_events_recon_job_id ON drift_events(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_drift_events_drift_type ON drift_events(drift_type);
CREATE INDEX IF NOT EXISTS idx_drift_events_severity ON drift_events(severity);
CREATE INDEX IF NOT EXISTS idx_drift_events_created_at ON drift_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drift_events_acknowledged ON drift_events(acknowledged);

-- Workflow Runs (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id VARCHAR(255) NOT NULL,
  workflow_name VARCHAR(255),
  workflow_version VARCHAR(50),
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by VARCHAR(255),
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

-- ============================================================================
-- RECEIPTS API TABLES
-- ============================================================================

-- Receipt Uploads (already exists in 20260126000000_console_complete_setup.sql, ensuring completeness)
CREATE TABLE IF NOT EXISTS receipt_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  storage_location TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_api_key_id ON receipt_uploads(api_key_id);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_billing_account_id ON receipt_uploads(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_status ON receipt_uploads(status);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_created_at ON receipt_uploads(created_at);

-- Receipts (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID UNIQUE NOT NULL REFERENCES receipt_uploads(id) ON DELETE CASCADE,
  vendor VARCHAR(255),
  date TIMESTAMPTZ,
  currency VARCHAR(10),
  subtotal DECIMAL(15, 2),
  tax DECIMAL(15, 2),
  total DECIMAL(15, 2),
  payment_method VARCHAR(100),
  confidence_score DECIMAL(5, 4),
  raw_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_upload_id ON receipts(upload_id);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(vendor);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);

-- Receipt Items (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 3),
  unit_price DECIMAL(15, 2),
  line_total DECIMAL(15, 2),
  category VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON receipt_items(category);

-- ============================================================================
-- FEATURE FLAGS API TABLES
-- ============================================================================

-- Feature Flags (already exists in 20260126000000_console_complete_setup.sql, ensuring completeness)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  project_id UUID,
  key VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'boolean',
  is_global BOOLEAN DEFAULT false,
  default_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(billing_account_id, project_id, key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_billing_account_id ON feature_flags(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_project_id ON feature_flags(project_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_global ON feature_flags(is_global);
CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted_at ON feature_flags(deleted_at);

-- Feature Flag Environments (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS feature_flag_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  environment VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  variant JSONB,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(flag_id, environment)
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_environments_flag_id ON feature_flag_environments(flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_environments_environment ON feature_flag_environments(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flag_environments_enabled ON feature_flag_environments(enabled);

-- Feature Flag Overrides (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  environment VARCHAR(100) NOT NULL,
  target_key VARCHAR(255) NOT NULL,
  target_type VARCHAR(50) DEFAULT 'user',
  value JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(flag_id, environment, target_key, target_type)
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_flag_id ON feature_flag_overrides(flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_environment ON feature_flag_overrides(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_target_key ON feature_flag_overrides(target_key);
CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_expires_at ON feature_flag_overrides(expires_at);

-- ============================================================================
-- MULTI-TENANT & WHITE-LABEL SITE BUILDER TABLES
-- ============================================================================

-- Tenants (already exists in 20251128193735_initial_schema.sql, ensuring completeness)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID UNIQUE REFERENCES billing_accounts(id) ON DELETE SET NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  primary_domain VARCHAR(255),
  custom_domain VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_primary_domain ON tenants(primary_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_billing_account_id ON tenants(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- Onboarding Progress (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_step VARCHAR(100) DEFAULT 'welcome',
  completed_steps TEXT[] DEFAULT '{}',
  skipped_steps TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_current_step ON onboarding_progress(current_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_progress ON onboarding_progress(progress);

-- Tenant Onboarding Progress (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS tenant_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_step VARCHAR(100) DEFAULT 'create_workspace',
  completed_steps TEXT[] DEFAULT '{}',
  skipped_steps TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_progress_tenant_id ON tenant_onboarding_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_progress_user_id ON tenant_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_progress_progress ON tenant_onboarding_progress(progress);

-- Workspace Invites (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_tenant_id ON workspace_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_status ON workspace_invites(status);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_expires_at ON workspace_invites(expires_at);

-- Onboarding Events (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  step_id VARCHAR(255),
  trace_id VARCHAR(255),
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_tenant_id ON onboarding_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_event_type ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_trace_id ON onboarding_events(trace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON onboarding_events(created_at DESC);

-- Audit Logs (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_billing_account_id ON audit_logs(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at ON audit_logs(user_id, created_at DESC);

-- Tenant Branding (already exists in 20260126000000_console_complete_setup.sql, ensuring completeness)
CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#7c3aed',
  accent_color VARCHAR(7) DEFAULT '#06b6d4',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  border_radius_scale DECIMAL(3, 2),
  font_family_primary VARCHAR(100),
  font_family_secondary VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant_id ON tenant_branding(tenant_id);

-- Tenant Navigation (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS tenant_navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nav_items JSONB DEFAULT '[]'::jsonb,
  footer_items JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_navigation_tenant_id ON tenant_navigation(tenant_id);

-- Tenant Pages (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS tenant_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL,
  page_type VARCHAR(50) NOT NULL,
  schema_version VARCHAR(20) DEFAULT '1.0',
  blocks JSONB DEFAULT '[]'::jsonb,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_image_url TEXT,
  is_draft BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant_id ON tenant_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_slug ON tenant_pages(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_page_type ON tenant_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_is_draft ON tenant_pages(is_draft);

-- Tenant Page Revisions (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS tenant_page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_page_id UUID NOT NULL REFERENCES tenant_pages(id) ON DELETE CASCADE,
  editor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  snapshot JSONB NOT NULL,
  comment TEXT,
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_tenant_page_id ON tenant_page_revisions(tenant_page_id);
CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_editor_user_id ON tenant_page_revisions(editor_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_approved_by_user_id ON tenant_page_revisions(approved_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_created_at ON tenant_page_revisions(created_at DESC);

-- ============================================================================
-- A/B TESTING & EXPERIMENTS TABLES
-- ============================================================================

-- Experiments (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES tenant_pages(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  traffic_split JSONB DEFAULT '{}'::jsonb,
  primary_metric VARCHAR(50) DEFAULT 'click_through',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_experiments_tenant_id ON experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiments_target_page_id ON experiments(target_page_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_starts_at ON experiments(starts_at);
CREATE INDEX IF NOT EXISTS idx_experiments_ends_at ON experiments(ends_at);

-- Experiment Variants (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  blocks_override JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_id, key)
);

CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment_id ON experiment_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_variants_key ON experiment_variants(key);

-- Experiment Metric Events (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS experiment_metric_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_key VARCHAR(100) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES tenant_pages(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  session_id VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_experiment_id ON experiment_metric_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_variant_key ON experiment_metric_events(variant_key);
CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_tenant_id ON experiment_metric_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_page_id ON experiment_metric_events(page_id);
CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_event_type ON experiment_metric_events(event_type);
CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_session_id ON experiment_metric_events(session_id);
CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_user_id ON experiment_metric_events(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_metric_events_created_at ON experiment_metric_events(created_at);

-- ============================================================================
-- WEBHOOK TABLES
-- ============================================================================

-- Webhooks (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events JSONB DEFAULT '[]'::jsonb,
  secret TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_deleted_at ON webhooks(deleted_at);

-- Webhook Deliveries (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  status_code INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

-- ============================================================================
-- IDEMPOTENCY TABLES
-- ============================================================================

-- Idempotency Keys (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status ON idempotency_keys(status);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- ============================================================================
-- INGESTION PIPELINE TABLES
-- ============================================================================

-- Ingestion Sources (already exists in 20250131000000_ingestion_pipeline.sql, ensuring completeness)
CREATE TABLE IF NOT EXISTS ingestion_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  connector_type VARCHAR(50),
  config_encrypted TEXT,
  config_metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(50),
  last_sync_error TEXT,
  sync_schedule VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingestion_sources_tenant_id ON ingestion_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_user_id ON ingestion_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_type ON ingestion_sources(type);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_connector_type ON ingestion_sources(connector_type);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_status ON ingestion_sources(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_deleted_at ON ingestion_sources(deleted_at);

-- Ingestions (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS ingestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_stack TEXT,
  trace_id VARCHAR(255),
  raw_record_count INTEGER DEFAULT 0,
  normalized_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestions_source_id ON ingestions(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_tenant_id ON ingestions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_user_id ON ingestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_status ON ingestions(status);
CREATE INDEX IF NOT EXISTS idx_ingestions_idempotency_key ON ingestions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ingestions_started_at ON ingestions(started_at DESC);

-- Raw Records (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS raw_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id UUID NOT NULL REFERENCES ingestions(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  raw_data JSONB NOT NULL,
  row_number INTEGER,
  external_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_records_ingestion_id ON raw_records(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_source_id ON raw_records(source_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_tenant_id ON raw_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_external_id ON raw_records(external_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_status ON raw_records(status);

-- Normalized Transactions (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS normalized_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id UUID NOT NULL REFERENCES ingestions(id) ON DELETE CASCADE,
  raw_record_id UUID UNIQUE REFERENCES raw_records(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES ingestion_sources(id) ON DELETE CASCADE,
  external_id VARCHAR(255),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  date DATE NOT NULL,
  description TEXT,
  category VARCHAR(100),
  payment_method VARCHAR(100),
  reference VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_normalized_transactions_ingestion_id ON normalized_transactions(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_raw_record_id ON normalized_transactions(raw_record_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_tenant_id ON normalized_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_source_id ON normalized_transactions(source_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_external_id ON normalized_transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_date ON normalized_transactions(date);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_amount ON normalized_transactions(amount);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_currency ON normalized_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_tenant_date_amount_currency ON normalized_transactions(tenant_id, date, amount, currency);

-- Reconciliation Runs (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_id UUID REFERENCES ingestions(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  source_count INTEGER DEFAULT 0,
  target_count INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_source_count INTEGER DEFAULT 0,
  unmatched_target_count INTEGER DEFAULT 0,
  confidence_avg DECIMAL(5, 4),
  error_message TEXT,
  trace_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_ingestion_id ON reconciliation_runs(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_id ON reconciliation_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_user_id ON reconciliation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_status ON reconciliation_runs(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_started_at ON reconciliation_runs(started_at DESC);

-- Reconciliation Matches (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
  source_transaction_id UUID NOT NULL REFERENCES normalized_transactions(id) ON DELETE CASCADE,
  target_transaction_id UUID REFERENCES normalized_transactions(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  match_type VARCHAR(50) NOT NULL,
  confidence DECIMAL(5, 4) NOT NULL,
  match_reason TEXT,
  amount_diff DECIMAL(15, 2),
  date_diff INTEGER,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_run_id ON reconciliation_matches(run_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_tenant_id ON reconciliation_matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_source_transaction_id ON reconciliation_matches(source_transaction_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_target_transaction_id ON reconciliation_matches(target_transaction_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_match_type ON reconciliation_matches(match_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_confidence ON reconciliation_matches(confidence);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_reviewed ON reconciliation_matches(reviewed);

-- Exports (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  format VARCHAR(50) NOT NULL,
  reconciliation_run_id UUID REFERENCES reconciliation_runs(id) ON DELETE SET NULL,
  ingestion_id UUID REFERENCES ingestions(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending',
  storage_location VARCHAR(500),
  signed_url TEXT,
  signed_url_expires_at TIMESTAMPTZ,
  file_size_bytes INTEGER,
  row_count INTEGER,
  error_message TEXT,
  trace_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exports_tenant_id ON exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_type ON exports(type);
CREATE INDEX IF NOT EXISTS idx_exports_status ON exports(status);
CREATE INDEX IF NOT EXISTS idx_exports_reconciliation_run_id ON exports(reconciliation_run_id);
CREATE INDEX IF NOT EXISTS idx_exports_ingestion_id ON exports(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_exports_created_at ON exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exports_expires_at ON exports(expires_at);

-- ============================================================================
-- ANALYTICS & CHATBOT TABLES (from schema-additions.prisma)
-- ============================================================================

-- Analytics Events (already exists in 20260120000000_add_analytics_and_chatbot_tables.sql, ensuring completeness)
CREATE TABLE IF NOT EXISTS analytics_events (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type VARCHAR(100) NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  session_id VARCHAR(255),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- SDK Downloads (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS sdk_downloads (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  package_name VARCHAR(255) NOT NULL,
  version VARCHAR(100) NOT NULL,
  package_manager VARCHAR(50) NOT NULL,
  user_id UUID,
  session_id VARCHAR(255),
  user_agent TEXT,
  referrer TEXT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sdk_downloads_package_name ON sdk_downloads(package_name);
CREATE INDEX IF NOT EXISTS idx_sdk_downloads_timestamp ON sdk_downloads(timestamp);
CREATE INDEX IF NOT EXISTS idx_sdk_downloads_user_id ON sdk_downloads(user_id);

-- Playground Usage (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS playground_usage (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feature VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  integration VARCHAR(100),
  duration_ms INTEGER,
  success BOOLEAN,
  user_id UUID,
  session_id VARCHAR(255),
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playground_usage_feature ON playground_usage(feature);
CREATE INDEX IF NOT EXISTS idx_playground_usage_timestamp ON playground_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_playground_usage_user_id ON playground_usage(user_id);

-- Chatbot Conversations (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  user_id UUID,
  session_id VARCHAR(255),
  device_info JSONB,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_conversation_id ON chatbot_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_timestamp ON chatbot_conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);

-- Chatbot Analytics (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS chatbot_analytics (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type VARCHAR(100) NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  session_id VARCHAR(255),
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_type ON chatbot_analytics(type);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_timestamp ON chatbot_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_session_id ON chatbot_analytics(session_id);

-- Newsletter Subscriptions (already exists, ensuring completeness)
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  source VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  resend_contact_id VARCHAR(255),
  subscribed BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_subscribed ON newsletter_subscriptions(subscribed);

COMMIT;
