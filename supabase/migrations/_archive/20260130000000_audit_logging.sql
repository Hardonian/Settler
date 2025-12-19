-- Migration: audit_logging
-- Created: 2026-01-30 00:00:00 UTC
-- Description: Audit log table for tracking billing changes, settings changes, and ingestion events

BEGIN;

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'billing_change', 'settings_change', 'ingestion_event', etc.
  entity_type VARCHAR(100), -- 'subscription', 'billing_account', 'settings', etc.
  entity_id UUID,
  changes JSONB,
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  user_agent TEXT,
  trace_id VARCHAR(64), -- Correlation ID for request tracing
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_billing_account_id ON audit_log(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_trace_id ON audit_log(trace_id);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_action_created ON audit_log(tenant_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_billing_action_created ON audit_log(billing_account_id, action, created_at DESC);

-- ============================================================================
-- FUNCTION: Log audit entry
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_entry(
  p_tenant_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_billing_account_id UUID DEFAULT NULL,
  p_action VARCHAR,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_trace_id VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_log (
    tenant_id,
    user_id,
    billing_account_id,
    action,
    entity_type,
    entity_id,
    changes,
    before_state,
    after_state,
    ip_address,
    user_agent,
    trace_id,
    metadata
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_billing_account_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_changes,
    p_before_state,
    p_after_state,
    p_ip_address,
    p_user_agent,
    p_trace_id,
    p_metadata
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can read all audit logs
CREATE POLICY "Service role can read all audit logs"
  ON audit_log FOR SELECT
  USING (auth.role() = 'service_role');

-- Users can read their own tenant's audit logs
CREATE POLICY "Users can read their tenant's audit logs"
  ON audit_log FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Users cannot directly insert audit logs (must use function)
CREATE POLICY "Users cannot directly insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (false);

COMMIT;
