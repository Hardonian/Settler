-- Migration: Operator Mode Infrastructure
-- Created: 2026-01-31
-- Description: Tables and functions for operator mode (daily intelligence, alerts, cost controls, kill switches, backups)

BEGIN;

-- ============================================================================
-- ALERT RULES TABLE (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  metric VARCHAR(100) NOT NULL, -- 'error_rate', 'slow_endpoint', 'failed_ingestion', 'billing_anomaly', 'usage_limit'
  threshold DECIMAL(15, 6) NOT NULL,
  operator VARCHAR(10) NOT NULL, -- 'gt', 'gte', 'lt', 'lte', 'eq', 'neq'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  channels TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'email', 'slack', 'webhook'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_metric ON alert_rules(metric);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = true;

-- ============================================================================
-- ALERT HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  metric VARCHAR(100) NOT NULL,
  value DECIMAL(15, 6) NOT NULL,
  threshold DECIMAL(15, 6) NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  trace_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_alert_history_rule_id ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_resolved_at ON alert_history(resolved_at) WHERE resolved_at IS NULL;

-- ============================================================================
-- TENANT USAGE CEILINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_usage_ceilings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  usage_type VARCHAR(50) NOT NULL, -- 'ingestions', 'reconciliations', 'api_requests', 'storage'
  monthly_limit DECIMAL(15, 2) NOT NULL,
  reset_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, usage_type)
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_ceilings_tenant_id ON tenant_usage_ceilings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_ceilings_billing_account_id ON tenant_usage_ceilings(billing_account_id);

-- ============================================================================
-- BACKGROUND JOB LIMITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS background_job_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL UNIQUE, -- 'ingestion', 'reconciliation', 'webhook', 'export'
  max_concurrent INTEGER NOT NULL DEFAULT 10,
  max_per_tenant INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_background_job_limits_job_type ON background_job_limits(job_type);

-- Insert default limits
INSERT INTO background_job_limits (job_type, max_concurrent, max_per_tenant) VALUES
  ('ingestion', 20, 10),
  ('reconciliation', 10, 5),
  ('webhook', 50, 20),
  ('export', 5, 2)
ON CONFLICT (job_type) DO NOTHING;

-- ============================================================================
-- KILL SWITCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS kill_switches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- 'connector', 'background_job', 'feature', 'endpoint'
  target VARCHAR(255) NOT NULL, -- connector type, job type, feature name, or endpoint path
  enabled BOOLEAN DEFAULT false, -- true = kill switch active (disabled/paused)
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kill_switches_type ON kill_switches(type);
CREATE INDEX IF NOT EXISTS idx_kill_switches_target ON kill_switches(target);
CREATE INDEX IF NOT EXISTS idx_kill_switches_enabled ON kill_switches(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_kill_switches_type_target ON kill_switches(type, target);

-- ============================================================================
-- BACKUP RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS backup_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  size_bytes BIGINT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'verified'
  restore_tested BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records(created_at DESC);

-- ============================================================================
-- DAILY INTELLIGENCE TABLE (for caching)
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  error_rate_overall DECIMAL(5, 4),
  slow_endpoints JSONB DEFAULT '[]'::jsonb,
  failed_ingestions JSONB DEFAULT '[]'::jsonb,
  billing_anomalies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_intelligence_date ON daily_intelligence(date DESC);

COMMIT;
