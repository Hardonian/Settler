-- ============================================================================
-- ROLLBACK SCRIPT (LIMITED)
-- ============================================================================
-- WARNING: This script provides LIMITED rollback capabilities
-- Most changes from PATCH.sql are additive and safe, so rollback is rarely needed
-- ============================================================================
-- 
-- WHAT CAN BE ROLLED BACK:
-- - Policies (can be dropped safely)
-- - Indexes (can be dropped safely)
-- - Grants (can be revoked)
-- 
-- WHAT CANNOT BE ROLLED BACK SAFELY:
-- - Tables (contain data - DO NOT DROP)
-- - Columns (contain data - DO NOT DROP)
-- - Functions (may be in use - review dependencies first)
-- - Extensions (may be required by other objects)
-- ============================================================================

BEGIN;

-- ============================================================================
-- ROLLBACK: RLS POLICIES
-- ============================================================================
-- Only rollback policies created by PATCH.sql
-- Review carefully - other policies may exist from migrations

DO $$
BEGIN
  -- Drop policies created by PATCH.sql
  DROP POLICY IF EXISTS "Users can view their own billing accounts" ON public.billing_accounts;
  DROP POLICY IF EXISTS "Users can update their own billing accounts" ON public.billing_accounts;
  DROP POLICY IF EXISTS "Service role can manage billing accounts" ON public.billing_accounts;
  
  DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
  DROP POLICY IF EXISTS "Service role can manage tenants" ON public.tenants;
  
  RAISE NOTICE 'Rolled back RLS policies created by PATCH.sql';
END $$;

-- ============================================================================
-- ROLLBACK: INDEXES
-- ============================================================================
-- Only rollback indexes created by PATCH.sql
-- Other indexes may exist from migrations

DROP INDEX IF EXISTS public.idx_billing_accounts_user_id;
DROP INDEX IF EXISTS public.idx_billing_accounts_tenant_id;
DROP INDEX IF EXISTS public.idx_billing_accounts_stripe_customer_id;
DROP INDEX IF EXISTS public.idx_tenants_slug;
DROP INDEX IF EXISTS public.idx_tenants_billing_account_id;

-- ============================================================================
-- ROLLBACK: GRANTS
-- ============================================================================
-- Revoke grants added by PATCH.sql
-- Note: This may break application access - review carefully

-- Revoke from authenticated (RLS will still apply if enabled)
-- REVOKE ALL ON public.tenants FROM authenticated;
-- REVOKE ALL ON public.billing_accounts FROM authenticated;

-- Revoke from service_role (only if you're sure)
-- REVOKE ALL ON public.tenants FROM service_role;
-- REVOKE ALL ON public.billing_accounts FROM service_role;

-- ============================================================================
-- ROLLBACK: REALTIME PUBLICATION
-- ============================================================================
-- Remove tables from realtime publication (if added by PATCH.sql)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Only remove if they were added by PATCH.sql
    -- Check if they exist first
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'tenants'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.tenants;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'billing_accounts'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.billing_accounts;
    END IF;
    
    RAISE NOTICE 'Removed tables from realtime publication';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK: HELPER FUNCTIONS
-- ============================================================================
-- WARNING: Do not drop these if they're used elsewhere
-- Review dependencies first

-- Uncomment only if you're sure no other code depends on these
-- DROP FUNCTION IF EXISTS public.get_user_tenant_ids();
-- DROP FUNCTION IF EXISTS public.current_tenant_id();
-- DROP FUNCTION IF EXISTS public.create_index_if_not_exists(TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.create_policy_if_not_exists(TEXT, TEXT, TEXT);

-- ============================================================================
-- ROLLBACK: RLS ENABLED STATUS
-- ============================================================================
-- WARNING: Disabling RLS is a security risk
-- Only do this if you're absolutely sure

-- Uncomment only if you need to disable RLS
-- ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.billing_accounts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_policies_count INT;
  v_indexes_count INT;
BEGIN
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'billing_accounts')
    AND policyname IN (
      'Users can view their own billing accounts',
      'Users can update their own billing accounts',
      'Service role can manage billing accounts',
      'Users can view their tenants',
      'Service role can manage tenants'
    );
  
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'billing_accounts')
    AND indexname IN (
      'idx_billing_accounts_user_id',
      'idx_billing_accounts_tenant_id',
      'idx_billing_accounts_stripe_customer_id',
      'idx_tenants_slug',
      'idx_tenants_billing_account_id'
    );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ROLLBACK COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policies remaining: %', v_policies_count;
  RAISE NOTICE 'Indexes remaining: %', v_indexes_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'WARNING: Tables and data remain unchanged';
  RAISE NOTICE 'If you need to rollback table creation,';
  RAISE NOTICE 'you must do so manually after backing up data';
END $$;

COMMIT;

-- ============================================================================
-- MANUAL ROLLBACK INSTRUCTIONS
-- ============================================================================
-- 
-- If you need to rollback table creation:
-- 
-- 1. BACKUP DATA FIRST:
--    pg_dump -t public.tenants > tenants_backup.sql
--    pg_dump -t public.billing_accounts > billing_accounts_backup.sql
-- 
-- 2. CHECK DEPENDENCIES:
--    SELECT * FROM information_schema.table_constraints 
--    WHERE constraint_type = 'FOREIGN KEY' 
--    AND (referenced_table_name = 'tenants' OR referenced_table_name = 'billing_accounts');
-- 
-- 3. DROP FOREIGN KEYS FIRST:
--    ALTER TABLE <dependent_table> DROP CONSTRAINT <fk_name>;
-- 
-- 4. DROP TABLES (LAST RESORT):
--    DROP TABLE IF EXISTS public.billing_accounts CASCADE;
--    DROP TABLE IF EXISTS public.tenants CASCADE;
-- 
-- ============================================================================
