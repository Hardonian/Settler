-- ============================================================================
-- RLS Consolidation Migration
-- ============================================================================
-- This migration ensures all tables have RLS enabled with proper policies
-- using public.get_user_org_ids() function
-- ============================================================================

BEGIN;

-- ============================================================================
-- Ensure public.get_user_org_ids() function exists and is accessible
-- ============================================================================

-- Drop old app_private function if it exists (migration from app_private to public)
DROP FUNCTION IF EXISTS app_private.get_user_org_ids();

-- Ensure public.get_user_org_ids() exists (idempotent)
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
 RETURNS SETOF uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
declare col_exists boolean; begin
  select exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_organizations' and column_name='org_id') into col_exists;
  if col_exists then
    return query select org_id from public.user_organizations where user_id = (select auth.uid());
    return; end if;
  select exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_organizations' and column_name='organization_id') into col_exists;
  if col_exists then
    return query select organization_id from public.user_organizations where user_id = (select auth.uid());
    return; end if;
  select exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_organizations' and column_name='tenant_id') into col_exists;
  if col_exists then
    return query select tenant_id from public.user_organizations where user_id = (select auth.uid());
    return; end if;
  raise exception 'user_organizations must contain org_id/organization_id/tenant_id';
end; $function$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;

-- ============================================================================
-- Update RLS helper functions to use public.get_user_org_ids()
-- ============================================================================

CREATE OR REPLACE FUNCTION app_private.apply_org_rls_for_org(table_schema text, table_name text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  execute format('alter table %I.%I enable row level security', table_schema, table_name);
  perform 1 from pg_policies where schemaname=table_schema and tablename=table_name and policyname in ('Org read','Org write','Org update','Org delete');
  if found then
    execute format('drop policy if exists "Org read" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org write" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org update" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org delete" on %I.%I', table_schema, table_name);
  end if;
  execute format('grant select, insert, update, delete on %I.%I to authenticated', table_schema, table_name);
  execute format('create policy "Org read" on %I.%I for select to authenticated using (org_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org write" on %I.%I for insert to authenticated with check (org_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org update" on %I.%I for update to authenticated using (org_id in (select public.get_user_org_ids())) with check (org_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org delete" on %I.%I for delete to authenticated using (org_id in (select public.get_user_org_ids()))', table_schema, table_name);
end; $function$;

CREATE OR REPLACE FUNCTION app_private.apply_org_rls_for_tenant(table_schema text, table_name text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  execute format('alter table %I.%I enable row level security', table_schema, table_name);
  -- drop existing org policies if present
  perform 1 from pg_policies where schemaname=table_schema and tablename=table_name and policyname in ('Org read','Org write','Org update','Org delete');
  if found then
    execute format('drop policy if exists "Org read" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org write" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org update" on %I.%I', table_schema, table_name);
    execute format('drop policy if exists "Org delete" on %I.%I', table_schema, table_name);
  end if;
  -- grants
  execute format('grant select, insert, update, delete on %I.%I to authenticated', table_schema, table_name);
  -- create org-based policies using tenant_id
  execute format('create policy "Org read" on %I.%I for select to authenticated using (tenant_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org write" on %I.%I for insert to authenticated with check (tenant_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org update" on %I.%I for update to authenticated using (tenant_id in (select public.get_user_org_ids())) with check (tenant_id in (select public.get_user_org_ids()))', table_schema, table_name);
  execute format('create policy "Org delete" on %I.%I for delete to authenticated using (tenant_id in (select public.get_user_org_ids()))', table_schema, table_name);
end; $function$;

-- ============================================================================
-- Ensure RLS is enabled on all application tables
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Enable RLS on all public schema tables that don't already have it
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT IN ('schema_migrations', 'migrations')
      AND NOT EXISTS (
        SELECT 1 FROM pg_tables t2
        WHERE t2.schemaname = 'public'
          AND t2.tablename = pg_tables.tablename
          AND t2.rowsecurity = true
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
  END LOOP;
END $$;

COMMIT;
