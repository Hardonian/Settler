-- Migration: entitlements_and_rls
-- Created: 2026-02-03
-- Description: Entitlements system with RLS policies for unauthenticated, authenticated, and paid users
-- Part of: Site Integrity and Access Control

BEGIN;

-- ============================================================================
-- 1. PUBLIC_CONTENT TABLE (Public content accessible to all)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public_content (
  slug TEXT PRIMARY KEY,
  body_md TEXT NOT NULL,
  title TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_content_slug ON public_content(slug);
CREATE INDEX IF NOT EXISTS idx_public_content_updated_at ON public_content(updated_at DESC);

-- ============================================================================
-- 2. USER_ARTIFACTS TABLE (User-specific artifacts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_artifacts_user_id ON user_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_artifacts_kind ON user_artifacts(kind);
CREATE INDEX IF NOT EXISTS idx_user_artifacts_created_at ON user_artifacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_artifacts_data_gin ON user_artifacts USING GIN(data);

-- ============================================================================
-- 3. HELPER FUNCTION: is_paid(user_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_paid(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_is_paid BOOLEAN := false;
BEGIN
  -- Check if user has an active or trialing subscription
  SELECT EXISTS(
    SELECT 1
    FROM subscriptions s
    INNER JOIN billing_accounts ba ON s.billing_account_id = ba.id
    WHERE ba.user_id = p_user_id
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > NOW()
  ) INTO v_is_paid;
  
  RETURN v_is_paid;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_paid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_paid(UUID) TO anon;

-- ============================================================================
-- 4. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_artifacts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles if not already enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on subscriptions if not already enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- 5. RLS POLICIES: public_content
-- ============================================================================

-- Allow SELECT to everyone (anon + authenticated)
DROP POLICY IF EXISTS public_content_select_all ON public_content;
CREATE POLICY public_content_select_all ON public_content
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only service role can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS public_content_modify_service_role ON public_content;
CREATE POLICY public_content_modify_service_role ON public_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. RLS POLICIES: profiles
-- ============================================================================

-- Users can SELECT their own profile
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id);

-- Users can UPDATE their own profile (limited columns)
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- Admins can SELECT/UPDATE all profiles
DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'Admin', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'Admin', 'ADMIN')
    )
  );

-- ============================================================================
-- 7. RLS POLICIES: subscriptions
-- ============================================================================

-- Users can SELECT their own subscriptions (via billing_accounts)
DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = subscriptions.billing_account_id
        AND ba.user_id = auth.uid()
    )
  );

-- No client INSERT/UPDATE - only service role via webhook
DROP POLICY IF EXISTS subscriptions_service_role_only ON subscriptions;
CREATE POLICY subscriptions_service_role_only ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 8. RLS POLICIES: user_artifacts
-- ============================================================================

-- Users can CRUD their own artifacts
DROP POLICY IF EXISTS user_artifacts_own ON user_artifacts;
CREATE POLICY user_artifacts_own ON user_artifacts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. PREMIUM DATA GATING (Example: Add to existing premium tables)
-- ============================================================================

-- Example: If you have a premium_data table, add this policy:
-- DROP POLICY IF EXISTS premium_data_paid_only ON premium_data;
-- CREATE POLICY premium_data_paid_only ON premium_data
--   FOR SELECT
--   TO authenticated
--   USING (is_paid(auth.uid()));

COMMIT;
