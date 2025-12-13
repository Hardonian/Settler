-- Migration: console_complete_setup
-- Created: 2026-01-26 00:00:00 UTC
-- Description: Complete console setup - ensures all tables, functions, and RLS policies exist
-- This migration consolidates all console-related schema requirements

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTIONS (Create/Replace)
-- ============================================================================

-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get current tenant ID
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- RECEIPTS TABLES (Receipts API)
-- ============================================================================

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
-- FEATURE FLAGS TABLES (Feature Flags API)
-- ============================================================================

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
-- TENANT BRANDING & NAVIGATION TABLES (Site Builder)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#7c3aed',
  accent_color VARCHAR(7) DEFAULT '#06b6d4',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  borderRadius_scale DECIMAL(3, 2),
  font_family_primary VARCHAR(100),
  font_family_secondary VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_branding_tenant_id ON tenant_branding(tenant_id);

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

CREATE TABLE IF NOT EXISTS tenant_page_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_page_id UUID NOT NULL REFERENCES tenant_pages(id) ON DELETE CASCADE,
  editor_user_id UUID,
  snapshot JSONB NOT NULL,
  comment TEXT,
  approved_by_user_id UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_tenant_page_id ON tenant_page_revisions(tenant_page_id);
CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_editor_user_id ON tenant_page_revisions(editor_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_approved_by_user_id ON tenant_page_revisions(approved_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_page_revisions_created_at ON tenant_page_revisions(created_at DESC);

-- ============================================================================
-- EXPERIMENTS TABLES (A/B Testing)
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS experiment_metric_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_key VARCHAR(100) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES tenant_pages(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  session_id VARCHAR(255),
  user_id UUID,
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
-- WEBHOOKS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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
-- IDEMPOTENCY KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status ON idempotency_keys(status);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- ============================================================================
-- STRIPE EVENTS TABLE (if not exists from billing migration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'received',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT,
  user_id UUID,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
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

-- ============================================================================
-- CONSOLE ACTIVITIES TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS console_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'success',
  metadata JSONB DEFAULT '{}'::jsonb,
  resource_id UUID,
  resource_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_console_activities_user_id ON console_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_console_activities_billing_account_id ON console_activities(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_console_activities_tenant_id ON console_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_console_activities_type ON console_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_console_activities_status ON console_activities(status);
CREATE INDEX IF NOT EXISTS idx_console_activities_billing_account_created_at ON console_activities(billing_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_console_activities_recent ON console_activities(billing_account_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE receipt_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_metric_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE console_activities ENABLE ROW LEVEL SECURITY;

-- Receipts RLS Policies
DROP POLICY IF EXISTS receipt_uploads_user_access ON receipt_uploads;
CREATE POLICY receipt_uploads_user_access ON receipt_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = receipt_uploads.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS receipts_user_access ON receipts;
CREATE POLICY receipts_user_access ON receipts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM receipt_uploads ru
      JOIN billing_accounts ba ON ba.id = ru.billing_account_id
      WHERE ru.id = receipts.upload_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS receipt_items_user_access ON receipt_items;
CREATE POLICY receipt_items_user_access ON receipt_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM receipts r
      JOIN receipt_uploads ru ON ru.id = r.upload_id
      JOIN billing_accounts ba ON ba.id = ru.billing_account_id
      WHERE r.id = receipt_items.receipt_id
        AND ba.user_id = current_user_id()
    )
  );

-- Feature Flags RLS Policies
DROP POLICY IF EXISTS feature_flags_user_access ON feature_flags;
CREATE POLICY feature_flags_user_access ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = feature_flags.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS feature_flag_environments_user_access ON feature_flag_environments;
CREATE POLICY feature_flag_environments_user_access ON feature_flag_environments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM feature_flags ff
      JOIN billing_accounts ba ON ba.id = ff.billing_account_id
      WHERE ff.id = feature_flag_environments.flag_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS feature_flag_overrides_user_access ON feature_flag_overrides;
CREATE POLICY feature_flag_overrides_user_access ON feature_flag_overrides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM feature_flags ff
      JOIN billing_accounts ba ON ba.id = ff.billing_account_id
      WHERE ff.id = feature_flag_overrides.flag_id
        AND ba.user_id = current_user_id()
    )
  );

-- Tenant Branding/Navigation/Pages RLS Policies
DROP POLICY IF EXISTS tenant_branding_user_access ON tenant_branding;
CREATE POLICY tenant_branding_user_access ON tenant_branding
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = tenant_branding.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS tenant_navigation_user_access ON tenant_navigation;
CREATE POLICY tenant_navigation_user_access ON tenant_navigation
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = tenant_navigation.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS tenant_pages_user_access ON tenant_pages;
CREATE POLICY tenant_pages_user_access ON tenant_pages
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = tenant_pages.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS tenant_page_revisions_user_access ON tenant_page_revisions;
CREATE POLICY tenant_page_revisions_user_access ON tenant_page_revisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_pages tp
      JOIN tenants t ON t.id = tp.tenant_id
      JOIN billing_accounts ba ON ba.id = t.billing_account_id
      WHERE tp.id = tenant_page_revisions.tenant_page_id
        AND ba.user_id = current_user_id()
    )
  );

-- Experiments RLS Policies
DROP POLICY IF EXISTS experiments_user_access ON experiments;
CREATE POLICY experiments_user_access ON experiments
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = experiments.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS experiment_variants_user_access ON experiment_variants;
CREATE POLICY experiment_variants_user_access ON experiment_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM experiments e
      JOIN tenants t ON t.id = e.tenant_id
      JOIN billing_accounts ba ON ba.id = t.billing_account_id
      WHERE e.id = experiment_variants.experiment_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS experiment_metric_events_user_access ON experiment_metric_events;
CREATE POLICY experiment_metric_events_user_access ON experiment_metric_events
  FOR ALL USING (
    tenant_id = current_tenant_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      JOIN tenants t ON t.billing_account_id = ba.id
      WHERE t.id = experiment_metric_events.tenant_id
        AND ba.user_id = current_user_id()
    )
  );

