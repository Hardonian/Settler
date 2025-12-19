-- Migration: billing_rls_policies
-- Created: 2025-01-20 00:00:02 UTC
-- Description: Row Level Security policies for billing tables
-- Priority: P0 (CRITICAL - Security breach risk)

BEGIN;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON BILLING TABLES
-- ============================================================================

ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_aggregate_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_on_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_event_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION FOR CURRENT USER ID
-- ============================================================================

-- Function to get current user ID from JWT claims
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
-- BILLING ACCOUNTS POLICIES
-- ============================================================================

-- Users can only SELECT their own billing accounts
DROP POLICY IF EXISTS billing_accounts_select_own ON billing_accounts;
CREATE POLICY billing_accounts_select_own ON billing_accounts
  FOR SELECT
  USING (
    user_id = current_user_id()
    OR EXISTS (
      -- Allow if user is in the same tenant
      SELECT 1 FROM users
      WHERE users.id = current_user_id()
        AND users.tenant_id = billing_accounts.tenant_id
    )
  );

-- Users can only INSERT billing accounts for themselves
DROP POLICY IF EXISTS billing_accounts_insert_own ON billing_accounts;
CREATE POLICY billing_accounts_insert_own ON billing_accounts
  FOR INSERT
  WITH CHECK (
    user_id = current_user_id()
  );

-- Users can only UPDATE their own billing accounts
DROP POLICY IF EXISTS billing_accounts_update_own ON billing_accounts;
CREATE POLICY billing_accounts_update_own ON billing_accounts
  FOR UPDATE
  USING (
    user_id = current_user_id()
  )
  WITH CHECK (
    user_id = current_user_id()
  );

-- Users cannot DELETE billing accounts (soft delete only via deleted_at)
DROP POLICY IF EXISTS billing_accounts_delete_own ON billing_accounts;
CREATE POLICY billing_accounts_delete_own ON billing_accounts
  FOR DELETE
  USING (false); -- Prevent direct deletes, use soft delete

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can only SELECT subscriptions for their billing accounts
DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = subscriptions.billing_account_id
        AND (
          billing_accounts.user_id = current_user_id()
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = current_user_id()
              AND users.tenant_id = billing_accounts.tenant_id
          )
        )
    )
  );

-- Users can only INSERT subscriptions for their billing accounts
DROP POLICY IF EXISTS subscriptions_insert_own ON subscriptions;
CREATE POLICY subscriptions_insert_own ON subscriptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = subscriptions.billing_account_id
        AND billing_accounts.user_id = current_user_id()
    )
  );

-- Users can only UPDATE subscriptions for their billing accounts
DROP POLICY IF EXISTS subscriptions_update_own ON subscriptions;
CREATE POLICY subscriptions_update_own ON subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = subscriptions.billing_account_id
        AND billing_accounts.user_id = current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = subscriptions.billing_account_id
        AND billing_accounts.user_id = current_user_id()
    )
  );

-- Prevent direct deletes (subscriptions managed via Stripe webhooks)
DROP POLICY IF EXISTS subscriptions_delete_own ON subscriptions;
CREATE POLICY subscriptions_delete_own ON subscriptions
  FOR DELETE
  USING (false);

-- ============================================================================
-- USAGE EVENTS POLICIES
-- ============================================================================

-- Users can only SELECT usage events for their billing accounts
DROP POLICY IF EXISTS usage_events_select_own ON usage_events;
CREATE POLICY usage_events_select_own ON usage_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = usage_events.billing_account_id
        AND (
          billing_accounts.user_id = current_user_id()
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = current_user_id()
              AND users.tenant_id = billing_accounts.tenant_id
          )
        )
    )
  );

-- Users can only INSERT usage events for their billing accounts
-- NOTE: This should be restricted further via Edge Function validation
DROP POLICY IF EXISTS usage_events_insert_own ON usage_events;
CREATE POLICY usage_events_insert_own ON usage_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = usage_events.billing_account_id
        AND billing_accounts.user_id = current_user_id()
    )
  );

-- Users cannot UPDATE usage events (immutable audit trail)
DROP POLICY IF EXISTS usage_events_update_own ON usage_events;
CREATE POLICY usage_events_update_own ON usage_events
  FOR UPDATE
  USING (false);

-- Users cannot DELETE usage events (immutable audit trail)
DROP POLICY IF EXISTS usage_events_delete_own ON usage_events;
CREATE POLICY usage_events_delete_own ON usage_events
  FOR DELETE
  USING (false);

-- ============================================================================
-- USAGE AGGREGATE DAILY POLICIES
-- ============================================================================

-- Users can only SELECT aggregated usage for their billing accounts
DROP POLICY IF EXISTS usage_aggregate_daily_select_own ON usage_aggregate_daily;
CREATE POLICY usage_aggregate_daily_select_own ON usage_aggregate_daily
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = usage_aggregate_daily.billing_account_id
        AND (
          billing_accounts.user_id = current_user_id()
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = current_user_id()
              AND users.tenant_id = billing_accounts.tenant_id
          )
        )
    )
  );

