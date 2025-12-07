-- Migration: usage_tracking
-- Created: 2026-01-15
-- Description: Add usage tracking table for quota enforcement

BEGIN;

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, metric_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_tenant_id ON usage_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_type ON usage_tracking(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, metric_type, period_start DESC);

COMMENT ON TABLE usage_tracking IS 'Tracks user usage for quota enforcement and upgrade nudges';
COMMENT ON COLUMN usage_tracking.metric_type IS 'Type of metric (reconciliations, exports, playground_runs)';
COMMENT ON COLUMN usage_tracking.metric_value IS 'Current usage value for the period';

COMMIT;
