-- ============================================================================
-- SUPABASE BACKEND VALIDATION PATCH (IDEMPOTENT)
-- ============================================================================
-- This patch fixes gaps between intended schema (from migrations) and actual DB state
-- SAFE TO RUN MULTIPLE TIMES - All operations are idempotent
-- ============================================================================
-- 
-- IMPORTANT: Review this patch before running. It only ADDS missing objects.
-- It does NOT drop tables, columns, or data.
-- ============================================================================

BEGIN;

-- ============================================================================
-- HELPER FUNCTIONS (if not exist)
-- ============================================================================

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
        EXECUTE format('CREATE INDEX %I ON public.%I %s', p_index_name, p_table_name, p_index_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_policy_name TEXT,
    p_table_name TEXT,
    p_policy_definition TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = p_table_name
        AND policyname = p_policy_name
    ) THEN
        EXECUTE format('CREATE POLICY %I ON public.%I %s', p_policy_name, p_table_name, p_policy_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CRITICAL HELPER FUNCTIONS
-- ============================================================================

-- Ensure current_tenant_id() exists
CREATE OR REPLACE FUNCTION public.current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog;

-- Ensure get_user_tenant_ids() exists
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  -- Get tenant IDs from billing_accounts
  RETURN QUERY
  SELECT DISTINCT COALESCE(ba.tenant_id, ba.id::uuid)
  FROM billing_accounts ba
  WHERE ba.user_id = auth.uid()
    AND ba.status = 'active'
    AND ba.deleted_at IS NULL;
  
  -- Also check tenant_users if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_users') THEN
    RETURN QUERY
    SELECT DISTINCT tu.tenant_id
    FROM tenant_users tu
    WHERE tu.user_id = auth.uid();
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;

-- ============================================================================
-- CRITICAL TABLES: Ensure core tables exist with correct structure
-- ============================================================================

-- tenants table (if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
    CREATE TABLE public.tenants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      billing_account_id uuid UNIQUE,
      slug text UNIQUE NOT NULL,
      primary_domain text,
      custom_domain text,
      name text NOT NULL,
      is_active boolean DEFAULT true,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- billing_accounts table (if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_accounts') THEN
    CREATE TABLE public.billing_accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
      stripe_customer_id text UNIQUE,
      stripe_account_id text,
      email text NOT NULL,
      name text,
      address jsonb,
      tax_id text,
      currency text DEFAULT 'usd',
      status text DEFAULT 'active',
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      deleted_at timestamptz
    );
  END IF;
END $$;

-- Add missing columns to billing_accounts if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'billing_accounts' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.billing_accounts ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ENABLE RLS ON CRITICAL TABLES
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CRITICAL RLS POLICIES: Billing Accounts
-- ============================================================================

-- Drop and recreate to ensure consistency
DROP POLICY IF EXISTS "Users can view their own billing accounts" ON public.billing_accounts;
CREATE POLICY "Users can view their own billing accounts"
  ON public.billing_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own billing accounts" ON public.billing_accounts;
CREATE POLICY "Users can update their own billing accounts"
  ON public.billing_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage billing accounts" ON public.billing_accounts;
CREATE POLICY "Service role can manage billing accounts"
  ON public.billing_accounts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CRITICAL RLS POLICIES: Tenants
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
CREATE POLICY "Users can view their tenants"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT * FROM public.get_user_tenant_ids())
    OR billing_account_id IN (
      SELECT id FROM public.billing_accounts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage tenants" ON public.tenants;
CREATE POLICY "Service role can manage tenants"
  ON public.tenants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CRITICAL INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_billing_accounts_user_id 
  ON public.billing_accounts(user_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_billing_accounts_tenant_id 
  ON public.billing_accounts(tenant_id) 
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe_customer_id 
  ON public.billing_accounts(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_slug 
  ON public.tenants(slug);

CREATE INDEX IF NOT EXISTS idx_tenants_billing_account_id 
  ON public.tenants(billing_account_id) 
  WHERE billing_account_id IS NOT NULL;

-- ============================================================================
-- GRANTS: Ensure proper permissions
-- ============================================================================

-- Revoke public access (security best practice)
REVOKE ALL ON public.tenants FROM public;
REVOKE ALL ON public.billing_accounts FROM public;

-- Grant to authenticated users (RLS will enforce tenant isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_accounts TO authenticated;

-- Service role has full access
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.billing_accounts TO service_role;

-- ============================================================================
-- REALTIME: Configure for critical tables (if needed)
-- ============================================================================

-- Only add to realtime if publication exists and table should be realtime-enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add tenants to realtime (if not already there)
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'tenants'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tenants;
    END IF;
    
    -- Add billing_accounts to realtime (if not already there)
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'billing_accounts'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_accounts;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- VALIDATION: Check critical dependencies
-- ============================================================================

DO $$
DECLARE
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check that tenants table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
    v_errors := array_append(v_errors, 'CRITICAL: tenants table missing');
  END IF;
  
  -- Check that billing_accounts table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_accounts') THEN
    v_errors := array_append(v_errors, 'CRITICAL: billing_accounts table missing');
  END IF;
  
  -- Check that RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'tenants' AND c.relrowsecurity = true
  ) THEN
    v_errors := array_append(v_errors, 'CRITICAL: RLS not enabled on tenants');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'billing_accounts' AND c.relrowsecurity = true
  ) THEN
    v_errors := array_append(v_errors, 'CRITICAL: RLS not enabled on billing_accounts');
  END IF;
  
  -- Check that helper functions exist
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_user_tenant_ids') THEN
    v_errors := array_append(v_errors, 'CRITICAL: get_user_tenant_ids() function missing');
  END IF;
  
  -- Report errors
  IF array_length(v_errors, 1) > 0 THEN
    RAISE EXCEPTION 'Validation failed: %', array_to_string(v_errors, '; ');
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PATCH VALIDATION PASSED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All critical objects verified';
    RAISE NOTICE 'RLS enabled on critical tables';
    RAISE NOTICE 'Policies created';
    RAISE NOTICE '========================================';
  END IF;
END $$;

COMMIT;
