-- ============================================================================
-- REALITY SYSTEM - CANONICAL DATA LAYER
-- Created: 2026-02-03 00:00:00 UTC
-- Description: Single source of truth for all reality metrics, events, and snapshots
-- This is the foundation of the Reality System - all dashboards read from here
-- ============================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- REALITY METRICS TABLE
-- Single source of truth for all metrics (revenue, users, tenant isolation, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'revenue', 'user', 'tenant_isolation', 'failure', 'deployment', 'gtm', 'admin'
  name VARCHAR(255) NOT NULL, -- e.g., 'mrr', 'dau', 'rls_violations', 'safe_mode_activations'
  value JSONB NOT NULL, -- Flexible value storage (number, string, object)
  status VARCHAR(50) NOT NULL DEFAULT 'assumed', -- 'proven', 'assumed', 'broken'
  source VARCHAR(255) NOT NULL, -- Where this metric comes from (table, API, calculation)
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one metric per category+name combination
  UNIQUE(category, name)
);

CREATE INDEX idx_reality_metrics_category ON reality_metrics(category);
CREATE INDEX idx_reality_metrics_name ON reality_metrics(name);
CREATE INDEX idx_reality_metrics_status ON reality_metrics(status);
CREATE INDEX idx_reality_metrics_last_updated ON reality_metrics(last_updated DESC);
CREATE INDEX idx_reality_metrics_category_status ON reality_metrics(category, status);

COMMENT ON TABLE reality_metrics IS 'Canonical source of truth for all reality metrics. All dashboards read from here.';
COMMENT ON COLUMN reality_metrics.status IS 'proven = backed by real data, assumed = estimated/placeholder, broken = data source failed';

-- ============================================================================
-- REALITY EVENTS TABLE
-- Events that impact reality (failures, attacks, deployments, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reality_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'failure', 'security', 'deployment', 'billing', 'user', etc.
  event_name VARCHAR(255) NOT NULL, -- e.g., 'safe_mode_activated', 'rls_violation_blocked', 'deployment_succeeded'
  severity VARCHAR(50) NOT NULL DEFAULT 'info', -- 'critical', 'warning', 'info'
  meta JSONB DEFAULT '{}'::jsonb, -- Event-specific data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reality_events_category ON reality_events(category);
CREATE INDEX idx_reality_events_event_name ON reality_events(event_name);
CREATE INDEX idx_reality_events_severity ON reality_events(severity);
CREATE INDEX idx_reality_events_created_at ON reality_events(created_at DESC);
CREATE INDEX idx_reality_events_category_severity ON reality_events(category, severity);

COMMENT ON TABLE reality_events IS 'Canonical log of all reality-impacting events';

-- ============================================================================
-- AUDIT LOG TABLE (Enhanced for Reality System)
-- Already exists but we'll ensure it has the right structure
-- ============================================================================

-- Check if audit_logs exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID,
      actor_id UUID, -- user_id or system identifier
      action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'read', 'execute', etc.
      target VARCHAR(255) NOT NULL, -- Resource type and ID (e.g., 'subscription:uuid', 'user:uuid')
      meta JSONB DEFAULT '{}'::jsonb, -- Additional context
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
    CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
    CREATE INDEX idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX idx_audit_logs_target ON audit_logs(target);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
  END IF;
END $$;

COMMENT ON TABLE audit_logs IS 'Canonical audit trail for all actions in the system';

-- ============================================================================
-- WEEKLY SNAPSHOTS TABLE
-- Weekly snapshots of reality metrics for trend analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL, -- Monday of the week
  summary JSONB NOT NULL, -- Full snapshot of all metrics at this point
  metrics_snapshot JSONB NOT NULL, -- Array of all reality_metrics at snapshot time
  events_summary JSONB DEFAULT '{}'::jsonb, -- Summary of events during the week
  delta_summary JSONB DEFAULT '{}'::jsonb, -- Week-over-week changes
  risks JSONB DEFAULT '[]'::jsonb, -- Array of identified risks
  required_actions JSONB DEFAULT '[]'::jsonb, -- Actions required for next week
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(week_start)
);

CREATE INDEX idx_weekly_snapshots_week_start ON weekly_snapshots(week_start DESC);
CREATE INDEX idx_weekly_snapshots_created_at ON weekly_snapshots(created_at DESC);

COMMENT ON TABLE weekly_snapshots IS 'Weekly snapshots of reality state for trend analysis and reporting';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to upsert a reality metric
CREATE OR REPLACE FUNCTION upsert_reality_metric(
  p_category VARCHAR,
  p_name VARCHAR,
  p_value JSONB,
  p_status VARCHAR DEFAULT 'assumed',
  p_source VARCHAR DEFAULT 'manual',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO reality_metrics (category, name, value, status, source, metadata, last_updated)
  VALUES (p_category, p_name, p_value, p_status, p_source, p_metadata, NOW())
  ON CONFLICT (category, name)
  DO UPDATE SET
    value = EXCLUDED.value,
    status = EXCLUDED.status,
    source = EXCLUDED.source,
    metadata = EXCLUDED.metadata,
    last_updated = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record a reality event
CREATE OR REPLACE FUNCTION record_reality_event(
  p_category VARCHAR,
  p_event_name VARCHAR,
  p_severity VARCHAR DEFAULT 'info',
  p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO reality_events (category, event_name, severity, meta)
  VALUES (p_category, p_event_name, p_severity, p_meta)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get metric value (convenience)
CREATE OR REPLACE FUNCTION get_reality_metric(
  p_category VARCHAR,
  p_name VARCHAR
) RETURNS JSONB AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM reality_metrics
  WHERE category = p_category AND name = p_name;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql;

-- Function to check if metric is proven
CREATE OR REPLACE FUNCTION is_metric_proven(
  p_category VARCHAR,
  p_name VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_status VARCHAR;
BEGIN
  SELECT status INTO v_status
  FROM reality_metrics
  WHERE category = p_category AND name = p_name;
  
  RETURN COALESCE(v_status = 'proven', false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL METRICS (Placeholders - will be updated by reality collectors)
-- ============================================================================

-- Revenue Reality
INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('revenue', 'active_subscriptions', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('revenue', 'mrr', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('revenue', 'failed_payments_7d', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('revenue', 'failed_payments_30d', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('revenue', 'churn', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

-- User Reality
INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('user', 'dau', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('user', 'wau', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('user', 'time_to_first_value_median', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('user', 'onboarding_completion_rate', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('user', 'abandonment_count', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('user', 'rage_click_count', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

-- Tenant Isolation Reality
INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('tenant_isolation', 'blocked_cross_tenant_attempts', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('tenant_isolation', 'rls_violations', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('tenant_isolation', 'last_attack_test_timestamp', 'null'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

-- Failure & Resilience Reality
INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('failure', 'safe_mode_activations', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('failure', 'degraded_renders', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('failure', 'hard_500_count', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('failure', 'last_failure_injection_result', 'null'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

-- Deployment Reality
INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('deployment', 'active_deploy_targets', '[]'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('deployment', 'last_non_primary_deploy_success', 'null'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('deployment', 'build_reproducibility_flag', 'false'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

-- GTM Reality
INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('gtm', 'pricing_page_views', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('gtm', 'cta_clicks', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('gtm', 'leads', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('gtm', 'conversions', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

-- Admin Independence Reality
INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('admin', 'operations_via_ui_percent', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('admin', 'founder_only_actions_count', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO reality_metrics (category, name, value, status, source) VALUES
  ('admin', 'automation_coverage_percent', '0'::jsonb, 'assumed', 'manual')
ON CONFLICT (category, name) DO NOTHING;

COMMIT;
