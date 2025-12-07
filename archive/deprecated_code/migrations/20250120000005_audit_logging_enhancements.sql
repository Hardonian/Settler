-- Migration: audit_logging_enhancements
-- Created: 2025-01-20 00:00:05 UTC
-- Description: Enhanced audit logging for compliance (GDPR, SOC2-lite)
-- Priority: P1 (High - Compliance)

BEGIN;

-- ============================================================================
-- ENHANCED AUDIT LOGS TABLE
-- ============================================================================

-- Add additional columns to existing audit_logs table if they don't exist
DO $$
BEGIN
  -- Add billing_account_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'billing_account_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_audit_logs_billing_account_id ON audit_logs(billing_account_id);
  END IF;

  -- Add integration_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'integration_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN integration_id VARCHAR(100);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_integration_id ON audit_logs(integration_id);
  END IF;

  -- Add action_type if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'action_type'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN action_type VARCHAR(50); -- 'create', 'update', 'delete', 'read', 'export'
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
  END IF;

  -- Add resource_type if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'resource_type'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_type VARCHAR(100); -- 'billing_account', 'subscription', 'usage_event', etc.
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
  END IF;

  -- Add resource_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_id UUID;
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
  END IF;
END $$;

-- ============================================================================
-- FUNCTION: Log audit event
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_tenant_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_api_key_id UUID DEFAULT NULL,
  p_event VARCHAR(100),
  p_action_type VARCHAR(50) DEFAULT NULL,
  p_resource_type VARCHAR(100) DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_billing_account_id UUID DEFAULT NULL,
  p_integration_id VARCHAR(100) DEFAULT NULL,
  p_ip VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_method VARCHAR(10) DEFAULT NULL,
  p_path VARCHAR(500) DEFAULT NULL,
  p_status_code INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    tenant_id,
    user_id,
    api_key_id,
    event,
    action_type,
    resource_type,
    resource_id,
    billing_account_id,
    integration_id,
    ip,
    user_agent,
    method,
    path,
    status_code,
    metadata,
    timestamp
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_api_key_id,
    p_event,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_billing_account_id,
    p_integration_id,
    p_ip,
    p_user_agent,
    p_method,
    p_path,
    p_status_code,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- ============================================================================
-- TRIGGERS: Auto-log billing changes
-- ============================================================================

