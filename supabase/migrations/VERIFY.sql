-- ============================================================================
-- SUPABASE BACKEND VERIFICATION QUERIES
-- ============================================================================
-- Run this script to verify that the patch was successful
-- All queries should return expected results
-- ============================================================================

\echo '============================================================================'
\echo 'VERIFICATION REPORT'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. EXTENSIONS CHECK
-- ============================================================================
\echo '1. EXTENSIONS'
\echo '----------------------------------------'
SELECT 
  extname as extension,
  extversion as version,
  CASE WHEN extname IN ('uuid-ossp', 'pgcrypto') THEN '✓ REQUIRED' ELSE '○ OPTIONAL' END as status
FROM pg_extension
WHERE extnamespace != (SELECT oid FROM pg_namespace WHERE nspname = 'pg_catalog')
ORDER BY extname;
\echo ''

-- ============================================================================
-- 2. CRITICAL TABLES EXISTENCE
-- ============================================================================
\echo '2. CRITICAL TABLES'
\echo '----------------------------------------'
SELECT 
  table_schema,
  table_name,
  CASE 
    WHEN table_name IN ('tenants', 'billing_accounts') THEN '✓ CRITICAL'
    ELSE '○ STANDARD'
  END as priority
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('tenants', 'billing_accounts', 'subscriptions', 'usage_events', 'recon_jobs', 'recon_results')
ORDER BY priority DESC, table_name;
\echo ''

-- ============================================================================
-- 3. RLS ENABLED STATUS
-- ============================================================================
\echo '3. ROW LEVEL SECURITY STATUS'
\echo '----------------------------------------'
SELECT
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  CASE 
    WHEN c.relname IN ('tenants', 'billing_accounts') AND c.relrowsecurity = true THEN '✓ SECURE'
    WHEN c.relname IN ('tenants', 'billing_accounts') AND c.relrowsecurity = false THEN '✗ VULNERABLE'
    WHEN c.relrowsecurity = true THEN '✓ ENABLED'
    ELSE '○ DISABLED'
  END as security_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('tenants', 'billing_accounts', 'subscriptions', 'usage_events', 'recon_jobs', 'recon_results')
ORDER BY 
  CASE WHEN c.relname IN ('tenants', 'billing_accounts') THEN 0 ELSE 1 END,
  c.relname;
\echo ''

-- ============================================================================
-- 4. RLS POLICIES CHECK
-- ============================================================================
\echo '4. RLS POLICIES'
\echo '----------------------------------------'
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN tablename IN ('tenants', 'billing_accounts') THEN '✓ CRITICAL'
    ELSE '○ STANDARD'
  END as priority
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'billing_accounts', 'subscriptions', 'usage_events', 'recon_jobs', 'recon_results')
ORDER BY 
  CASE WHEN tablename IN ('tenants', 'billing_accounts') THEN 0 ELSE 1 END,
  tablename,
  cmd,
  policyname;
\echo ''

-- ============================================================================
-- 5. HELPER FUNCTIONS CHECK
-- ============================================================================
\echo '5. HELPER FUNCTIONS'
\echo '----------------------------------------'
SELECT
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE p.prosecdef 
    WHEN true THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type,
  CASE 
    WHEN p.proname IN ('get_user_tenant_ids', 'current_tenant_id') THEN '✓ CRITICAL'
    ELSE '○ STANDARD'
  END as priority
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_user_tenant_ids', 'current_tenant_id', 'create_index_if_not_exists', 'create_policy_if_not_exists')
ORDER BY 
  CASE WHEN p.proname IN ('get_user_tenant_ids', 'current_tenant_id') THEN 0 ELSE 1 END,
  p.proname;
\echo ''

-- ============================================================================
-- 6. GRANTS CHECK
-- ============================================================================
\echo '6. TABLE PERMISSIONS'
\echo '----------------------------------------'
SELECT
  grantee,
  table_schema,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('tenants', 'billing_accounts')
  AND grantee IN ('authenticated', 'service_role', 'public')
GROUP BY grantee, table_schema, table_name
ORDER BY table_name, grantee;
\echo ''

-- ============================================================================
-- 7. FUNCTION PERMISSIONS CHECK
-- ============================================================================
\echo '7. FUNCTION PERMISSIONS'
\echo '----------------------------------------'
SELECT
  grantee,
  routine_schema,
  routine_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_routine_grants
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_tenant_ids', 'current_tenant_id')
  AND grantee IN ('authenticated', 'service_role')
