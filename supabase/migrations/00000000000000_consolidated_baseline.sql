-- ============================================================================
-- SETTLER CONSOLIDATED BASELINE MIGRATION
-- ============================================================================
-- Consolidated from all historical migrations in the repository
-- Generated: 2026-03-18
--
-- This is the canonical, idempotent schema definition for Settler
-- Designed to be:
-- 1. Idempotent - safe to run multiple times (uses IF NOT EXISTS)
-- 2. Complete - defines the entire application schema
-- 3. Authoritative - this is the source of truth
-- 4. Production-safe - RLS enabled, tenant isolation enforced
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_segment') THEN
    CREATE TYPE public.customer_segment AS ENUM ('free_tier', 'trial', 'commercial', 'enterprise', 'churned');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_sequence_type') THEN
    CREATE TYPE public.email_sequence_type AS ENUM ('onboarding', 'upgrade_prompt', 'expansion', 'churn_save', 'trial_ending', 'payment_failed', 'activation_reminder');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_status') THEN
    CREATE TYPE public.export_status AS ENUM ('pending', 'running', 'succeeded', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_severity') THEN
    CREATE TYPE public.issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
    CREATE TYPE public.issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_event_type') THEN
    CREATE TYPE public.receipt_event_type AS ENUM ('receipt.created', 'receipt.processed', 'receipt.failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_upload_status') THEN
    CREATE TYPE public.receipt_upload_status AS ENUM ('pending', 'processing', 'processed', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_lifecycle_stage') THEN
    CREATE TYPE public.user_lifecycle_stage AS ENUM ('signup', 'activation', 'engaged', 'retention', 'expansion', 'at_risk', 'churned');
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS (Tenant Isolation)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  IF v_tenant_id IS NULL THEN
    BEGIN
      v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_tenant_context(tenant_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- get_user_tenant_ids - Critical for RLS policies
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  -- Get tenant IDs from billing_accounts
  RETURN QUERY
  SELECT DISTINCT COALESCE(ba.tenant_id, ba.id::uuid)
  FROM billing_accounts ba
  WHERE ba.user_id = auth.uid()
    AND ba.status = 'active'
    AND ba.deleted_at IS NULL;

  -- Also check memberships for multi-tenant users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memberships') THEN
    RETURN QUERY
    SELECT DISTINCT m.tenant_id
    FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.status = 'active';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO service_role;

-- Helper for creating indexes idempotently
CREATE OR REPLACE FUNCTION create_index_if_not_exists(
    p_index_name TEXT,
    p_table_name TEXT,
    p_index_definition TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = p_table_name
        AND indexname = p_index_name
    ) THEN
        EXECUTE format('CREATE INDEX %I ON %I %s', p_index_name, p_table_name, p_index_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 1: CORE TENANT INFRASTRUCTURE
-- ============================================================================

-- TENANTS
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id uuid REFERENCES public.billing_accounts(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  primary_domain text,
  custom_domain text,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_billing_account_id ON public.tenants(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON public.tenants(is_active);

-- BILLING ACCOUNTS
CREATE TABLE IF NOT EXISTS public.billing_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tenant_id uuid,
  stripe_customer_id text,
  stripe_account_id text,
  email text NOT NULL,
  name text,
  address jsonb,
  tax_id text,
  currency text DEFAULT 'usd',
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Add tenant_id column if missing (from later migrations)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_accounts' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.billing_accounts ADD COLUMN tenant_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_billing_accounts_user_id ON public.billing_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_tenant_id ON public.billing_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe_customer_id ON public.billing_accounts(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_status ON public.billing_accounts(status);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id uuid REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_price_id text,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_account_id ON public.subscriptions(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- MEMBERSHIPS (Multi-tenant user access)
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_fkey'
    AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_user_id_fkey'
    AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_tenant_id_user_id_key'
    AND conrelid = 'public.memberships'::regclass
  ) THEN
    ALTER TABLE public.memberships ADD CONSTRAINT memberships_tenant_id_user_id_key UNIQUE (tenant_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON public.memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);

-- ============================================================================
-- SECTION 2: BILLING & USAGE
-- ============================================================================

-- ADD-ONS
CREATE TABLE IF NOT EXISTS public.add_ons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  base_price_monthly numeric(10,2),
  usage_price_per_unit numeric(10,6),
  usage_unit text,
  stripe_product_id text,
  stripe_price_id text,
  is_active boolean DEFAULT true,
  is_standard boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_add_ons_integration_id ON public.add_ons(integration_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_is_active ON public.add_ons(is_active);

-- ADD-ON PURCHASES
CREATE TABLE IF NOT EXISTS public.add_on_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id uuid NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
  add_on_id uuid NOT NULL REFERENCES public.add_ons(id) ON DELETE RESTRICT,
  stripe_subscription_item_id text UNIQUE,
  status text DEFAULT 'active',
  purchased_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_add_on_purchases_billing_account_id ON public.add_on_purchases(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_add_on_purchases_add_on_id ON public.add_on_purchases(add_on_id);
CREATE INDEX IF NOT EXISTS idx_add_on_purchases_status ON public.add_on_purchases(status);

-- USAGE EVENTS
CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id uuid NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
  project_id uuid,
  user_id uuid,
  tenant_id uuid,
  event_type text NOT NULL,
  integration_id text,
  add_on_id uuid,
  quantity numeric(15,6),
  unit text,
  metadata jsonb,
  timestamp timestamptz DEFAULT now(),
  aggregated boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account_id ON public.usage_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_id ON public.usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON public.usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON public.usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_aggregated ON public.usage_events(aggregated);

-- USAGE AGGREGATE DAILY
CREATE TABLE IF NOT EXISTS public.usage_aggregate_daily (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id uuid NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
  project_id uuid,
  tenant_id uuid,
  date date NOT NULL,
  event_type text NOT NULL,
  integration_id text,
  add_on_id uuid,
  total_quantity numeric(15,6),
  event_count int DEFAULT 0,
  estimated_cost numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(billing_account_id, project_id, date, event_type, integration_id, add_on_id)
);

CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_billing_account_id ON public.usage_aggregate_daily(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_tenant_id ON public.usage_aggregate_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregate_daily_date ON public.usage_aggregate_daily(date);

-- USAGE COUNTERS
CREATE TABLE IF NOT EXISTS public.usage_counters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id uuid NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
  service text NOT NULL,
  period text NOT NULL,
  period_start date NOT NULL,
  count int DEFAULT 0,
  limit_val int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(billing_account_id, service, period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_billing_account_id ON public.usage_counters(billing_account_id);

-- STRIPE EVENTS
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text UNIQUE NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'received',
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error text,
  user_id uuid,
  tenant_id uuid,
  billing_account_id uuid,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_status ON public.stripe_events(status);
CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant_id ON public.stripe_events(tenant_id);

-- ============================================================================
-- SECTION 3: RECON CORE ENGINE
-- ============================================================================

-- RECON JOBS
CREATE TABLE IF NOT EXISTS public.recon_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  template_id uuid,
  source_adapter text NOT NULL,
  source_config_encrypted text NOT NULL,
  target_adapter text NOT NULL,
  target_config_encrypted text NOT NULL,
  mapping_template_id uuid,
  transform_recipe_id uuid,
  validation_rules jsonb DEFAULT '[]',
  recon_strategy text DEFAULT 'deterministic',
  schedule_cron text,
  schedule_timezone text DEFAULT 'UTC',
  status text DEFAULT 'active',
  version int DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_recon_jobs_tenant_id ON public.recon_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_user_id ON public.recon_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_status ON public.recon_jobs(status);
CREATE INDEX IF NOT EXISTS idx_recon_jobs_template_id ON public.recon_jobs(template_id);

-- RECON RESULTS
CREATE TABLE IF NOT EXISTS public.recon_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recon_job_id uuid REFERENCES public.recon_jobs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  execution_id uuid,
  status text DEFAULT 'running',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  source_count int DEFAULT 0,
  target_count int DEFAULT 0,
  matched_count int DEFAULT 0,
  unmatched_source_count int DEFAULT 0,
  unmatched_target_count int DEFAULT 0,
  conflict_count int DEFAULT 0,
  total_amount_source numeric(15,2),
  total_amount_target numeric(15,2),
  total_amount_matched numeric(15,2),
  total_amount_unmatched numeric(15,2),
  currency text,
  confidence_avg numeric(5,4),
  confidence_min numeric(5,4),
  confidence_max numeric(5,4),
  duration_ms bigint,
  error_message text,
  error_stack text,
  summary jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recon_results_recon_job_id ON public.recon_results(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_recon_results_tenant_id ON public.recon_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_results_status ON public.recon_results(status);
CREATE INDEX IF NOT EXISTS idx_recon_results_started_at ON public.recon_results(started_at DESC);

-- RECON TEMPLATES
CREATE TABLE IF NOT EXISTS public.recon_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  name text NOT NULL,
  description text,
  category text,
  source_adapter_type text,
  target_adapter_type text,
  recon_strategy text DEFAULT 'deterministic',
  matching_rules jsonb DEFAULT '[]',
  validation_rules jsonb DEFAULT '[]',
  transform_rules jsonb DEFAULT '[]',
  is_public boolean DEFAULT false,
  is_system boolean DEFAULT false,
  usage_count int DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_recon_templates_tenant_id ON public.recon_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_templates_category ON public.recon_templates(category);
CREATE INDEX IF NOT EXISTS idx_recon_templates_is_public ON public.recon_templates(is_public);

-- RECON AUDITS
CREATE TABLE IF NOT EXISTS public.recon_audits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recon_job_id uuid REFERENCES public.recon_jobs(id) ON DELETE CASCADE,
  recon_result_id uuid REFERENCES public.recon_results(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  user_id uuid,
  audit_type text NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  changes jsonb,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recon_audits_tenant_id ON public.recon_audits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recon_audits_recon_job_id ON public.recon_audits(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_recon_audits_audit_type ON public.recon_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_recon_audits_created_at ON public.recon_audits(created_at DESC);

-- MAPPING TEMPLATES
CREATE TABLE IF NOT EXISTS public.mapping_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  name text NOT NULL,
  description text,
  source_schema jsonb NOT NULL,
  target_schema jsonb NOT NULL,
  field_mappings jsonb DEFAULT '{}',
  transformation_rules jsonb DEFAULT '[]',
  validation_rules jsonb DEFAULT '[]',
  is_public boolean DEFAULT false,
  is_system boolean DEFAULT false,
  usage_count int DEFAULT 0,
  version int DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_mapping_templates_tenant_id ON public.mapping_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mapping_templates_is_public ON public.mapping_templates(is_public);

-- VALIDATION RULES
CREATE TABLE IF NOT EXISTS public.validation_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  rule_config jsonb,
  severity text DEFAULT 'error',
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT false,
  is_system boolean DEFAULT false,
  usage_count int DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_validation_rules_tenant_id ON public.validation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_validation_rules_rule_type ON public.validation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_validation_rules_is_active ON public.validation_rules(is_active);

-- TRANSFORM REIPES
CREATE TABLE IF NOT EXISTS public.transform_recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  name text NOT NULL,
  description text,
  recipe_type text NOT NULL,
  input_schema jsonb NOT NULL,
  output_schema jsonb NOT NULL,
  transformation_steps jsonb DEFAULT '[]',
  validation_rules jsonb DEFAULT '[]',
  is_public boolean DEFAULT false,
  is_system boolean DEFAULT false,
  usage_count int DEFAULT 0,
  version int DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_transform_recipes_tenant_id ON public.transform_recipes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transform_recipes_recipe_type ON public.transform_recipes(recipe_type);
CREATE INDEX IF NOT EXISTS idx_transform_recipes_is_public ON public.transform_recipes(is_public);

-- CONTRACT VERSIONS
CREATE TABLE IF NOT EXISTS public.contract_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  contract_name text NOT NULL,
  version text NOT NULL,
  schema_definition jsonb,
  is_active boolean DEFAULT true,
  is_deprecated boolean DEFAULT false,
  deprecated_at timestamptz,
  breaking_changes jsonb DEFAULT '[]',
  migration_guide text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, contract_name, version)
);

CREATE INDEX IF NOT EXISTS idx_contract_versions_tenant_id ON public.contract_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_contract_name ON public.contract_versions(contract_name);
CREATE INDEX IF NOT EXISTS idx_contract_versions_is_active ON public.contract_versions(is_active);

-- DRIFT EVENTS
CREATE TABLE IF NOT EXISTS public.drift_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  recon_job_id uuid,
  contract_version_id uuid,
  drift_type text NOT NULL,
  severity text DEFAULT 'warning',
  field_path text,
  expected_value jsonb,
  actual_value jsonb,
  drift_metrics jsonb DEFAULT '{}',
  auto_repaired boolean DEFAULT false,
  repair_action jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drift_events_tenant_id ON public.drift_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drift_events_recon_job_id ON public.drift_events(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_drift_events_severity ON public.drift_events(severity);

-- ============================================================================
-- SECTION 4: CONNECTORS & INGESTION
-- ============================================================================

-- CONNECTORS
CREATE TABLE IF NOT EXISTS public.connectors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  adapter_type text NOT NULL,
  adapter_config jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connectors_tenant_id ON public.connectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connectors_adapter_type ON public.connectors(adapter_type);

-- CONNECTOR CREDENTIALS
CREATE TABLE IF NOT EXISTS public.connector_credentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  credential_name text NOT NULL,
  encrypted_value text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(connector_id, credential_name)
);

CREATE INDEX IF NOT EXISTS idx_connector_credentials_connector_id ON public.connector_credentials(connector_id);
CREATE INDEX IF NOT EXISTS idx_connector_credentials_tenant_id ON public.connector_credentials(tenant_id);

-- CONNECTOR ACCOUNTS
CREATE TABLE IF NOT EXISTS public.connector_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  provider_account_id text NOT NULL,
  account_name text,
  account_type text,
  currency text,
  institution_name text,
  institution_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(connector_id, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_connector_accounts_connector_id ON public.connector_accounts(connector_id);
CREATE INDEX IF NOT EXISTS idx_connector_accounts_tenant_id ON public.connector_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_accounts_institution_id ON public.connector_accounts(institution_id);

-- SYNC RUNS
CREATE TABLE IF NOT EXISTS public.sync_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  sync_type text NOT NULL,
  status text DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  records_created int DEFAULT 0,
  records_updated int DEFAULT 0,
  records_deleted int DEFAULT 0,
  error_message text,
  persistence_status text,
  recovery_required boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_runs' AND column_name = 'persistence_status') THEN
    ALTER TABLE public.sync_runs ADD COLUMN persistence_status text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_runs' AND column_name = 'recovery_required') THEN
    ALTER TABLE public.sync_runs ADD COLUMN recovery_required boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sync_runs_persistence_status_check'
    AND conrelid = 'public.sync_runs'::regclass
  ) THEN
    ALTER TABLE public.sync_runs
      ADD CONSTRAINT sync_runs_persistence_status_check
      CHECK (
        persistence_status IS NULL
        OR persistence_status IN ('durable_atomic', 'durable_non_atomic', 'failed_partial')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sync_runs_connector_id ON public.sync_runs(connector_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_tenant_id ON public.sync_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON public.sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_sync_runs_persistence_status ON public.sync_runs(persistence_status) WHERE persistence_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sync_runs_recovery_required ON public.sync_runs(recovery_required) WHERE recovery_required = true;

-- SYNC CURSORS
CREATE TABLE IF NOT EXISTS public.sync_cursors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  cursor_key text NOT NULL,
  cursor_value text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(connector_id, cursor_key)
);

CREATE INDEX IF NOT EXISTS idx_sync_cursors_connector_id ON public.sync_cursors(connector_id);
CREATE INDEX IF NOT EXISTS idx_sync_cursors_tenant_id ON public.sync_cursors(tenant_id);

-- FINANCIAL TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  account_id uuid,
  external_id text NOT NULL,
  transaction_type text,
  amount_cents bigint,
  currency text,
  occurred_at timestamptz,
  description text,
  reference_id text,
  reference_type text,
  provider_metadata jsonb DEFAULT '{}',
  raw_payload jsonb,
  idempotency_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, connector_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_connector_id ON public.financial_transactions(connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id ON public.financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_account_id ON public.financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_occurred_at ON public.financial_transactions(occurred_at DESC);

-- FINANCIAL BALANCES
CREATE TABLE IF NOT EXISTS public.financial_balances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  account_id uuid,
  balance_cents bigint,
  available_balance_cents bigint,
  currency text,
  snapshot_at timestamptz,
  provider_metadata jsonb DEFAULT '{}',
  raw_payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_balances_connector_id ON public.financial_balances(connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_balances_tenant_id ON public.financial_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_balances_account_id ON public.financial_balances(account_id);

-- FINANCIAL PAYOUTS
CREATE TABLE IF NOT EXISTS public.financial_payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  account_id uuid,
  external_id text NOT NULL,
  payout_type text,
  amount_cents bigint,
  currency text,
  status text,
  arrived_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_payouts_connector_id ON public.financial_payouts(connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_payouts_tenant_id ON public.financial_payouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_payouts_status ON public.financial_payouts(status);

-- FINANCIAL INVOICES
CREATE TABLE IF NOT EXISTS public.financial_invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  external_id text NOT NULL,
  invoice_number text,
  amount_cents bigint,
  currency text,
  status text,
  invoice_date timestamptz,
  due_date timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_invoices_connector_id ON public.financial_invoices(connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_tenant_id ON public.financial_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_invoices_status ON public.financial_invoices(status);

-- FINANCIAL SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.financial_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  external_id text NOT NULL,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_subscriptions_connector_id ON public.financial_subscriptions(connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_subscriptions_tenant_id ON public.financial_subscriptions(tenant_id);

-- FINANCIAL TAX ESTIMATES
CREATE TABLE IF NOT EXISTS public.financial_tax_estimates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  transaction_id uuid,
  tax_type text,
  amount_cents bigint,
  currency text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_tax_estimates_connector_id ON public.financial_tax_estimates(connector_id);
CREATE INDEX IF NOT EXISTS idx_financial_tax_estimates_tenant_id ON public.financial_tax_estimates(tenant_id);

-- RAW EVENTS
CREATE TABLE IF NOT EXISTS public.raw_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  event_type text NOT NULL,
  event_id text NOT NULL,
  payload jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(connector_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_raw_events_connector_id ON public.raw_events(connector_id);
CREATE INDEX IF NOT EXISTS idx_raw_events_tenant_id ON public.raw_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_raw_events_event_type ON public.raw_events(event_type);
CREATE INDEX IF NOT EXISTS idx_raw_events_processed ON public.raw_events(processed);

-- WEBHOOK EVENTS
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  connector_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_id ON public.webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);

-- INGESTION SOURCES
CREATE TABLE IF NOT EXISTS public.ingestion_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  connector_type text,
  config_encrypted text,
  config_metadata jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  sync_schedule text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ingestion_sources_tenant_id ON public.ingestion_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_type ON public.ingestion_sources(type);
CREATE INDEX IF NOT EXISTS idx_ingestion_sources_status ON public.ingestion_sources(status);

-- INGESTIONS
CREATE TABLE IF NOT EXISTS public.ingestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  status text DEFAULT 'pending',
  records_count int DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingestions_source_id ON public.ingestions(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_tenant_id ON public.ingestions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_status ON public.ingestions(status);

-- RAW RECORDS
CREATE TABLE IF NOT EXISTS public.raw_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  record_data jsonb NOT NULL,
  fingerprint text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_records_ingestion_id ON public.raw_records(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_raw_records_tenant_id ON public.raw_records(tenant_id);

-- NORMALIZED TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.normalized_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  source_record_id text,
  normalized_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_normalized_transactions_ingestion_id ON public.normalized_transactions(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_tenant_id ON public.normalized_transactions(tenant_id);

-- RECONCILIATION RUNS
CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  status text DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  matches_count int DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_ingestion_id ON public.reconciliation_runs(ingestion_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_id ON public.reconciliation_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_status ON public.reconciliation_runs(status);

-- RECONCILIATION MATCHES
CREATE TABLE IF NOT EXISTS public.reconciliation_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  source_record_id text NOT NULL,
  target_record_id text NOT NULL,
  match_confidence numeric(5,4),
  match_type text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_run_id ON public.reconciliation_matches(run_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_tenant_id ON public.reconciliation_matches(tenant_id);

-- ============================================================================
-- SECTION 5: JOB QUEUE (JobForge)
-- ============================================================================

-- JOBFORGE JOBS
CREATE TABLE IF NOT EXISTS public.jobforge_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'dead', 'canceled')),
  attempts int NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts int NOT NULL DEFAULT 5 CHECK (max_attempts >= 1),
  run_at timestamptz NOT NULL DEFAULT NOW(),
  locked_at timestamptz,
  locked_by text,
  heartbeat_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  idempotency_key text,
  created_by text,
  error jsonb,
  result_id uuid,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT jobforge_jobs_idempotency_unique UNIQUE (tenant_id, type, idempotency_key) DEFERRABLE INITIALLY DEFERRED
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobforge_jobs_idempotency ON jobforge_jobs (tenant_id, type, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobforge_jobs_claim ON jobforge_jobs (tenant_id, status, run_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_jobforge_jobs_locked ON jobforge_jobs (locked_at, locked_by) WHERE locked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobforge_jobs_type ON jobforge_jobs (tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_jobforge_jobs_status ON jobforge_jobs (tenant_id, status, created_at DESC);

-- JOBFORGE JOB RESULTS
CREATE TABLE IF NOT EXISTS public.jobforge_job_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobforge_jobs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  artifact_ref text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobforge_job_results_job_id ON public.jobforge_job_results(job_id);
CREATE INDEX IF NOT EXISTS idx_jobforge_job_results_tenant ON public.jobforge_job_results(tenant_id, created_at DESC);

-- JOBFORGE JOB ATTEMPTS
CREATE TABLE IF NOT EXISTS public.jobforge_job_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobforge_jobs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  attempt_no int NOT NULL CHECK (attempt_no >= 1),
  started_at timestamptz NOT NULL DEFAULT NOW(),
  finished_at timestamptz,
  error jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobforge_job_attempts_job_id ON public.jobforge_job_attempts(job_id, attempt_no);
CREATE INDEX IF NOT EXISTS idx_jobforge_job_attempts_tenant ON public.jobforge_job_attempts(tenant_id, created_at DESC);

-- JOBFORGE CONNECTOR CONFIGS
CREATE TABLE IF NOT EXISTS public.jobforge_connector_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  connector_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT jobforge_connector_configs_unique UNIQUE (tenant_id, connector_type)
);

CREATE INDEX IF NOT EXISTS idx_jobforge_connector_configs_tenant ON public.jobforge_connector_configs(tenant_id);

-- ============================================================================
-- SECTION 6: RECEIPTS & EXPORTS
-- ============================================================================

-- RECEIPT UPLOADS
CREATE TABLE IF NOT EXISTS public.receipt_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id uuid,
  billing_account_id uuid,
  storage_location text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes int NOT NULL,
  status text DEFAULT 'pending',
  processing_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_billing_account_id ON public.receipt_uploads(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_status ON public.receipt_uploads(status);

-- RECEIPTS
CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_upload_id uuid REFERENCES public.receipt_uploads(id) ON DELETE SET NULL,
  tenant_id uuid NOT NULL,
  billing_account_id uuid,
  receipt_date date,
  total_amount numeric(15,2),
  currency text DEFAULT 'usd',
  vendor_name text,
  receipt_data jsonb DEFAULT '{}',
  hash_chain text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON public.receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_billing_account_id ON public.receipts(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_date ON public.receipts(receipt_date);

-- RECEIPT ITEMS
CREATE TABLE IF NOT EXISTS public.receipt_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id uuid NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2),
  unit_price numeric(15,2),
  total_amount numeric(15,2),
  category text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON public.receipt_items(receipt_id);

-- EXPORTS
CREATE TABLE IF NOT EXISTS public.exports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  export_type text NOT NULL,
  format text NOT NULL,
  status text DEFAULT 'pending',
  file_url text,
  record_count int DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_exports_tenant_id ON public.exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON public.exports(status);

-- ============================================================================
-- SECTION 7: FEATURE FLAGS & CONFIGURATION
-- ============================================================================

-- FEATURE FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_account_id uuid,
  project_id uuid,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  type text DEFAULT 'boolean',
  is_global boolean DEFAULT false,
  default_value jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_billing_account_id ON public.feature_flags(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_global ON public.feature_flags(is_global);

-- FEATURE FLAG ENVIRONMENTS
CREATE TABLE IF NOT EXISTS public.feature_flag_environments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_flag_id uuid NOT NULL,
  environment text NOT NULL,
  enabled boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(feature_flag_id, environment)
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_environments_feature_flag_id ON public.feature_flag_environments(feature_flag_id);

-- FEATURE FLAG OVERRIDES
CREATE TABLE IF NOT EXISTS public.feature_flag_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_flag_id uuid NOT NULL,
  tenant_id uuid,
  user_id uuid,
  value jsonb NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_feature_flag_id ON public.feature_flag_overrides(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_tenant_id ON public.feature_flag_overrides(tenant_id);

-- ============================================================================
-- SECTION 8: WEBHOOKS
-- ============================================================================

-- WEBHOOKS
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL,
  secret text,
  is_active boolean DEFAULT true,
  failure_count int DEFAULT 0,
  last_failure_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON public.webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON public.webhooks(is_active);

-- WEBHOOK DELIVERIES
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending',
  response_status_code int,
  response_body text,
  error_message text,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  delivered_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant_id ON public.webhook_deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);

-- ============================================================================
-- SECTION 9: SECURITY & IDEMPOTENCY
-- ============================================================================

-- IDEMPOTENCY KEYS (Tenant-scoped compound key for security)
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  tenant_id uuid NOT NULL,
  key text NOT NULL,
  response_hash text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON public.idempotency_keys(created_at DESC);

-- INGESTION DLQ
CREATE TABLE IF NOT EXISTS public.ingestion_dlq (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  payload jsonb NOT NULL,
  signature_validation_error text,
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ingestion_dlq_tenant_id ON public.ingestion_dlq(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_dlq_received_at ON public.ingestion_dlq(received_at DESC);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  billing_account_id uuid,
  tenant_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  changes jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- SECTION 10: INFRASTRUCTURE & MONITORING
-- ============================================================================

-- OPERATOR INFRASTRUCTURE SETTINGS
CREATE TABLE IF NOT EXISTS public.operator_infrastructure_settings (
  id varchar(50) PRIMARY KEY DEFAULT 'global',
  settings jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- SYSTEM INCIDENTS
CREATE TABLE IF NOT EXISTS public.system_incidents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  severity text NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'open',
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON public.system_incidents(status);
CREATE INDEX IF NOT EXISTS idx_system_incidents_severity ON public.system_incidents(severity);

-- AUDIT NOTARIZATION CHECKPOINTS
CREATE TABLE IF NOT EXISTS public.audit_notarization_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_at timestamptz NOT NULL DEFAULT now(),
  audit_row_count bigint NOT NULL,
  checkpoint_hash text NOT NULL,
  source_window text NOT NULL DEFAULT 'latest_5000',
  created_by text NOT NULL DEFAULT current_user
);

CREATE INDEX IF NOT EXISTS idx_audit_notarization_checkpoints_checkpoint_at ON public.audit_notarization_checkpoints(checkpoint_at DESC);

-- API CALL LOGS
CREATE TABLE IF NOT EXISTS public.api_call_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code int,
  response_time_ms int,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_call_logs_tenant_id ON public.api_call_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_endpoint ON public.api_call_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_created_at ON public.api_call_logs(created_at DESC);

-- ============================================================================
-- SECTION 11: DETERMINISTIC RECON (Prisma Migrations)
-- ============================================================================

-- RUN SNAPSHOTS
CREATE TABLE IF NOT EXISTS public.run_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  recon_job_id uuid NOT NULL,
  run_fingerprint varchar(64) NOT NULL,
  input_fingerprint varchar(64) NOT NULL,
  source_data_fingerprint varchar(64) NOT NULL,
  target_data_fingerprint varchar(64) NOT NULL,
  adapter_config_hashes jsonb DEFAULT '{}',
  pipeline_id varchar(255) NOT NULL,
  pipeline_version varchar(64) NOT NULL DEFAULT '1',
  ruleset_id varchar(255) NOT NULL,
  ruleset_version varchar(64) NOT NULL DEFAULT '1',
  ruleset_hash varchar(64) NOT NULL,
  engine_version varchar(64) NOT NULL DEFAULT '1.0.0',
  input_record_count integer NOT NULL DEFAULT 0,
  status varchar(32) NOT NULL DEFAULT 'QUEUED',
  status_transitions jsonb DEFAULT '[]',
  started_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb DEFAULT '{}',
  UNIQUE(tenant_id, run_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_run_snapshots_tenant_id ON public.run_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_run_snapshots_recon_job_id ON public.run_snapshots(recon_job_id);
CREATE INDEX IF NOT EXISTS idx_run_snapshots_status ON public.run_snapshots(status);
CREATE INDEX IF NOT EXISTS idx_run_snapshots_created_at ON public.run_snapshots(created_at DESC);

-- EXECUTION PROVENANCE
CREATE TABLE IF NOT EXISTS public.execution_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_result_id uuid NOT NULL,
  snapshot_id uuid NOT NULL,
  sequence integer NOT NULL,
  operation varchar(64) NOT NULL,
  entity_type varchar(64) NOT NULL,
  entity_id uuid NOT NULL,
  rule_id uuid,
  rule_version integer,
  confidence decimal(5,4),
  scoring_breakdown jsonb DEFAULT '{}',
  actor varchar(32) NOT NULL DEFAULT 'system',
  actor_user_id uuid,
  left_record_fingerprint varchar(64),
  right_record_fingerprint varchar(64),
  evidence_pointers jsonb DEFAULT '{}',
  match_rationale jsonb DEFAULT '{}',
  entry_hash varchar(64) NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(run_result_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_execution_provenance_run_result_id ON public.execution_provenance(run_result_id);
CREATE INDEX IF NOT EXISTS idx_execution_provenance_snapshot_id ON public.execution_provenance(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_execution_provenance_entity_id ON public.execution_provenance(entity_id);

-- DETERMINISTIC MATCH RESULTS
CREATE TABLE IF NOT EXISTS public.deterministic_match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  snapshot_id uuid NOT NULL,
  run_result_id uuid,
  stable_match_id varchar(65) NOT NULL,
  left_record_id uuid NOT NULL,
  left_record_fingerprint varchar(64) NOT NULL,
  left_record_source varchar(255) NOT NULL,
  right_record_id uuid NOT NULL,
  right_record_fingerprint varchar(64) NOT NULL,
  right_record_source varchar(255) NOT NULL,
  rule_id uuid,
  rule_version integer NOT NULL DEFAULT 1,
  confidence_score decimal(5,4) NOT NULL,
  scoring_breakdown jsonb DEFAULT '{}',
  match_type varchar(32) NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, stable_match_id)
);

CREATE INDEX IF NOT EXISTS idx_deterministic_match_results_tenant_id ON public.deterministic_match_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deterministic_match_results_snapshot_id ON public.deterministic_match_results(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_deterministic_match_results_run_result_id ON public.deterministic_match_results(run_result_id);

-- ============================================================================
-- SECTION 12: UTILITY FUNCTIONS
-- ============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION jobforge_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS jobforge_jobs_update_updated_at ON public.jobforge_jobs;
CREATE TRIGGER jobforge_jobs_update_updated_at
  BEFORE UPDATE ON public.jobforge_jobs
  FOR EACH ROW
  EXECUTE FUNCTION jobforge_update_updated_at();

DROP TRIGGER IF EXISTS jobforge_connector_configs_update_updated_at ON public.jobforge_connector_configs;
CREATE TRIGGER jobforge_connector_configs_update_updated_at
  BEFORE UPDATE ON public.jobforge_connector_configs
  FOR EACH ROW
  EXECUTE FUNCTION jobforge_update_updated_at();

-- Audit notarization hash function
CREATE OR REPLACE FUNCTION public.compute_audit_notarization_hash(max_rows integer DEFAULT 5000)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  computed_hash text;
BEGIN
  IF max_rows < 1 THEN
    max_rows := 1;
  END IF;

  IF to_regclass('public.audit_logs') IS NULL THEN
    RETURN md5('');
  END IF;

  SELECT md5(COALESCE(string_agg(to_jsonb(a)::text, '|' ORDER BY a.id::text), ''))
  INTO computed_hash
  FROM (
    SELECT *
    FROM public.audit_logs
    ORDER BY id DESC
    LIMIT max_rows
  ) a;

  RETURN computed_hash;
END;
$fn$;

-- Write audit notarization checkpoint
CREATE OR REPLACE FUNCTION public.write_audit_notarization_checkpoint(max_rows integer DEFAULT 5000)
RETURNS public.audit_notarization_checkpoints
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $fn$
DECLARE
  inserted_row public.audit_notarization_checkpoints;
  audit_count bigint;
  hash_value text;
BEGIN
  IF to_regclass('public.audit_logs') IS NULL THEN
    RAISE EXCEPTION 'public.audit_logs is required for notarization checkpoints';
  END IF;

  SELECT COUNT(*) INTO audit_count FROM public.audit_logs;
  hash_value := public.compute_audit_notarization_hash(max_rows);

  INSERT INTO public.audit_notarization_checkpoints (
    audit_row_count,
    checkpoint_hash,
    source_window
  ) VALUES (
    audit_count,
    hash_value,
    format('latest_%s', max_rows)
  )
  RETURNING * INTO inserted_row;

  RETURN inserted_row;
END;
$fn$;

-- Block audit log mutation trigger function
CREATE OR REPLACE FUNCTION public.block_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only and cannot be %', TG_OP
    USING ERRCODE = '42501';
END;
$fn$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - CRITICAL
-- ============================================================================

-- Tenants RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_select_tenant ON public.tenants;
CREATE POLICY tenants_select_tenant ON public.tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_tenant_ids()));

-- Billing Accounts RLS
ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_accounts_select_own ON public.billing_accounts;
CREATE POLICY billing_accounts_select_own ON public.billing_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS billing_accounts_update_own ON public.billing_accounts;
CREATE POLICY billing_accounts_update_own ON public.billing_accounts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Subscriptions RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select ON public.subscriptions;
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Memberships RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memberships_select ON public.memberships;
CREATE POLICY memberships_select ON public.memberships
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS memberships_insert ON public.memberships;
CREATE POLICY memberships_insert ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS memberships_update ON public.memberships;
CREATE POLICY memberships_update ON public.memberships
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Usage Events RLS
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_events_select ON public.usage_events;
CREATE POLICY usage_events_select ON public.usage_events
  FOR SELECT TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS usage_events_insert_service ON public.usage_events;
CREATE POLICY usage_events_insert_service ON public.usage_events
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Usage Aggregate Daily RLS
ALTER TABLE public.usage_aggregate_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_aggregate_daily_select ON public.usage_aggregate_daily;
CREATE POLICY usage_aggregate_daily_select ON public.usage_aggregate_daily
  FOR SELECT TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Usage Counters RLS
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_counters_select ON public.usage_counters;
CREATE POLICY usage_counters_select ON public.usage_counters
  FOR SELECT TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Recon Jobs RLS
ALTER TABLE public.recon_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_jobs_select ON public.recon_jobs;
CREATE POLICY recon_jobs_select ON public.recon_jobs
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS recon_jobs_insert ON public.recon_jobs;
CREATE POLICY recon_jobs_insert ON public.recon_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS recon_jobs_update ON public.recon_jobs;
CREATE POLICY recon_jobs_update ON public.recon_jobs
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Recon Results RLS
ALTER TABLE public.recon_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_results_select ON public.recon_results;
CREATE POLICY recon_results_select ON public.recon_results
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR tenant_id IN (
      SELECT COALESCE(tenant_id, id::uuid) FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Recon Templates RLS
ALTER TABLE public.recon_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recon_templates_select ON public.recon_templates;
CREATE POLICY recon_templates_select ON public.recon_templates
  FOR SELECT TO authenticated
  USING (
    is_public = true OR
    is_system = true OR
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

DROP POLICY IF EXISTS recon_templates_insert ON public.recon_templates;
CREATE POLICY recon_templates_insert ON public.recon_templates
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS recon_templates_update ON public.recon_templates;
CREATE POLICY recon_templates_update ON public.recon_templates
  FOR UPDATE TO authenticated
  USING (
    is_system = false AND
    tenant_id IN (SELECT public.get_user_tenant_ids())
  )
  WITH CHECK (
    is_system = false AND
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

DROP POLICY IF EXISTS recon_templates_delete ON public.recon_templates;
CREATE POLICY recon_templates_delete ON public.recon_templates
  FOR DELETE TO authenticated
  USING (
    is_system = false AND
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

-- Mapping Templates RLS
ALTER TABLE public.mapping_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mapping_templates_select ON public.mapping_templates;
CREATE POLICY mapping_templates_select ON public.mapping_templates
  FOR SELECT TO authenticated
  USING (
    is_public = true OR
    is_system = true OR
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

DROP POLICY IF EXISTS mapping_templates_insert ON public.mapping_templates;
CREATE POLICY mapping_templates_insert ON public.mapping_templates
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS mapping_templates_update ON public.mapping_templates;
CREATE POLICY mapping_templates_update ON public.mapping_templates
  FOR UPDATE TO authenticated
  USING (
    is_system = false AND
    tenant_id IN (SELECT public.get_user_tenant_ids())
  )
  WITH CHECK (
    is_system = false AND
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

-- Contract Versions RLS
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_versions_select ON public.contract_versions;
CREATE POLICY contract_versions_select ON public.contract_versions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS contract_versions_insert ON public.contract_versions;
CREATE POLICY contract_versions_insert ON public.contract_versions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS contract_versions_update ON public.contract_versions;
CREATE POLICY contract_versions_update ON public.contract_versions
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS contract_versions_delete ON public.contract_versions;
CREATE POLICY contract_versions_delete ON public.contract_versions
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- JobForge Jobs RLS
ALTER TABLE public.jobforge_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobforge_jobs_select ON public.jobforge_jobs;
CREATE POLICY jobforge_jobs_select ON public.jobforge_jobs
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS jobforge_jobs_insert ON public.jobforge_jobs;
CREATE POLICY jobforge_jobs_insert ON public.jobforge_jobs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS jobforge_jobs_update ON public.jobforge_jobs;
CREATE POLICY jobforge_jobs_update ON public.jobforge_jobs
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS jobforge_jobs_delete ON public.jobforge_jobs;
CREATE POLICY jobforge_jobs_delete ON public.jobforge_jobs
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- JobForge Job Results RLS
ALTER TABLE public.jobforge_job_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobforge_job_results_select ON public.jobforge_job_results;
CREATE POLICY jobforge_job_results_select ON public.jobforge_job_results
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Idempotency Keys RLS
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_idempotency_keys ON public.idempotency_keys;
CREATE POLICY tenant_isolation_idempotency_keys ON public.idempotency_keys
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS service_role_bypass_idempotency ON public.idempotency_keys;
CREATE POLICY service_role_bypass_idempotency ON public.idempotency_keys
    FOR ALL
    USING (current_user = 'service_role');

-- Ingestion DLQ RLS
ALTER TABLE public.ingestion_dlq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ingestion_dlq ON public.ingestion_dlq;
CREATE POLICY tenant_isolation_ingestion_dlq ON public.ingestion_dlq
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR tenant_id IS NULL
    );

DROP POLICY IF EXISTS service_role_bypass_dlq ON public.ingestion_dlq;
CREATE POLICY service_role_bypass_dlq ON public.ingestion_dlq
    FOR ALL
    USING (current_user = 'service_role');

-- Audit Logs RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_select_tenant ON public.audit_logs;
CREATE POLICY audit_logs_select_tenant ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR user_id = auth.uid()
  );

-- Feature Flags RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_select ON public.feature_flags;
CREATE POLICY feature_flags_select ON public.feature_flags
  FOR SELECT TO authenticated
  USING (
    is_global = true OR
    billing_account_id IN (
      SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Ingestion Sources RLS
ALTER TABLE public.ingestion_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ingestion_sources_select ON public.ingestion_sources;
CREATE POLICY ingestion_sources_select ON public.ingestion_sources
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS ingestion_sources_insert ON public.ingestion_sources;
CREATE POLICY ingestion_sources_insert ON public.ingestion_sources
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS ingestion_sources_update ON public.ingestion_sources;
CREATE POLICY ingestion_sources_update ON public.ingestion_sources
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Receipt Uploads RLS
ALTER TABLE public.receipt_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS receipt_uploads_select ON public.receipt_uploads;
CREATE POLICY receipt_uploads_select ON public.receipt_uploads
  FOR SELECT TO authenticated
  USING (
    billing_account_id IN (
      SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Receipts RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS receipts_select ON public.receipts;
CREATE POLICY receipts_select ON public.receipts
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR billing_account_id IN (
      SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Webhooks RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhooks_select ON public.webhooks;
CREATE POLICY webhooks_select ON public.webhooks
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS webhooks_insert ON public.webhooks;
CREATE POLICY webhooks_insert ON public.webhooks
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS webhooks_update ON public.webhooks;
CREATE POLICY webhooks_update ON public.webhooks
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS webhooks_delete ON public.webhooks;
CREATE POLICY webhooks_delete ON public.webhooks
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Exports RLS
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exports_select ON public.exports;
CREATE POLICY exports_select ON public.exports
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS exports_insert ON public.exports;
CREATE POLICY exports_insert ON public.exports
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Add-Ons RLS
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS add_ons_select ON public.add_ons;
CREATE POLICY add_ons_select ON public.add_ons
  FOR SELECT TO authenticated USING (is_active = true);

-- Add-On Purchases RLS
ALTER TABLE public.add_on_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS add_on_purchases_isolation ON public.add_on_purchases;
CREATE POLICY add_on_purchases_isolation ON public.add_on_purchases
  FOR ALL TO authenticated
  USING (billing_account_id IN (SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()))
  WITH CHECK (billing_account_id IN (SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()));

-- Stripe Events RLS
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stripe_events_isolation ON public.stripe_events;
CREATE POLICY stripe_events_isolation ON public.stripe_events
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Recon Audits RLS
ALTER TABLE public.recon_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_audits_isolation ON public.recon_audits;
CREATE POLICY recon_audits_isolation ON public.recon_audits
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Validation Rules RLS
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS validation_rules_isolation ON public.validation_rules;
CREATE POLICY validation_rules_isolation ON public.validation_rules
  FOR ALL TO authenticated
  USING (is_public = true OR is_system = true OR tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Transform Recipes RLS
ALTER TABLE public.transform_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transform_recipes_isolation ON public.transform_recipes;
CREATE POLICY transform_recipes_isolation ON public.transform_recipes
  FOR ALL TO authenticated
  USING (is_public = true OR is_system = true OR tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Drift Events RLS
ALTER TABLE public.drift_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS drift_events_isolation ON public.drift_events;
CREATE POLICY drift_events_isolation ON public.drift_events
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Connectors RLS
ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connectors_isolation ON public.connectors;
CREATE POLICY connectors_isolation ON public.connectors
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Connector Credentials RLS
ALTER TABLE public.connector_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connector_credentials_isolation ON public.connector_credentials;
CREATE POLICY connector_credentials_isolation ON public.connector_credentials
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Connector Accounts RLS
ALTER TABLE public.connector_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connector_accounts_isolation ON public.connector_accounts;
CREATE POLICY connector_accounts_isolation ON public.connector_accounts
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Sync Runs RLS
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sync_runs_isolation ON public.sync_runs;
CREATE POLICY sync_runs_isolation ON public.sync_runs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Sync Cursors RLS
ALTER TABLE public.sync_cursors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sync_cursors_isolation ON public.sync_cursors;
CREATE POLICY sync_cursors_isolation ON public.sync_cursors
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Financial Transactions RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_transactions_isolation ON public.financial_transactions;
CREATE POLICY financial_transactions_isolation ON public.financial_transactions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Financial Balances RLS
ALTER TABLE public.financial_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_balances_isolation ON public.financial_balances;
CREATE POLICY financial_balances_isolation ON public.financial_balances
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Financial Payouts RLS
ALTER TABLE public.financial_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_payouts_isolation ON public.financial_payouts;
CREATE POLICY financial_payouts_isolation ON public.financial_payouts
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Financial Invoices RLS
ALTER TABLE public.financial_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_invoices_isolation ON public.financial_invoices;
CREATE POLICY financial_invoices_isolation ON public.financial_invoices
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Financial Subscriptions RLS
ALTER TABLE public.financial_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_subscriptions_isolation ON public.financial_subscriptions;
CREATE POLICY financial_subscriptions_isolation ON public.financial_subscriptions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Financial Tax Estimates RLS
ALTER TABLE public.financial_tax_estimates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_tax_estimates_isolation ON public.financial_tax_estimates;
CREATE POLICY financial_tax_estimates_isolation ON public.financial_tax_estimates
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Raw Events RLS
ALTER TABLE public.raw_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS raw_events_isolation ON public.raw_events;
CREATE POLICY raw_events_isolation ON public.raw_events
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Webhook Events RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS webhook_events_isolation ON public.webhook_events;
CREATE POLICY webhook_events_isolation ON public.webhook_events
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Ingestions RLS
ALTER TABLE public.ingestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ingestions_isolation ON public.ingestions;
CREATE POLICY ingestions_isolation ON public.ingestions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Raw Records RLS
ALTER TABLE public.raw_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS raw_records_isolation ON public.raw_records;
CREATE POLICY raw_records_isolation ON public.raw_records
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Normalized Transactions RLS
ALTER TABLE public.normalized_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS normalized_transactions_isolation ON public.normalized_transactions;
CREATE POLICY normalized_transactions_isolation ON public.normalized_transactions
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Reconciliation Runs RLS
ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reconciliation_runs_isolation ON public.reconciliation_runs;
CREATE POLICY reconciliation_runs_isolation ON public.reconciliation_runs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Reconciliation Matches RLS
ALTER TABLE public.reconciliation_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reconciliation_matches_isolation ON public.reconciliation_matches;
CREATE POLICY reconciliation_matches_isolation ON public.reconciliation_matches
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- JobForge Job Attempts RLS
ALTER TABLE public.jobforge_job_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jobforge_job_attempts_isolation ON public.jobforge_job_attempts;
CREATE POLICY jobforge_job_attempts_isolation ON public.jobforge_job_attempts
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- JobForge Connector Configs RLS
ALTER TABLE public.jobforge_connector_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jobforge_connector_configs_isolation ON public.jobforge_connector_configs;
CREATE POLICY jobforge_connector_configs_isolation ON public.jobforge_connector_configs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Receipt Items RLS
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS receipt_items_isolation ON public.receipt_items;
CREATE POLICY receipt_items_isolation ON public.receipt_items
  FOR ALL TO authenticated
  USING (receipt_id IN (SELECT id FROM public.receipts WHERE tenant_id IN (SELECT public.get_user_tenant_ids())))
  WITH CHECK (receipt_id IN (SELECT id FROM public.receipts WHERE tenant_id IN (SELECT public.get_user_tenant_ids())));

-- Feature Flag Environments RLS
ALTER TABLE public.feature_flag_environments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feature_flag_environments_isolation ON public.feature_flag_environments;
CREATE POLICY feature_flag_environments_isolation ON public.feature_flag_environments
  FOR ALL TO authenticated
  USING (flag_id IN (SELECT id FROM public.feature_flags WHERE is_global = true OR billing_account_id IN (SELECT id FROM public.billing_accounts WHERE user_id = auth.uid())))
  WITH CHECK (flag_id IN (SELECT id FROM public.feature_flags WHERE is_global = true OR billing_account_id IN (SELECT id FROM public.billing_accounts WHERE user_id = auth.uid())));

-- Feature Flag Overrides RLS
ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feature_flag_overrides_isolation ON public.feature_flag_overrides;
CREATE POLICY feature_flag_overrides_isolation ON public.feature_flag_overrides
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Webhook Deliveries RLS
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS webhook_deliveries_isolation ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_isolation ON public.webhook_deliveries
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Operator Infrastructure Settings RLS
ALTER TABLE public.operator_infrastructure_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS operator_infrastructure_settings_isolation ON public.operator_infrastructure_settings;
CREATE POLICY operator_infrastructure_settings_isolation ON public.operator_infrastructure_settings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- System Incidents RLS
ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS system_incidents_isolation ON public.system_incidents;
CREATE POLICY system_incidents_isolation ON public.system_incidents
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Audit Notarization Checkpoints RLS
ALTER TABLE public.audit_notarization_checkpoints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_notarization_checkpoints_isolation ON public.audit_notarization_checkpoints;
CREATE POLICY audit_notarization_checkpoints_isolation ON public.audit_notarization_checkpoints
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- API Call Logs RLS
ALTER TABLE public.api_call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS api_call_logs_isolation ON public.api_call_logs;
CREATE POLICY api_call_logs_isolation ON public.api_call_logs
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Run Snapshots RLS
ALTER TABLE public.run_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS run_snapshots_isolation ON public.run_snapshots;
CREATE POLICY run_snapshots_isolation ON public.run_snapshots
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- Execution Provenance RLS
ALTER TABLE public.execution_provenance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS execution_provenance_isolation ON public.execution_provenance;
CREATE POLICY execution_provenance_isolation ON public.execution_provenance
  FOR ALL TO authenticated
  USING (snapshot_id IN (SELECT id FROM public.run_snapshots WHERE tenant_id IN (SELECT public.get_user_tenant_ids())))
  WITH CHECK (snapshot_id IN (SELECT id FROM public.run_snapshots WHERE tenant_id IN (SELECT public.get_user_tenant_ids())));

-- Deterministic Match Results RLS
ALTER TABLE public.deterministic_match_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deterministic_match_results_isolation ON public.deterministic_match_results;
CREATE POLICY deterministic_match_results_isolation ON public.deterministic_match_results
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_tenant_context(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compute_audit_notarization_hash(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.write_audit_notarization_checkpoint(integer) TO service_role;

COMMIT;

-- ============================================================================
-- END OF CONSOLIDATED BASELINE MIGRATION
-- ============================================================================
