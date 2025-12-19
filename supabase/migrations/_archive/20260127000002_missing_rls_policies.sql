-- Migration: missing_rls_policies
-- Created: 2026-01-27
-- Description: Add missing RLS policies for onboarding_progress, usage_aggregate_daily, usage_counters, health_checks, diagnostics, alerts

BEGIN;

-- ============================================================================
-- ONBOARDING_PROGRESS RLS POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'onboarding_progress') THEN
    ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS onboarding_progress_user_access ON onboarding_progress;
    
    -- Policy: Users can only access their own onboarding progress
    CREATE POLICY onboarding_progress_user_access ON onboarding_progress
      FOR ALL USING (
        user_id = current_user_id()
      );
  END IF;
END $$;

-- ============================================================================
-- USAGE_AGGREGATE_DAILY RLS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_aggregate_daily') THEN
    ALTER TABLE usage_aggregate_daily ENABLE ROW LEVEL SECURITY;
    
    -- Only create policy if billing_account_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_aggregate_daily' 
      AND column_name = 'billing_account_id'
    ) THEN
      DROP POLICY IF EXISTS usage_aggregate_daily_billing_account_access ON usage_aggregate_daily;
      
      -- Policy: Users can access usage aggregates for their billing accounts
      CREATE POLICY usage_aggregate_daily_billing_account_access ON usage_aggregate_daily
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM billing_accounts ba
            WHERE ba.id = usage_aggregate_daily.billing_account_id
              AND ba.user_id = current_user_id()
          )
        );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- USAGE_COUNTERS RLS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_counters') THEN
    ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
    
    -- Only create policy if billing_account_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_counters' 
      AND column_name = 'billing_account_id'
    ) THEN
      DROP POLICY IF EXISTS usage_counters_billing_account_access ON usage_counters;
      
      -- Policy: Users can access usage counters for their billing accounts
      CREATE POLICY usage_counters_billing_account_access ON usage_counters
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM billing_accounts ba
            WHERE ba.id = usage_counters.billing_account_id
              AND ba.user_id = current_user_id()
          )
        );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- HEALTH_CHECKS RLS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_checks') THEN
    ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
    
    -- Only create policy if tenant_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'health_checks' 
      AND column_name = 'tenant_id'
    ) THEN
      DROP POLICY IF EXISTS health_checks_tenant_access ON health_checks;
      
      -- Policy: Users can access health checks for tenants they belong to
      CREATE POLICY health_checks_tenant_access ON health_checks
        FOR ALL USING (
          tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = current_user_id()
          )
          OR EXISTS (
            SELECT 1 FROM billing_accounts ba
            JOIN tenants t ON t.billing_account_id = ba.id
            WHERE t.id = health_checks.tenant_id
              AND ba.user_id = current_user_id()
          )
        );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- DIAGNOSTICS RLS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'diagnostics') THEN
    ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
    
    -- Only create policy if tenant_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'diagnostics' 
      AND column_name = 'tenant_id'
    ) THEN
      DROP POLICY IF EXISTS diagnostics_tenant_access ON diagnostics;
      
      -- Policy: Users can access diagnostics for tenants they belong to
      CREATE POLICY diagnostics_tenant_access ON diagnostics
        FOR ALL USING (
          tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = current_user_id()
          )
          OR EXISTS (
            SELECT 1 FROM billing_accounts ba
            JOIN tenants t ON t.billing_account_id = ba.id
            WHERE t.id = diagnostics.tenant_id
              AND ba.user_id = current_user_id()
          )
        );
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ALERTS RLS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'alerts') THEN
    ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
    
    -- Only create policy if tenant_id column exists (alerts table may not have tenant_id)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'alerts' 
      AND column_name = 'tenant_id'
    ) THEN
      DROP POLICY IF EXISTS alerts_tenant_access ON alerts;
      
      -- Policy: Users can access alerts for tenants they belong to
      CREATE POLICY alerts_tenant_access ON alerts
        FOR ALL USING (
          tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = current_user_id()
          )
          OR EXISTS (
            SELECT 1 FROM billing_accounts ba
            JOIN tenants t ON t.billing_account_id = ba.id
            WHERE t.id = alerts.tenant_id
              AND ba.user_id = current_user_id()
          )
        );
    END IF;
  END IF;
END $$;

COMMIT;
