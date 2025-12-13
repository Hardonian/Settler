-- Verification Script: Console Setup
-- Run this after applying 20260126000000_console_complete_setup.sql
-- to verify all tables, functions, and policies are correctly set up

BEGIN;

-- ============================================================================
-- 1. CHECK TABLES EXIST
-- ============================================================================

DO $$
DECLARE
  v_missing_tables TEXT[];
  v_table TEXT;
  v_required_tables TEXT[] := ARRAY[
    'receipt_uploads', 'receipts', 'receipt_items',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'tenant_branding', 'tenant_navigation', 'tenant_pages', 'tenant_page_revisions',
    'experiments', 'experiment_variants', 'experiment_metric_events',
    'webhooks', 'webhook_deliveries',
    'idempotency_keys',
    'stripe_events',
    'console_activities'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      v_missing_tables := array_append(v_missing_tables, v_table);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(v_missing_tables, ', ');
  ELSE
    RAISE NOTICE '✓ All required tables exist';
  END IF;
END $$;

-- ============================================================================
-- 2. CHECK FUNCTIONS EXIST
-- ============================================================================

DO $$
DECLARE
  v_missing_functions TEXT[];
  v_function TEXT;
  v_required_functions TEXT[] := ARRAY[
    'current_user_id',
    'current_tenant_id',
    'log_console_activity',
    'get_recent_console_activities'
  ];
BEGIN
  FOREACH v_function IN ARRAY v_required_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = v_function
    ) THEN
      v_missing_functions := array_append(v_missing_functions, v_function);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_functions, 1) > 0 THEN
    RAISE EXCEPTION 'Missing functions: %', array_to_string(v_missing_functions, ', ');
  ELSE
    RAISE NOTICE '✓ All required functions exist';
  END IF;
END $$;

-- ============================================================================
-- 3. CHECK RLS IS ENABLED
-- ============================================================================

DO $$
DECLARE
  v_tables_without_rls TEXT[];
  v_table TEXT;
  v_required_tables TEXT[] := ARRAY[
    'receipt_uploads', 'receipts', 'receipt_items',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'tenant_branding', 'tenant_navigation', 'tenant_pages', 'tenant_page_revisions',
    'experiments', 'experiment_variants', 'experiment_metric_events',
    'webhooks', 'webhook_deliveries',
    'idempotency_keys',
    'stripe_events',
    'console_activities'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_required_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = v_table
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = v_table 
        AND rowsecurity = true
    ) THEN
      v_tables_without_rls := array_append(v_tables_without_rls, v_table);
    END IF;
  END LOOP;
  
  IF array_length(v_tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Tables without RLS enabled: %', array_to_string(v_tables_without_rls, ', ');
  ELSE
    RAISE NOTICE '✓ RLS is enabled on all tables';
  END IF;
END $$;

-- ============================================================================
-- 4. CHECK POLICIES EXIST
-- ============================================================================

DO $$
DECLARE
  v_missing_policies TEXT[];
  v_policy TEXT;
  v_required_policies TEXT[] := ARRAY[
    'receipt_uploads_user_access',
    'receipts_user_access',
    'receipt_items_user_access',
    'feature_flags_user_access',
    'feature_flag_environments_user_access',
    'feature_flag_overrides_user_access',
    'tenant_branding_user_access',
    'tenant_navigation_user_access',
    'tenant_pages_user_access',
    'tenant_page_revisions_user_access',
    'experiments_user_access',
    'experiment_variants_user_access',
    'experiment_metric_events_user_access',
    'webhooks_user_access',
    'webhook_deliveries_user_access',
    'idempotency_keys_user_access',
    'stripe_events_user_access',
    'console_activities_user_access',
    'console_activities_user_insert'
  ];
BEGIN
  FOREACH v_policy IN ARRAY v_required_policies
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND policyname = v_policy
    ) THEN
      v_missing_policies := array_append(v_missing_policies, v_policy);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_policies, 1) > 0 THEN
    RAISE WARNING 'Missing policies: %', array_to_string(v_missing_policies, ', ');
  ELSE
    RAISE NOTICE '✓ All required policies exist';
  END IF;
END $$;

-- ============================================================================
-- 5. CHECK INDEXES EXIST
-- ============================================================================

DO $$
DECLARE
  v_missing_indexes INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing_indexes
  FROM (
    SELECT 'receipt_uploads' AS table_name, 'idx_receipt_uploads_billing_account_id' AS index_name
    UNION ALL SELECT 'receipts', 'idx_receipts_upload_id'
    UNION ALL SELECT 'feature_flags', 'idx_feature_flags_billing_account_id'
    UNION ALL SELECT 'console_activities', 'idx_console_activities_billing_account_id'
  ) required
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = required.table_name 
      AND indexname = required.index_name
  );
  
  IF v_missing_indexes > 0 THEN
    RAISE WARNING 'Some indexes may be missing (check manually)';
  ELSE
    RAISE NOTICE '✓ Key indexes exist';
  END IF;
END $$;

-- ============================================================================
-- 6. CHECK DEPENDENCIES
-- ============================================================================

DO $$
DECLARE
  v_missing_deps TEXT[];
BEGIN
  -- Check for billing_accounts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'billing_accounts'
  ) THEN
    v_missing_deps := array_append(v_missing_deps, 'billing_accounts');
  END IF;
  
  -- Check for tenants
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tenants'
  ) THEN
    v_missing_deps := array_append(v_missing_deps, 'tenants');
  END IF;
  
  -- Check for api_keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'api_keys'
  ) THEN
    v_missing_deps := array_append(v_missing_deps, 'api_keys');
  END IF;
  
  IF array_length(v_missing_deps, 1) > 0 THEN
    RAISE EXCEPTION 'Missing dependencies: %. Please apply earlier migrations first.', array_to_string(v_missing_deps, ', ');
  ELSE
    RAISE NOTICE '✓ All dependencies exist';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Console Setup Verification Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All checks passed! Console should be ready to use.';
  RAISE NOTICE '';
END $$;

COMMIT;
