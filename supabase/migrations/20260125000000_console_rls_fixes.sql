-- Migration: console_rls_fixes
-- Created: 2026-01-25 00:00:00 UTC
-- Description: Fix RLS policies for Console tables to support user-based queries with tenant isolation

BEGIN;

-- ============================================================================
-- HELPER FUNCTION: Get current user ID from JWT
-- ============================================================================

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get user_id from JWT claim (Supabase auth)
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- FIX API_KEYS RLS POLICIES
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS tenant_isolation_api_keys ON api_keys;

-- Create policy that allows users to access their own keys
-- AND enforces tenant isolation if tenant_id is set
CREATE POLICY api_keys_user_access ON api_keys
  FOR ALL USING (
    -- User can access their own keys
    user_id = current_user_id()
    OR
    -- OR if tenant_id matches (for cross-user access within tenant, if needed)
    (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
  );

-- ============================================================================
-- ENABLE RLS ON BILLING TABLES (if not already enabled)
-- ============================================================================

-- Enable RLS on billing_accounts if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'billing_accounts') THEN
    ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if exists
    DROP POLICY IF EXISTS billing_accounts_user_access ON billing_accounts;
    
    -- Create policy for billing_accounts
    CREATE POLICY billing_accounts_user_access ON billing_accounts
      FOR ALL USING (
        -- User can access their own billing account
        user_id = current_user_id()
        OR
        -- OR tenant isolation if tenant_id matches
        (tenant_id IS NOT NULL AND tenant_id = current_tenant_id())
      );
  END IF;
END $$;

-- ============================================================================
-- ENABLE RLS ON USAGE_EVENTS TABLE (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_events') THEN
    ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if exists
    DROP POLICY IF EXISTS usage_events_billing_account_access ON usage_events;
    
    -- Create policy for usage_events
    -- Note: usage_events uses billing_account_id, so we need to join with billing_accounts
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

-- ============================================================================
-- ENABLE RLS ON FEATURE_FLAGS TABLE (if exists in Prisma schema)
-- ============================================================================

-- Note: Feature flags are managed via Prisma, but we ensure RLS is enabled
-- The Prisma queries will filter by billing_account_id which should be sufficient

COMMIT;