-- Webhooks RLS Policies
DROP POLICY IF EXISTS webhooks_user_access ON webhooks;
CREATE POLICY webhooks_user_access ON webhooks
  FOR ALL USING (
    user_id = current_user_id()
    OR (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
  );

DROP POLICY IF EXISTS webhook_deliveries_user_access ON webhook_deliveries;
CREATE POLICY webhook_deliveries_user_access ON webhook_deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_deliveries.webhook_id
        AND (
          w.user_id = current_user_id()
          OR (w.tenant_id IS NOT NULL AND w.tenant_id = current_tenant_id())
        )
    )
  );

-- Idempotency Keys RLS Policies (public read for idempotency checks)
DROP POLICY IF EXISTS idempotency_keys_user_access ON idempotency_keys;
CREATE POLICY idempotency_keys_user_access ON idempotency_keys
  FOR ALL USING (true); -- Idempotency keys are public for API key auth

-- Stripe Events RLS Policies
DROP POLICY IF EXISTS stripe_events_user_access ON stripe_events;
CREATE POLICY stripe_events_user_access ON stripe_events
  FOR ALL USING (
    user_id = current_user_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = stripe_events.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

-- Console Activities RLS Policies
DROP POLICY IF EXISTS console_activities_user_access ON console_activities;
CREATE POLICY console_activities_user_access ON console_activities
  FOR SELECT USING (
    user_id = current_user_id()
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = console_activities.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS console_activities_user_insert ON console_activities;
CREATE POLICY console_activities_user_insert ON console_activities
  FOR INSERT WITH CHECK (
    user_id = current_user_id()
  );

-- ============================================================================
-- CONSOLE ACTIVITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_console_activity(
  p_user_id UUID,
  p_billing_account_id UUID,
  p_activity_type VARCHAR,
  p_action VARCHAR,
  p_title VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_resource_id UUID DEFAULT NULL,
  p_resource_type VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from billing account
  SELECT tenant_id INTO v_tenant_id
  FROM billing_accounts
  WHERE id = p_billing_account_id;
  
  -- Insert activity
  INSERT INTO console_activities (
    user_id,
    billing_account_id,
    tenant_id,
    activity_type,
    action,
    title,
    description,
    status,
    metadata,
    resource_id,
    resource_type
  ) VALUES (
    p_user_id,
    p_billing_account_id,
    v_tenant_id,
    p_activity_type,
    p_action,
    p_title,
    p_description,
    p_status,
    p_metadata,
    p_resource_id,
    p_resource_type
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_recent_console_activities(
  p_billing_account_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  activity_type VARCHAR,
  action VARCHAR,
  title VARCHAR,
  status VARCHAR,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.activity_type,
    ca.action,
    ca.title,
    ca.status,
    ca.metadata,
    ca.created_at
  FROM console_activities ca
  WHERE ca.billing_account_id = p_billing_account_id
    AND ca.user_id = current_user_id()
  ORDER BY ca.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENSURE API_KEYS TABLE HAS PROPER RLS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_keys') THEN
    ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS api_keys_user_access ON api_keys;
    CREATE POLICY api_keys_user_access ON api_keys
      FOR ALL USING (
        user_id = current_user_id()
        OR (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
      );
  END IF;
END $$;

-- ============================================================================
-- ENSURE BILLING_ACCOUNTS TABLE HAS PROPER RLS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'billing_accounts') THEN
    ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS billing_accounts_user_access ON billing_accounts;
    CREATE POLICY billing_accounts_user_access ON billing_accounts
      FOR ALL USING (
        user_id = current_user_id()
        OR (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
      );
  END IF;
END $$;

-- ============================================================================
-- ENSURE USAGE_EVENTS TABLE HAS PROPER RLS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_events') THEN
    ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS usage_events_billing_account_access ON usage_events;
    CREATE POLICY usage_events_billing_account_access ON usage_events
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM billing_accounts ba
          WHERE ba.id = usage_events.billing_account_id
            AND (
              ba.user_id = current_user_id()
              OR (ba.tenant_id IS NOT NULL AND ba.tenant_id = current_tenant_id())
            )
        )
      );
  END IF;
END $$;

COMMIT;
