-- ============================================================================
-- GAPS REPORT GENERATOR
-- ============================================================================
-- This script compares intended schema (from migrations) vs actual DB state
-- Run INTROSPECTION.sql first, then run this to generate gaps report
-- ============================================================================

\echo '============================================================================'
\echo 'GAPS ANALYSIS REPORT'
\echo '============================================================================'
\echo 'Comparing intended schema (from migrations) vs actual database state'
\echo ''

-- ============================================================================
-- 1. MISSING TABLES
-- ============================================================================
\echo '1. MISSING TABLES'
\echo '----------------------------------------'
\echo 'Expected tables that do not exist in the database:'
\echo ''

-- Expected tables from migrations (core set)
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'tenants', 'billing_accounts', 'subscriptions', 'add_ons', 'add_on_purchases',
    'usage_events', 'usage_aggregate_daily', 'usage_counters',
    'recon_jobs', 'recon_results', 'recon_templates', 'recon_audits',
    'receipt_uploads', 'receipts', 'receipt_items',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'webhooks', 'webhook_deliveries',
    'api_keys', 'idempotency_keys',
    'ingestion_sources', 'ingestions', 'raw_records', 'normalized_transactions',
    'reconciliation_runs', 'reconciliation_matches', 'exports',
    'api_call_logs'
  ]) AS table_name
),
actual_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
)
SELECT 
  et.table_name,
  '✗ MISSING' as status
FROM expected_tables et
LEFT JOIN actual_tables at ON et.table_name = at.table_name
WHERE at.table_name IS NULL
ORDER BY et.table_name;

\echo ''

-- ============================================================================
-- 2. TABLES WITHOUT RLS
-- ============================================================================
\echo '2. TABLES WITHOUT ROW LEVEL SECURITY'
\echo '----------------------------------------'
\echo 'Tables that should have RLS enabled but do not:'
\echo ''

SELECT
  n.nspname as schema_name,
  c.relname as table_name,
  '✗ RLS DISABLED' as status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
  AND c.relname IN (
    'tenants', 'billing_accounts', 'subscriptions', 'usage_events',
    'recon_jobs', 'recon_results', 'receipt_uploads', 'receipts',
    'feature_flags', 'api_keys', 'ingestion_sources', 'normalized_transactions',
    'reconciliation_runs', 'reconciliation_matches'
  )
ORDER BY c.relname;

\echo ''

-- ============================================================================
-- 3. MISSING RLS POLICIES
-- ============================================================================
\echo '3. MISSING RLS POLICIES'
\echo '----------------------------------------'
\echo 'Critical tables that should have RLS policies but do not:'
\echo ''

