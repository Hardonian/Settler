-- Migration: error_logs
-- Created: 2025-11-29
-- Description: Error logging table for monitoring and debugging
-- Support Mode: Root Cause Analysis

BEGIN;

-- ============================================================================
-- ERROR LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  error_type VARCHAR(100) NOT NULL, -- 'application', 'database', 'external_api', 'validation'
  severity VARCHAR(20) NOT NULL DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}'::jsonb, -- Request context, user info, etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  request_id VARCHAR(255), -- For tracing requests across services
  url TEXT,
  method VARCHAR(10),
  status_code INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_error_logs_tenant_id ON error_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_request_id ON error_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON error_logs(tenant_id, created_at DESC) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_error_logs_context_gin ON error_logs USING GIN (context);

-- ============================================================================
-- FUNCTION: Log error with context
-- ============================================================================

CREATE OR REPLACE FUNCTION log_error(
  p_tenant_id UUID,
  p_error_type VARCHAR(100),
  p_severity VARCHAR(20),
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_user_id UUID DEFAULT NULL,
  p_api_key_id UUID DEFAULT NULL,
  p_request_id VARCHAR(255) DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_method VARCHAR(10) DEFAULT NULL,
  p_status_code INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO error_logs (
    tenant_id,
    error_type,
    severity,
    message,
    stack_trace,
    context,
    user_id,
    api_key_id,
    request_id,
    url,
    method,
    status_code
  ) VALUES (
    p_tenant_id,
    p_error_type,
    p_severity,
    p_message,
    p_stack_trace,
    p_context,
    p_user_id,
    p_api_key_id,
    p_request_id,
    p_url,
    p_method,
    p_status_code
  ) RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Users can view error logs for their tenant
CREATE POLICY "Users can view error logs for their tenant"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = error_logs.tenant_id
    )
  );

-- Only admins can mark errors as resolved
CREATE POLICY "Admins can update error logs"
  ON error_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = error_logs.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

COMMIT;
