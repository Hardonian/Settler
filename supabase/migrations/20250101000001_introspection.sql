-- ============================================================================
-- SUPABASE BACKEND REALITY INTROSPECTION
-- ============================================================================
-- Run this script against your Supabase database to capture actual state
-- Output will be saved to introspection_results.json
-- ============================================================================

BEGIN;

-- Create temporary schema for results
CREATE SCHEMA IF NOT EXISTS introspection_temp;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE TABLE introspection_temp.extensions AS
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extnamespace != (SELECT oid FROM pg_namespace WHERE nspname = 'pg_catalog')
ORDER BY extname;

-- ============================================================================
-- 2. ENUMS AND TYPES
-- ============================================================================
CREATE TABLE introspection_temp.enums AS
SELECT 
  n.nspname as schema_name,
  t.typname as type_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
ORDER BY n.nspname, t.typname, e.enumsortorder;

-- ============================================================================
-- 3. TABLES AND COLUMNS
-- ============================================================================
CREATE TABLE introspection_temp.tables AS
SELECT 
  t.table_schema,
  t.table_name,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.is_nullable,
  c.column_default,
  c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE t.table_schema IN ('public', 'app_private', 'analytics')
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
ORDER BY t.table_schema, t.table_name, c.ordinal_position;

-- ============================================================================
-- 4. PRIMARY KEYS
-- ============================================================================
CREATE TABLE introspection_temp.primary_keys AS
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema IN ('public', 'app_private', 'analytics')
ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position;

-- ============================================================================
-- 5. FOREIGN KEYS
-- ============================================================================
CREATE TABLE introspection_temp.foreign_keys AS
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema IN ('public', 'app_private', 'analytics')
ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position;

-- ============================================================================
-- 6. UNIQUE CONSTRAINTS
-- ============================================================================
CREATE TABLE introspection_temp.unique_constraints AS
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema IN ('public', 'app_private', 'analytics')
ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position;

-- ============================================================================
-- 7. CHECK CONSTRAINTS
-- ============================================================================
CREATE TABLE introspection_temp.check_constraints AS
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema IN ('public', 'app_private', 'analytics')
ORDER BY tc.table_schema, tc.table_name;

-- ============================================================================
-- 8. INDEXES
-- ============================================================================
CREATE TABLE introspection_temp.indexes AS
SELECT
  schemaname as schema_name,
  tablename as table_name,
  indexname as index_name,
  indexdef as index_definition,
  CASE 
    WHEN indexdef LIKE '%UNIQUE%' THEN true
    ELSE false
  END as is_unique
FROM pg_indexes
WHERE schemaname IN ('public', 'app_private', 'analytics')
ORDER BY schemaname, tablename, indexname;

-- ============================================================================
-- 9. RLS STATUS
-- ============================================================================
CREATE TABLE introspection_temp.rls_status AS
SELECT
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname IN ('public', 'app_private', 'analytics')
  AND c.relkind = 'r'
ORDER BY n.nspname, c.relname;

-- ============================================================================
-- 10. RLS POLICIES
-- ============================================================================
CREATE TABLE introspection_temp.rls_policies AS
SELECT
  schemaname as schema_name,
  tablename as table_name,
  policyname as policy_name,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname IN ('public', 'app_private', 'analytics')
ORDER BY schemaname, tablename, policyname;

-- ============================================================================
-- 11. FUNCTIONS
-- ============================================================================
CREATE TABLE introspection_temp.functions AS
SELECT
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type,
  CASE p.provolatile 
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_private', 'analytics')
ORDER BY n.nspname, p.proname;

-- ============================================================================
-- 12. TRIGGERS
-- ============================================================================
CREATE TABLE introspection_temp.triggers AS
SELECT
  n.nspname as schema_name,
  t.tgname as trigger_name,
  c.relname as table_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname IN ('public', 'app_private', 'analytics')
  AND NOT t.tgisinternal
ORDER BY n.nspname, c.relname, t.tgname;

-- ============================================================================
-- 13. GRANTS (TABLE PERMISSIONS)
-- ============================================================================
CREATE TABLE introspection_temp.table_grants AS
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema IN ('public', 'app_private', 'analytics')
ORDER BY table_schema, table_name, grantee, privilege_type;

-- ============================================================================
-- 14. GRANTS (FUNCTION PERMISSIONS)
-- ============================================================================
CREATE TABLE introspection_temp.function_grants AS
SELECT
  grantee,
  routine_schema,
  routine_name,
  privilege_type
FROM information_schema.role_routine_grants
WHERE routine_schema IN ('public', 'app_private', 'analytics')
ORDER BY routine_schema, routine_name, grantee, privilege_type;

-- ============================================================================
-- 15. REALTIME PUBLICATION STATUS
-- ============================================================================
CREATE TABLE introspection_temp.realtime_publication AS
SELECT
  schemaname,
  tablename,
  pubname as publication_name
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  OR pubname LIKE '%realtime%'
ORDER BY schemaname, tablename;

-- ============================================================================
-- 16. STORAGE BUCKETS (if storage extension exists)
-- ============================================================================
CREATE TABLE introspection_temp.storage_buckets AS
SELECT
  id,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- 17. STORAGE POLICIES
-- ============================================================================
CREATE TABLE introspection_temp.storage_policies AS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- ============================================================================
-- OUTPUT SUMMARY
-- ============================================================================
DO $$
DECLARE
  v_ext_count INT;
  v_table_count INT;
  v_function_count INT;
  v_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO v_ext_count FROM introspection_temp.extensions;
  SELECT COUNT(DISTINCT table_name) INTO v_table_count FROM introspection_temp.tables;
  SELECT COUNT(*) INTO v_function_count FROM introspection_temp.functions;
  SELECT COUNT(*) INTO v_policy_count FROM introspection_temp.rls_policies;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INTROSPECTION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Extensions: %', v_ext_count;
  RAISE NOTICE 'Tables: %', v_table_count;
  RAISE NOTICE 'Functions: %', v_function_count;
  RAISE NOTICE 'RLS Policies: %', v_policy_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Results stored in introspection_temp schema';
  RAISE NOTICE 'Export with: SELECT * FROM introspection_temp.<table>';
END $$;

COMMIT;