GROUP BY grantee, routine_schema, routine_name
ORDER BY routine_name, grantee;
\echo ''

-- ============================================================================
-- 8. INDEXES CHECK
-- ============================================================================
\echo '8. CRITICAL INDEXES'
\echo '----------------------------------------'
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('tenants', 'billing_accounts')
  AND (
    indexname LIKE '%user_id%' 
    OR indexname LIKE '%tenant_id%'
    OR indexname LIKE '%stripe_customer_id%'
    OR indexname LIKE '%slug%'
  )
ORDER BY tablename, indexname;
\echo ''

-- ============================================================================
-- 9. REALTIME PUBLICATION CHECK
-- ============================================================================
\echo '9. REALTIME PUBLICATION'
\echo '----------------------------------------'
SELECT
  pubname as publication,
  schemaname,
  tablename,
  CASE 
    WHEN tablename IN ('tenants', 'billing_accounts') THEN '✓ CRITICAL'
    ELSE '○ OPTIONAL'
  END as priority
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('tenants', 'billing_accounts')
ORDER BY priority DESC, tablename;
\echo ''

-- ============================================================================
-- 10. FOREIGN KEY CONSTRAINTS CHECK
-- ============================================================================
\echo '10. FOREIGN KEY CONSTRAINTS'
\echo '----------------------------------------'
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('tenants', 'billing_accounts')
ORDER BY tc.table_name, kcu.column_name;
\echo ''

-- ============================================================================
-- 11. SUMMARY VALIDATION
-- ============================================================================
\echo '============================================================================'
\echo 'VALIDATION SUMMARY'
\echo '============================================================================'

DO $$
DECLARE
  v_critical_tables INT := 0;
  v_rls_enabled INT := 0;
  v_policies_count INT := 0;
  v_functions_count INT := 0;
  v_all_ok BOOLEAN := true;
BEGIN
  -- Count critical tables
  SELECT COUNT(*) INTO v_critical_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('tenants', 'billing_accounts');
  
  -- Count RLS enabled tables
  SELECT COUNT(*) INTO v_rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname IN ('tenants', 'billing_accounts')
    AND c.relrowsecurity = true;
  
  -- Count policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'billing_accounts');
  
  -- Count critical functions
  SELECT COUNT(*) INTO v_functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_tenant_ids', 'current_tenant_id');
  
  -- Validation checks
  IF v_critical_tables < 2 THEN
    RAISE WARNING '✗ CRITICAL: Missing critical tables (expected 2, found %)', v_critical_tables;
    v_all_ok := false;
  ELSE
    RAISE NOTICE '✓ Critical tables exist: %', v_critical_tables;
  END IF;
  
  IF v_rls_enabled < 2 THEN
    RAISE WARNING '✗ CRITICAL: RLS not enabled on all critical tables (expected 2, found %)', v_rls_enabled;
    v_all_ok := false;
  ELSE
    RAISE NOTICE '✓ RLS enabled on critical tables: %', v_rls_enabled;
  END IF;
  
  IF v_policies_count < 4 THEN
    RAISE WARNING '✗ WARNING: Missing RLS policies (expected at least 4, found %)', v_policies_count;
  ELSE
    RAISE NOTICE '✓ RLS policies created: %', v_policies_count;
  END IF;
  
  IF v_functions_count < 2 THEN
    RAISE WARNING '✗ CRITICAL: Missing helper functions (expected 2, found %)', v_functions_count;
    v_all_ok := false;
  ELSE
    RAISE NOTICE '✓ Helper functions exist: %', v_functions_count;
  END IF;
  
  IF v_all_ok THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ ALL CRITICAL VALIDATIONS PASSED';
    RAISE NOTICE '========================================';
  ELSE
    RAISE WARNING '';
    RAISE WARNING '========================================';
    RAISE WARNING '✗ SOME VALIDATIONS FAILED';
    RAISE WARNING 'Review the output above for details';
    RAISE WARNING '========================================';
  END IF;
END $$;

\echo ''
\echo '============================================================================'
\echo 'VERIFICATION COMPLETE'
\echo '============================================================================'