-- Users cannot INSERT aggregated usage (system-generated only)
DROP POLICY IF EXISTS usage_aggregate_daily_insert_own ON usage_aggregate_daily;
CREATE POLICY usage_aggregate_daily_insert_own ON usage_aggregate_daily
  FOR INSERT
  WITH CHECK (false); -- Only system can insert

-- Users cannot UPDATE aggregated usage (system-generated only)
DROP POLICY IF EXISTS usage_aggregate_daily_update_own ON usage_aggregate_daily;
CREATE POLICY usage_aggregate_daily_update_own ON usage_aggregate_daily
  FOR UPDATE
  USING (false);

-- Users cannot DELETE aggregated usage (immutable audit trail)
DROP POLICY IF EXISTS usage_aggregate_daily_delete_own ON usage_aggregate_daily;
CREATE POLICY usage_aggregate_daily_delete_own ON usage_aggregate_daily
  FOR DELETE
  USING (false);

-- ============================================================================
-- ADD-ONS POLICIES
-- ============================================================================

-- Add-ons are public catalog (anyone can read active add-ons)
DROP POLICY IF EXISTS add_ons_select_public ON add_ons;
CREATE POLICY add_ons_select_public ON add_ons
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      -- Users can see inactive add-ons if they have a purchase
      SELECT 1 FROM add_on_purchases
      WHERE add_on_purchases.add_on_id = add_ons.id
        AND EXISTS (
          SELECT 1 FROM billing_accounts
          WHERE billing_accounts.id = add_on_purchases.billing_account_id
            AND billing_accounts.user_id = current_user_id()
        )
    )
  );

-- Only service role can INSERT/UPDATE/DELETE add-ons (catalog management)
DROP POLICY IF EXISTS add_ons_insert_admin ON add_ons;
CREATE POLICY add_ons_insert_admin ON add_ons
  FOR INSERT
  WITH CHECK (false); -- Service role only

DROP POLICY IF EXISTS add_ons_update_admin ON add_ons;
CREATE POLICY add_ons_update_admin ON add_ons
  FOR UPDATE
  USING (false); -- Service role only

DROP POLICY IF EXISTS add_ons_delete_admin ON add_ons;
CREATE POLICY add_ons_delete_admin ON add_ons
  FOR DELETE
  USING (false); -- Service role only

-- ============================================================================
-- ADD-ON PURCHASES POLICIES
-- ============================================================================

-- Users can only SELECT purchases for their billing accounts
DROP POLICY IF EXISTS add_on_purchases_select_own ON add_on_purchases;
CREATE POLICY add_on_purchases_select_own ON add_on_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = add_on_purchases.billing_account_id
        AND (
          billing_accounts.user_id = current_user_id()
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = current_user_id()
              AND users.tenant_id = billing_accounts.tenant_id
          )
        )
    )
  );

-- Users can only INSERT purchases for their billing accounts
DROP POLICY IF EXISTS add_on_purchases_insert_own ON add_on_purchases;
CREATE POLICY add_on_purchases_insert_own ON add_on_purchases
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = add_on_purchases.billing_account_id
        AND billing_accounts.user_id = current_user_id()
    )
  );

-- Users can only UPDATE purchases for their billing accounts
DROP POLICY IF EXISTS add_on_purchases_update_own ON add_on_purchases;
CREATE POLICY add_on_purchases_update_own ON add_on_purchases
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = add_on_purchases.billing_account_id
        AND billing_accounts.user_id = current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE billing_accounts.id = add_on_purchases.billing_account_id
        AND billing_accounts.user_id = current_user_id()
    )
  );

-- Prevent direct deletes (managed via Stripe webhooks)
DROP POLICY IF EXISTS add_on_purchases_delete_own ON add_on_purchases;
CREATE POLICY add_on_purchases_delete_own ON add_on_purchases
  FOR DELETE
  USING (false);

-- ============================================================================
-- STRIPE EVENT LOG POLICIES
-- ============================================================================

-- Stripe event log is system-only (no user access)
DROP POLICY IF EXISTS stripe_event_log_select_system ON stripe_event_log;
CREATE POLICY stripe_event_log_select_system ON stripe_event_log
  FOR SELECT
  USING (false); -- Service role only

DROP POLICY IF EXISTS stripe_event_log_insert_system ON stripe_event_log;
CREATE POLICY stripe_event_log_insert_system ON stripe_event_log
  FOR INSERT
  WITH CHECK (false); -- Service role only

DROP POLICY IF EXISTS stripe_event_log_update_system ON stripe_event_log;
CREATE POLICY stripe_event_log_update_system ON stripe_event_log
  FOR UPDATE
  USING (false); -- Service role only

DROP POLICY IF EXISTS stripe_event_log_delete_system ON stripe_event_log;
CREATE POLICY stripe_event_log_delete_system ON stripe_event_log
  FOR DELETE
  USING (false); -- Service role only

-- ============================================================================
-- NOTES
-- ============================================================================

-- Service role key bypasses RLS automatically in Supabase
-- These policies ensure tenant isolation for application-level access
-- All billing operations should be audited via audit_logs table

COMMIT;