-- Function to log billing account changes
CREATE OR REPLACE FUNCTION audit_billing_account_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current user from JWT (if available)
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Log the change
  PERFORM log_audit_event(
    p_tenant_id => v_tenant_id,
    p_user_id => v_user_id,
    p_event => CASE
      WHEN TG_OP = 'INSERT' THEN 'billing_account.created'
      WHEN TG_OP = 'UPDATE' THEN 'billing_account.updated'
      WHEN TG_OP = 'DELETE' THEN 'billing_account.deleted'
    END,
    p_action_type => LOWER(TG_OP),
    p_resource_type => 'billing_account',
    p_resource_id => COALESCE(NEW.id, OLD.id),
    p_billing_account_id => COALESCE(NEW.id, OLD.id),
    p_metadata => jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_stripe_customer_id', OLD.stripe_customer_id,
      'new_stripe_customer_id', NEW.stripe_customer_id
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_audit_billing_account_changes ON billing_accounts;
CREATE TRIGGER trigger_audit_billing_account_changes
  AFTER INSERT OR UPDATE OR DELETE ON billing_accounts
  FOR EACH ROW
  EXECUTE FUNCTION audit_billing_account_changes();

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  PERFORM log_audit_event(
    p_tenant_id => v_tenant_id,
    p_user_id => v_user_id,
    p_event => CASE
      WHEN TG_OP = 'INSERT' THEN 'subscription.created'
      WHEN TG_OP = 'UPDATE' THEN 'subscription.updated'
      WHEN TG_OP = 'DELETE' THEN 'subscription.deleted'
    END,
    p_action_type => LOWER(TG_OP),
    p_resource_type => 'subscription',
    p_resource_id => COALESCE(NEW.id, OLD.id),
    p_billing_account_id => COALESCE(NEW.billing_account_id, OLD.billing_account_id),
    p_metadata => jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_plan_id', OLD.plan_id,
      'new_plan_id', NEW.plan_id
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_subscription_changes ON subscriptions;
CREATE TRIGGER trigger_audit_subscription_changes
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION audit_subscription_changes();

-- Function to log integration credential changes
CREATE OR REPLACE FUNCTION audit_integration_credential_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  PERFORM log_audit_event(
    p_tenant_id => v_tenant_id,
    p_user_id => v_user_id,
    p_event => CASE
      WHEN TG_OP = 'INSERT' THEN 'integration_credential.created'
      WHEN TG_OP = 'UPDATE' THEN 'integration_credential.updated'
      WHEN TG_OP = 'DELETE' THEN 'integration_credential.deleted'
    END,
    p_action_type => LOWER(TG_OP),
    p_resource_type => 'integration_credential',
    p_resource_id => COALESCE(NEW.id, OLD.id),
    p_integration_id => COALESCE(NEW.integration_id, OLD.integration_id),
    p_metadata => jsonb_build_object(
      'integration_id', COALESCE(NEW.integration_id, OLD.integration_id),
      'credential_type', COALESCE(NEW.credential_type, OLD.credential_type),
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_integration_credential_changes ON integration_credentials;
CREATE TRIGGER trigger_audit_integration_credential_changes
  AFTER INSERT OR UPDATE OR DELETE ON integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION audit_integration_credential_changes();

-- ============================================================================
-- GDPR: User data export function
-- ============================================================================

CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_user_data JSONB;
  v_billing_data JSONB;
  v_usage_data JSONB;
  v_integration_data JSONB;
BEGIN
  -- Get user data
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'name', name,
    'role', role,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_user_data
  FROM users
  WHERE id = p_user_id;

  -- Get billing data
  SELECT jsonb_agg(
    jsonb_build_object(
      'billing_account', jsonb_build_object(
        'id', ba.id,
        'email', ba.email,
        'status', ba.status,
        'created_at', ba.created_at
      ),
      'subscriptions', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'plan_id', s.plan_id,
            'status', s.status,
            'current_period_start', s.current_period_start,
            'current_period_end', s.current_period_end
          )
        )
        FROM subscriptions s
        WHERE s.billing_account_id = ba.id
      )
    )
  ) INTO v_billing_data
  FROM billing_accounts ba
  WHERE ba.user_id = p_user_id;

  -- Get usage data (last 12 months)
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date,
      'event_type', event_type,
      'total_quantity', total_quantity,
      'event_count', event_count
    )
  ) INTO v_usage_data
  FROM usage_aggregate_daily
  WHERE billing_account_id IN (
    SELECT id FROM billing_accounts WHERE user_id = p_user_id
  )
  AND date >= CURRENT_DATE - INTERVAL '12 months';

  -- Get integration data
  SELECT jsonb_agg(
    jsonb_build_object(
      'integration_id', integration_id,
      'status', status,
      'created_at', created_at,
      'last_used_at', last_used_at
    )
  ) INTO v_integration_data
  FROM integration_credentials
  WHERE user_id = p_user_id;

  -- Build result
  v_result := jsonb_build_object(
    'user', v_user_data,
    'billing', v_billing_data,
    'usage', v_usage_data,
    'integrations', v_integration_data,
    'exported_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- GDPR: User data deletion function
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Soft delete user
  UPDATE users
  SET deleted_at = NOW(),
      email = 'deleted_' || id::text || '@deleted.local',
      password_hash = ''
  WHERE id = p_user_id;

  -- Soft delete billing accounts
  UPDATE billing_accounts
  SET deleted_at = NOW(),
      status = 'cancelled'
  WHERE user_id = p_user_id;

  -- Revoke integration credentials
  UPDATE integration_credentials
  SET status = 'revoked',
      revoked_at = NOW()
  WHERE user_id = p_user_id;

  -- Log deletion
  PERFORM log_audit_event(
    p_user_id => p_user_id,
    p_event => 'user.data_deleted',
    p_action_type => 'delete',
    p_resource_type => 'user',
    p_resource_id => p_user_id,
    p_metadata => jsonb_build_object('gdpr_request', true)
  );

  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'deleted_at', NOW()
  );

  RETURN v_result;
END;
$$;

COMMIT;