WITH critical_tables AS (
  SELECT unnest(ARRAY[
    'tenants', 'billing_accounts', 'subscriptions', 'usage_events',
    'recon_jobs', 'recon_results', 'receipt_uploads', 'receipts',
    'feature_flags', 'api_keys'
  ]) AS table_name
),
tables_with_policies AS (
  SELECT DISTINCT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT
  ct.table_name,
  '✗ NO POLICIES' as status
FROM critical_tables ct
LEFT JOIN tables_with_policies twp ON ct.table_name = twp.tablename
WHERE twp.tablename IS NULL
ORDER BY ct.table_name;

\echo ''

-- ============================================================================
-- 4. MISSING INDEXES
-- ============================================================================
\echo '4. MISSING CRITICAL INDEXES'
\echo '----------------------------------------'
\echo 'Expected indexes that do not exist:'
\echo ''

-- Check for critical indexes
WITH expected_indexes AS (
  SELECT 'billing_accounts' as table_name, 'idx_billing_accounts_user_id' as index_name, 'user_id' as column_name
  UNION ALL SELECT 'billing_accounts', 'idx_billing_accounts_tenant_id', 'tenant_id'
  UNION ALL SELECT 'billing_accounts', 'idx_billing_accounts_stripe_customer_id', 'stripe_customer_id'
  UNION ALL SELECT 'tenants', 'idx_tenants_slug', 'slug'
  UNION ALL SELECT 'tenants', 'idx_tenants_billing_account_id', 'billing_account_id'
  UNION ALL SELECT 'recon_jobs', 'idx_recon_jobs_tenant_id', 'tenant_id'
  UNION ALL SELECT 'recon_results', 'idx_recon_results_tenant_id', 'tenant_id'
  UNION ALL SELECT 'normalized_transactions', 'idx_normalized_transactions_tenant_id', 'tenant_id'
  UNION ALL SELECT 'reconciliation_runs', 'idx_reconciliation_runs_tenant_id', 'tenant_id'
),
actual_indexes AS (
  SELECT tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
)
SELECT
  ei.table_name,
  ei.index_name,
  ei.column_name,
  '✗ MISSING' as status
FROM expected_indexes ei
LEFT JOIN actual_indexes ai ON ei.table_name = ai.tablename AND ei.index_name = ai.indexname
WHERE ai.indexname IS NULL
ORDER BY ei.table_name, ei.index_name;

\echo ''

-- ============================================================================
-- 5. MISSING FUNCTIONS
-- ============================================================================
\echo '5. MISSING HELPER FUNCTIONS'
\echo '----------------------------------------'
\echo 'Expected functions that do not exist:'
\echo ''

WITH expected_functions AS (
  SELECT unnest(ARRAY[
    'get_user_tenant_ids',
    'current_tenant_id',
    'create_index_if_not_exists',
    'create_policy_if_not_exists'
  ]) AS function_name
),
actual_functions AS (
  SELECT p.proname as function_name
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
)
SELECT
  ef.function_name,
  '✗ MISSING' as status
FROM expected_functions ef
LEFT JOIN actual_functions af ON ef.function_name = af.function_name
WHERE af.function_name IS NULL
ORDER BY ef.function_name;

\echo ''

-- ============================================================================
-- 6. MISSING EXTENSIONS
-- ============================================================================
\echo '6. MISSING EXTENSIONS'
\echo '----------------------------------------'
\echo 'Required extensions that are not installed:'
\echo ''

WITH required_extensions AS (
  SELECT unnest(ARRAY['uuid-ossp', 'pgcrypto']) AS ext_name
),
actual_extensions AS (
  SELECT extname
  FROM pg_extension
)
SELECT
  re.ext_name,
  '✗ MISSING' as status
FROM required_extensions re
LEFT JOIN actual_extensions ae ON re.ext_name = ae.extname
WHERE ae.extname IS NULL
ORDER BY re.ext_name;

\echo ''

-- ============================================================================
-- 7. INCORRECT GRANTS
-- ============================================================================
\echo '7. SECURITY GRANTS ANALYSIS'
\echo '----------------------------------------'
\echo 'Tables with public access (security risk):'
\echo ''

SELECT
  grantee,
  table_schema,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges,
  CASE 
    WHEN grantee = 'public' THEN '✗ SECURITY RISK'
    ELSE '○ OK'
  END as status
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('tenants', 'billing_accounts', 'subscriptions', 'usage_events')
  AND grantee = 'public'
GROUP BY grantee, table_schema, table_name
ORDER BY table_name;

\echo ''

-- ============================================================================
-- 8. MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================
\echo '8. MISSING FOREIGN KEY CONSTRAINTS'
\echo '----------------------------------------'
\echo 'Expected foreign keys that do not exist:'
\echo ''

-- Check for critical foreign keys
WITH expected_fks AS (
  SELECT 'billing_accounts' as table_name, 'user_id' as column_name, 'auth.users' as referenced_table, 'id' as referenced_column
  UNION ALL SELECT 'billing_accounts', 'tenant_id', 'tenants', 'id'
  UNION ALL SELECT 'tenants', 'billing_account_id', 'billing_accounts', 'id'
  UNION ALL SELECT 'subscriptions', 'billing_account_id', 'billing_accounts', 'id'
  UNION ALL SELECT 'usage_events', 'billing_account_id', 'billing_accounts', 'id'
),
actual_fks AS (
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_schema || '.' || ccu.table_name as referenced_table,
    ccu.column_name as referenced_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
)
SELECT
  ef.table_name,
  ef.column_name,
  ef.referenced_table || '(' || ef.referenced_column || ')' as should_reference,
  '✗ MISSING' as status
FROM expected_fks ef
LEFT JOIN actual_fks af 
  ON ef.table_name = af.table_name 
  AND ef.column_name = af.column_name
  AND ef.referenced_table = af.referenced_table
WHERE af.table_name IS NULL
ORDER BY ef.table_name, ef.column_name;

\echo ''

-- ============================================================================
-- 9. REALTIME CONFIGURATION
-- ============================================================================
\echo '9. REALTIME PUBLICATION STATUS'
\echo '----------------------------------------'
\echo 'Tables that should be in realtime publication but are not:'
\echo ''

WITH expected_realtime_tables AS (
  SELECT unnest(ARRAY['tenants', 'billing_accounts']) AS table_name
),
actual_realtime_tables AS (
  SELECT tablename
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
)
SELECT
  ert.table_name,
  '✗ NOT IN REALTIME' as status
FROM expected_realtime_tables ert
LEFT JOIN actual_realtime_tables art ON ert.table_name = art.tablename
WHERE art.tablename IS NULL
ORDER BY ert.table_name;

\echo ''

-- ============================================================================
-- 10. SUMMARY STATISTICS
-- ============================================================================
\echo '============================================================================'
\echo 'SUMMARY STATISTICS'
\echo '============================================================================'

DO $$
DECLARE
  v_total_tables INT;
  v_tables_with_rls INT;
  v_total_policies INT;
  v_missing_critical_tables INT;
BEGIN
  -- Count total tables
  SELECT COUNT(*) INTO v_total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
  
  -- Count tables with RLS
  SELECT COUNT(*) INTO v_tables_with_rls
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
  
  -- Count policies
  SELECT COUNT(*) INTO v_total_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count missing critical tables
  WITH expected_tables AS (
    SELECT unnest(ARRAY['tenants', 'billing_accounts']) AS table_name
  ),
  actual_tables AS (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  )
  SELECT COUNT(*) INTO v_missing_critical_tables
  FROM expected_tables et
  LEFT JOIN actual_tables at ON et.table_name = at.table_name
  WHERE at.table_name IS NULL;
  
  RAISE NOTICE 'Total tables in public schema: %', v_total_tables;
  RAISE NOTICE 'Tables with RLS enabled: %', v_tables_with_rls;
  RAISE NOTICE 'RLS policies defined: %', v_total_policies;
  RAISE NOTICE 'Missing critical tables: %', v_missing_critical_tables;
  RAISE NOTICE '';
  
  IF v_missing_critical_tables > 0 THEN
    RAISE WARNING '✗ CRITICAL GAPS DETECTED - Run PATCH.sql to fix';
  ELSE
    RAISE NOTICE '✓ No critical tables missing';
  END IF;
  
  IF v_tables_with_rls < 2 THEN
    RAISE WARNING '✗ CRITICAL: RLS not enabled on all critical tables';
  ELSE
    RAISE NOTICE '✓ RLS enabled on critical tables';
  END IF;
END $$;

\echo ''
\echo '============================================================================'
\echo 'GAPS ANALYSIS COMPLETE'
\echo '============================================================================'
\echo 'Review the output above and run PATCH.sql to fix identified gaps'
\echo ''
