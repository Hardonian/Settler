-- Migration: console_activity_logging
-- Created: 2026-01-25 00:00:01 UTC
-- Description: Activity logging table for Console live feed and audit trail

BEGIN;

-- ============================================================================
-- CONSOLE ACTIVITY LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS console_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'reconcile', 'receipt', 'flag', 'api_key', 'usage', etc.
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'executed', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'success', -- 'success', 'processing', 'failed'
  metadata JSONB DEFAULT '{}'::jsonb,
  resource_id UUID, -- ID of the resource (api_key_id, receipt_id, flag_id, etc.)
  resource_type VARCHAR(50), -- 'api_key', 'receipt', 'feature_flag', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes conditionally to avoid duplicates
-- Note: Cannot use NOW() in index predicate (not IMMUTABLE), so filter by created_at in queries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'console_activities') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'console_activities' AND column_name = 'user_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_user_id') THEN
        EXECUTE 'CREATE INDEX idx_console_activities_user_id ON console_activities(user_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'console_activities' AND column_name = 'billing_account_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_billing_account_id') THEN
        EXECUTE 'CREATE INDEX idx_console_activities_billing_account_id ON console_activities(billing_account_id)';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'console_activities' AND column_name = 'created_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_created_at') THEN
          EXECUTE 'CREATE INDEX idx_console_activities_created_at ON console_activities(billing_account_id, created_at DESC)';
        END IF;
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'console_activities' AND column_name = 'tenant_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_tenant_id') THEN
        EXECUTE 'CREATE INDEX idx_console_activities_tenant_id ON console_activities(tenant_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'console_activities' AND column_name = 'activity_type') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_type') THEN
        EXECUTE 'CREATE INDEX idx_console_activities_type ON console_activities(activity_type)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'console_activities' AND column_name = 'status') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_status') THEN
        EXECUTE 'CREATE INDEX idx_console_activities_status ON console_activities(status)';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE console_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own activities
DROP POLICY IF EXISTS console_activities_user_access ON console_activities;
CREATE POLICY console_activities_user_access ON console_activities
  FOR SELECT USING (
    user_id = current_user_id()
    OR
    (billing_account_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = console_activities.billing_account_id
        AND ba.user_id = current_user_id()
    ))
  );

-- Policy: Users can insert their own activities
DROP POLICY IF EXISTS console_activities_user_insert ON console_activities;
CREATE POLICY console_activities_user_insert ON console_activities
  FOR INSERT WITH CHECK (
    user_id = current_user_id()
  );

-- ============================================================================
-- FUNCTION: Log Console Activity
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

-- ============================================================================
-- FUNCTION: Get Recent Activities
-- ============================================================================

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

COMMIT;
