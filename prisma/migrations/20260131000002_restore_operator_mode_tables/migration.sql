-- Restore operator-mode tables lost when the monolithic golden schema was
-- consolidated. Source: supabase/migrations/_archive/20260131000001_operator_mode.sql
-- (its tables were never included in the consolidated baseline; verified missing
-- from the live database 2026-10-02). All six tables are referenced by code:
--   packages/api/src/routes/alerts.ts, services/operator-mode/{backups,cost-controls,kill-switches}.ts,
--   packages/api/src/db/index.ts, __tests__/operator-mode-verification.test.ts
-- Additive, idempotent (IF NOT EXISTS / guarded).
--
-- Deviation from the archived original: alert_history gains a tenant_id column.
-- The code contract requires it (queryWithTenant scoping in routes/alerts.ts and
-- operator-mode-verification.test.ts asserts alert_history.tenant_id).

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
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

CREATE TABLE IF NOT EXISTS tenant_usage_ceilings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  usage_type VARCHAR(50) NOT NULL,
  monthly_limit DECIMAL(15, 2) NOT NULL,
  reset_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_ceilings_tenant_id ON tenant_usage_ceilings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_ceilings_billing_account_id ON tenant_usage_ceilings(billing_account_id);

CREATE TABLE IF NOT EXISTS background_job_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL UNIQUE,
  max_concurrent INTEGER NOT NULL DEFAULT 10,
  max_per_tenant INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_background_job_limits_job_type ON background_job_limits(job_type);

CREATE TABLE IF NOT EXISTS kill_switches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  target VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kill_switches_type ON kill_switches(type);
CREATE INDEX IF NOT EXISTS idx_kill_switches_target ON kill_switches(target);
CREATE INDEX IF NOT EXISTS idx_kill_switches_enabled ON kill_switches(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_kill_switches_type_target ON kill_switches(type, target);

CREATE TABLE IF NOT EXISTS backup_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  size_bytes BIGINT,
  status VARCHAR(50) DEFAULT 'pending',
  restore_tested BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records(created_at DESC);

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
