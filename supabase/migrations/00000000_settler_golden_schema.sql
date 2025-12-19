-- ============================================================================
-- SETTLER.DEV GOLDEN MIGRATION
-- ============================================================================
-- This is the canonical, idempotent schema definition for Settler.dev
-- 
-- IMPORTANT: This migration is designed to be:
-- 1. Idempotent - safe to run multiple times (uses IF NOT EXISTS, DO blocks)
-- 2. Complete - defines the entire database schema
-- 3. Authoritative - this is the source of truth
--
-- All historical migrations have been archived to supabase/migrations/_archive/
--
-- To regenerate this file from production:
--   1. Run: npx tsx scripts/introspect-production-schema.ts
--   2. Review supabase/production-schema.json
--   3. Update this file to match production reality
--
-- Date: 2025-01-XX (to be updated after production introspection)
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTIONS (must be created first)
-- ============================================================================

-- Function to safely create index only if it doesn't exist
CREATE OR REPLACE FUNCTION create_index_if_not_exists(
    p_index_name TEXT,
    p_table_name TEXT,
    p_index_definition TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = p_table_name 
        AND indexname = p_index_name
    ) THEN
        EXECUTE format('CREATE INDEX %I ON %I %s', p_index_name, p_table_name, p_index_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely create policy only if it doesn't exist
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_policy_name TEXT,
    p_table_name TEXT,
    p_policy_definition TEXT
) RETURNS VOID AS $$
BEGIN
    -- Drop policy if exists to avoid duplicates
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
    -- Create the policy
    EXECUTE format('CREATE POLICY %I ON %I %s', p_policy_name, p_table_name, p_policy_definition);
END;
$$ LANGUAGE plpgsql;

-- Function to get current tenant context from JWT claims or session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Try to get tenant_id from JWT claim (Supabase auth)
  BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  -- Fallback to session variable if JWT claim not available
  IF v_tenant_id IS NULL THEN
    BEGIN
      v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to set tenant context (for service role operations)
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTE: This golden migration is a PLACEHOLDER
-- ============================================================================
-- 
-- The actual schema definition will be populated by:
-- 1. Running: npx tsx scripts/introspect-production-schema.ts
-- 2. Reviewing supabase/production-schema.json
-- 3. Consolidating all migration files using: npx tsx scripts/consolidate-migrations.ts
-- 4. Updating this file with the complete, idempotent schema
--
-- Until then, this file serves as a framework and the historical migrations
-- in supabase/migrations/ remain authoritative.
--
-- ============================================================================

COMMIT;
