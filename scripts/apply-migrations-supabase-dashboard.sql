-- ============================================================================
-- Consolidated Migration Script for Supabase Dashboard
-- ============================================================================
-- 
-- This file contains all critical migrations that can be run directly
-- in Supabase Dashboard → SQL Editor
-- 
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute all migrations
-- 4. Check for any errors (some "already exists" errors are normal)
--
-- ============================================================================

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CRITICAL: Console Setup Migrations
-- ============================================================================

-- Migration: console_complete_setup
-- This is the main console setup migration
BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper Functions
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- CRITICAL: RLS Policies
-- ============================================================================

BEGIN;

-- Enable RLS on critical tables
ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usage_events ENABLE ROW LEVEL SECURITY;

-- API Keys RLS Policy
DROP POLICY IF EXISTS api_keys_user_access ON api_keys;
CREATE POLICY api_keys_user_access ON api_keys
  FOR ALL USING (user_id = current_user_id());

-- Billing Accounts RLS Policy
DROP POLICY IF EXISTS billing_accounts_user_access ON billing_accounts;
CREATE POLICY billing_accounts_user_access ON billing_accounts
  FOR SELECT USING (user_id = current_user_id());

-- Usage Events RLS Policy
DROP POLICY IF EXISTS usage_events_billing_account_access ON usage_events;
CREATE POLICY usage_events_billing_account_access ON usage_events
  FOR SELECT USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = current_user_id()
    )
  );

COMMIT;

-- ============================================================================
-- CRITICAL: Performance Indexes
-- ============================================================================

BEGIN;

-- Receipts indexes
CREATE INDEX IF NOT EXISTS idx_receipts_upload_id ON receipts(upload_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_upload_created ON receipts(upload_id, created_at DESC);

-- Usage events indexes
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account ON usage_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_account_timestamp ON usage_events(billing_account_id, timestamp DESC);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at) WHERE revoked_at IS NULL;

-- Feature flags indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_billing_account ON feature_flags(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted ON feature_flags(deleted_at) WHERE deleted_at IS NULL;

-- Uploads indexes
CREATE INDEX IF NOT EXISTS idx_uploads_billing_account ON uploads(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at DESC);

COMMIT;

-- ============================================================================
-- Mark migrations as applied
-- ============================================================================

INSERT INTO schema_migrations (version) VALUES 
  ('20260126000000_console_complete_setup.sql'),
  ('20260125000000_console_rls_fixes.sql'),
  ('20260130000004_optimize_console_indexes.sql')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check tables exist
SELECT 'Tables Check' as check_type,
  COUNT(*) FILTER (WHERE table_name IN ('billing_accounts', 'api_keys', 'receipts', 'usage_events', 'feature_flags')) as found,
  5 as expected
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check indexes exist
SELECT 'Indexes Check' as check_type,
  COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as found
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check RLS enabled
SELECT 'RLS Check' as check_type,
  COUNT(*) FILTER (WHERE rowsecurity = true) as enabled,
  COUNT(*) FILTER (WHERE tablename IN ('api_keys', 'billing_accounts', 'usage_events')) as total
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('api_keys', 'billing_accounts', 'usage_events');

-- Check functions exist
SELECT 'Functions Check' as check_type,
  COUNT(*) FILTER (WHERE proname IN ('current_user_id', 'current_tenant_id')) as found,
  2 as expected
FROM pg_proc 
WHERE proname IN ('current_user_id', 'current_tenant_id');
