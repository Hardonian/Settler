-- Migration: RLS Policy Completion - Critical Tables
-- Created: 2026-01-31
-- Description: Add missing RLS policies for tables with tenant_id but no policies
--              Covers contract versions, templates, workspace features, and data pipeline tables

BEGIN;

-- ============================================================================
-- 1. UTILITY FUNCTIONS (Ensure availability)
-- ============================================================================

-- Ensure get_user_tenant_ids exists (idempotent)
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
  
  -- Also check memberships for multi-tenant users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memberships') THEN
    RETURN QUERY
    SELECT DISTINCT m.tenant_id
    FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.status = 'active';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;

-- ============================================================================
-- 2. CONTRACT VERSIONS (Schema management)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'contract_versions'
  ) THEN
    ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS contract_versions_select_tenant ON public.contract_versions;
    CREATE POLICY contract_versions_select_tenant ON public.contract_versions
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- INSERT: Tenant members can create
    DROP POLICY IF EXISTS contract_versions_insert_tenant ON public.contract_versions;
    CREATE POLICY contract_versions_insert_tenant ON public.contract_versions
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Tenant members can update
    DROP POLICY IF EXISTS contract_versions_update_tenant ON public.contract_versions;
    CREATE POLICY contract_versions_update_tenant ON public.contract_versions
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- DELETE: Tenant members can delete
    DROP POLICY IF EXISTS contract_versions_delete_tenant ON public.contract_versions;
    CREATE POLICY contract_versions_delete_tenant ON public.contract_versions
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 3. RECON TEMPLATES (Public/System template handling)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'recon_templates'
  ) THEN
    ALTER TABLE public.recon_templates ENABLE ROW LEVEL SECURITY;

    -- SELECT: Public templates OR own tenant templates
    DROP POLICY IF EXISTS recon_templates_select ON public.recon_templates;
    CREATE POLICY recon_templates_select ON public.recon_templates
      FOR SELECT TO authenticated
      USING (
        is_public = true OR
        is_system = true OR
        tenant_id IN (SELECT public.get_user_tenant_ids())
      );

    -- INSERT: Only own tenant
    DROP POLICY IF EXISTS recon_templates_insert ON public.recon_templates;
    CREATE POLICY recon_templates_insert ON public.recon_templates
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Only own tenant (cannot modify public/system)
    DROP POLICY IF EXISTS recon_templates_update ON public.recon_templates;
    CREATE POLICY recon_templates_update ON public.recon_templates
      FOR UPDATE TO authenticated
      USING (
        is_system = false AND
        tenant_id IN (SELECT public.get_user_tenant_ids())
      )
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- DELETE: Only own tenant (cannot delete public/system)
    DROP POLICY IF EXISTS recon_templates_delete ON public.recon_templates;
    CREATE POLICY recon_templates_delete ON public.recon_templates
      FOR DELETE TO authenticated
      USING (
        is_system = false AND
        tenant_id IN (SELECT public.get_user_tenant_ids())
      );
  END IF;
END $$;

-- ============================================================================
-- 4. MAPPING TEMPLATES (Public/System template handling)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'mapping_templates'
  ) THEN
    ALTER TABLE public.mapping_templates ENABLE ROW LEVEL SECURITY;

    -- SELECT: Public templates OR own tenant templates
    DROP POLICY IF EXISTS mapping_templates_select ON public.mapping_templates;
    CREATE POLICY mapping_templates_select ON public.mapping_templates
      FOR SELECT TO authenticated
      USING (
        is_public = true OR
        is_system = true OR
        tenant_id IN (SELECT public.get_user_tenant_ids())
      );

    -- INSERT: Only own tenant
    DROP POLICY IF EXISTS mapping_templates_insert ON public.mapping_templates;
    CREATE POLICY mapping_templates_insert ON public.mapping_templates
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Only own tenant (cannot modify public/system)
    DROP POLICY IF EXISTS mapping_templates_update ON public.mapping_templates;
    CREATE POLICY mapping_templates_update ON public.mapping_templates
      FOR UPDATE TO authenticated
      USING (
        is_system = false AND
        tenant_id IN (SELECT public.get_user_tenant_ids())
      )
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- DELETE: Only own tenant (cannot delete public/system)
    DROP POLICY IF EXISTS mapping_templates_delete ON public.mapping_templates;
    CREATE POLICY mapping_templates_delete ON public.mapping_templates
      FOR DELETE TO authenticated
      USING (
        is_system = false AND
        tenant_id IN (SELECT public.get_user_tenant_ids())
      );
  END IF;
END $$;

-- ============================================================================
-- 5. VALIDATION RULES (Public/System template handling)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'validation_rules'
  ) THEN
    ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;

    -- SELECT: Public rules OR own tenant rules
    DROP POLICY IF EXISTS validation_rules_select ON public.validation_rules;
    CREATE POLICY validation_rules_select ON public.validation_rules
      FOR SELECT TO authenticated
      USING (
        is_public = true OR
        is_system = true OR
        tenant_id IN (SELECT public.get_user_tenant_ids())
      );

    -- INSERT: Only own tenant
    DROP POLICY IF EXISTS validation_rules_insert ON public.validation_rules;
    CREATE POLICY validation_rules_insert ON public.validation_rules
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Only own tenant (cannot modify public/system)
    DROP POLICY IF EXISTS validation_rules_update ON public.validation_rules;
    CREATE POLICY validation_rules_update ON public.validation_rules
      FOR UPDATE TO authenticated
      USING (
        is_system = false AND
        tenant_id IN (SELECT public.get_user_tenant_ids())
      )
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- DELETE: Only own tenant (cannot delete public/system)
    DROP POLICY IF EXISTS validation_rules_delete ON public.validation_rules;
    CREATE POLICY validation_rules_delete ON public.validation_rules
      FOR DELETE TO authenticated
      USING (
        is_system = false AND
        tenant_id IN (SELECT public.get_user_tenant_ids())
      );
  END IF;
END $$;

-- ============================================================================
-- 6. TRANSFORM RECIPES (Public/System template handling)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'transform_recipes'
  ) THEN
    ALTER TABLE public.transform_recipes ENABLE ROW LEVEL SECURITY;

    -- SELECT: Public recipes OR own tenant recipes
    DROP POLICY IF EXISTS transform_recipes_select ON public.transform_recipes;
    CREATE POLICY transform_recipes_select ON public.transform_recipes
      FOR SELECT TO authenticated
      USING (
        is_public = true OR
        is_system = true OR
        tenant_id IN (SELECT public.get_user_tenant_ids())
      );

    -- INSERT: Only own tenant
    DROP POLICY IF EXISTS transform_recipes_insert ON public.transform_recipes;
    CREATE POLICY transform_recipes_insert ON public.transform_recipes
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Only own tenant (cannot modify public/system)
    DROP POLICY IF EXISTS transform_recipes_update ON public.transform_recipes;
    CREATE POLICY transform_recipes_update ON public.transform_recipes
      FOR UPDATE TO authenticated
      USING (
        is_system = false AND
        tenant_id IN (SELECT public.get_user_tenant_ids())
      )
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- DELETE: Only own tenant (cannot delete public/system)
    DROP POLICY IF EXISTS transform_recipes_delete ON public.transform_recipes;
    CREATE POLICY transform_recipes_delete ON public.transform_recipes
      FOR DELETE TO authenticated
      USING (
        is_system = false AND
        tenant_id IN (SELECT public.get_user_tenant_ids())
      );
  END IF;
END $$;

-- ============================================================================
-- 7. WORKSPACE INVITES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'workspace_invites'
  ) THEN
    ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant members can view invites for their tenants
    DROP POLICY IF EXISTS workspace_invites_select ON public.workspace_invites;
    CREATE POLICY workspace_invites_select ON public.workspace_invites
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- INSERT: Tenant members can create invites
    DROP POLICY IF EXISTS workspace_invites_insert ON public.workspace_invites;
    CREATE POLICY workspace_invites_insert ON public.workspace_invites
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Tenant members can update invites (e.g., revoke)
    DROP POLICY IF EXISTS workspace_invites_update ON public.workspace_invites;
    CREATE POLICY workspace_invites_update ON public.workspace_invites
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- DELETE: Tenant members can delete invites
    DROP POLICY IF EXISTS workspace_invites_delete ON public.workspace_invites;
    CREATE POLICY workspace_invites_delete ON public.workspace_invites
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 8. TENANT BRANDING
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tenant_branding'
  ) THEN
    ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS tenant_branding_select ON public.tenant_branding;
    CREATE POLICY tenant_branding_select ON public.tenant_branding
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- ALL operations for tenant members
    DROP POLICY IF EXISTS tenant_branding_manage ON public.tenant_branding;
    CREATE POLICY tenant_branding_manage ON public.tenant_branding
      FOR ALL TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 9. TENANT NAVIGATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tenant_navigation'
  ) THEN
    ALTER TABLE public.tenant_navigation ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS tenant_navigation_select ON public.tenant_navigation;
    CREATE POLICY tenant_navigation_select ON public.tenant_navigation
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- ALL operations for tenant members
    DROP POLICY IF EXISTS tenant_navigation_manage ON public.tenant_navigation;
    CREATE POLICY tenant_navigation_manage ON public.tenant_navigation
      FOR ALL TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 10. TENANT PAGES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tenant_pages'
  ) THEN
    ALTER TABLE public.tenant_pages ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS tenant_pages_select ON public.tenant_pages;
    CREATE POLICY tenant_pages_select ON public.tenant_pages
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- ALL operations for tenant members
    DROP POLICY IF EXISTS tenant_pages_manage ON public.tenant_pages;
    CREATE POLICY tenant_pages_manage ON public.tenant_pages
      FOR ALL TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 11. EXPERIMENTS (A/B Testing)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'experiments'
  ) THEN
    ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS experiments_select ON public.experiments;
    CREATE POLICY experiments_select ON public.experiments
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- ALL operations for tenant members
    DROP POLICY IF EXISTS experiments_manage ON public.experiments;
    CREATE POLICY experiments_manage ON public.experiments
      FOR ALL TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 12. EXPERIMENT METRIC EVENTS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'experiment_metric_events'
  ) THEN
    ALTER TABLE public.experiment_metric_events ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS experiment_metric_events_select ON public.experiment_metric_events;
    CREATE POLICY experiment_metric_events_select ON public.experiment_metric_events
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- INSERT: Allow anonymous and authenticated to insert (tracking events)
    DROP POLICY IF EXISTS experiment_metric_events_insert_anon ON public.experiment_metric_events;
    CREATE POLICY experiment_metric_events_insert_anon ON public.experiment_metric_events
      FOR INSERT TO anon
      WITH CHECK (true);

    DROP POLICY IF EXISTS experiment_metric_events_insert_auth ON public.experiment_metric_events;
    CREATE POLICY experiment_metric_events_insert_auth ON public.experiment_metric_events
      FOR INSERT TO authenticated
      WITH CHECK (true);

    -- UPDATE/DELETE: No updates/deletes allowed (immutable event log)
  END IF;
END $$;

-- ============================================================================
-- 13. WEBHOOKS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'webhooks'
  ) THEN
    ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS webhooks_select ON public.webhooks;
    CREATE POLICY webhooks_select ON public.webhooks
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- ALL operations for tenant members
    DROP POLICY IF EXISTS webhooks_manage ON public.webhooks;
    CREATE POLICY webhooks_manage ON public.webhooks
      FOR ALL TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 14. EXPORTS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'exports'
  ) THEN
    ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS exports_select ON public.exports;
    CREATE POLICY exports_select ON public.exports
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- INSERT: Tenant members can create exports
    DROP POLICY IF EXISTS exports_insert ON public.exports;
    CREATE POLICY exports_insert ON public.exports
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Tenant members can update their exports
    DROP POLICY IF EXISTS exports_update ON public.exports;
    CREATE POLICY exports_update ON public.exports
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- DELETE: Tenant members can delete their exports
    DROP POLICY IF EXISTS exports_delete ON public.exports;
    CREATE POLICY exports_delete ON public.exports
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 15. INGESTIONS (Data Pipeline)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ingestions'
  ) THEN
    ALTER TABLE public.ingestions ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS ingestions_select ON public.ingestions;
    CREATE POLICY ingestions_select ON public.ingestions
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- INSERT: Tenant members can create ingestions
    DROP POLICY IF EXISTS ingestions_insert ON public.ingestions;
    CREATE POLICY ingestions_insert ON public.ingestions
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Tenant members can update their ingestions
    DROP POLICY IF EXISTS ingestions_update ON public.ingestions;
    CREATE POLICY ingestions_update ON public.ingestions
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- 16. RAW RECORDS (Data Pipeline)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'raw_records'
  ) THEN
    ALTER TABLE public.raw_records ENABLE ROW LEVEL SECURITY;

    -- SELECT: Tenant isolation
    DROP POLICY IF EXISTS raw_records_select ON public.raw_records;
    CREATE POLICY raw_records_select ON public.raw_records
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- INSERT: Tenant members can create raw records
    DROP POLICY IF EXISTS raw_records_insert ON public.raw_records;
    CREATE POLICY raw_records_insert ON public.raw_records
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- UPDATE: Tenant members can update their raw records
    DROP POLICY IF EXISTS raw_records_update ON public.raw_records;
    CREATE POLICY raw_records_update ON public.raw_records
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

    -- DELETE: Tenant members can delete their raw records
    DROP POLICY IF EXISTS raw_records_delete ON public.raw_records;
    CREATE POLICY raw_records_delete ON public.raw_records
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.get_user_tenant_ids()));
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.get_user_tenant_ids() IS 'Returns all tenant IDs the current user has access to via billing_accounts or memberships';

-- ============================================================================
-- ROLLBACK STATEMENTS (for reference)
-- ============================================================================
/*
-- To rollback this migration:

-- Contract Versions
DROP POLICY IF EXISTS contract_versions_delete_tenant ON contract_versions;
DROP POLICY IF EXISTS contract_versions_update_tenant ON contract_versions;
DROP POLICY IF EXISTS contract_versions_insert_tenant ON contract_versions;
DROP POLICY IF EXISTS contract_versions_select_tenant ON contract_versions;

-- Recon Templates
DROP POLICY IF EXISTS recon_templates_delete ON recon_templates;
DROP POLICY IF EXISTS recon_templates_update ON recon_templates;
DROP POLICY IF EXISTS recon_templates_insert ON recon_templates;
DROP POLICY IF EXISTS recon_templates_select ON recon_templates;

-- Mapping Templates
DROP POLICY IF EXISTS mapping_templates_delete ON mapping_templates;
DROP POLICY IF EXISTS mapping_templates_update ON mapping_templates;
DROP POLICY IF EXISTS mapping_templates_insert ON mapping_templates;
DROP POLICY IF EXISTS mapping_templates_select ON mapping_templates;

-- Validation Rules
DROP POLICY IF EXISTS validation_rules_delete ON validation_rules;
DROP POLICY IF EXISTS validation_rules_update ON validation_rules;
DROP POLICY IF EXISTS validation_rules_insert ON validation_rules;
DROP POLICY IF EXISTS validation_rules_select ON validation_rules;

-- Transform Recipes
DROP POLICY IF EXISTS transform_recipes_delete ON transform_recipes;
DROP POLICY IF EXISTS transform_recipes_update ON transform_recipes;
DROP POLICY IF EXISTS transform_recipes_insert ON transform_recipes;
DROP POLICY IF EXISTS transform_recipes_select ON transform_recipes;

-- Workspace Invites
DROP POLICY IF EXISTS workspace_invites_delete ON workspace_invites;
DROP POLICY IF EXISTS workspace_invites_update ON workspace_invites;
DROP POLICY IF EXISTS workspace_invites_insert ON workspace_invites;
DROP POLICY IF EXISTS workspace_invites_select ON workspace_invites;

-- Tenant Branding
DROP POLICY IF EXISTS tenant_branding_manage ON tenant_branding;
DROP POLICY IF EXISTS tenant_branding_select ON tenant_branding;

-- Tenant Navigation
DROP POLICY IF EXISTS tenant_navigation_manage ON tenant_navigation;
DROP POLICY IF EXISTS tenant_navigation_select ON tenant_navigation;

-- Tenant Pages
DROP POLICY IF EXISTS tenant_pages_manage ON tenant_pages;
DROP POLICY IF EXISTS tenant_pages_select ON tenant_pages;

-- Experiments
DROP POLICY IF EXISTS experiments_manage ON experiments;
DROP POLICY IF EXISTS experiments_select ON experiments;

-- Experiment Metric Events
DROP POLICY IF EXISTS experiment_metric_events_insert_auth ON experiment_metric_events;
DROP POLICY IF EXISTS experiment_metric_events_insert_anon ON experiment_metric_events;
DROP POLICY IF EXISTS experiment_metric_events_select ON experiment_metric_events;

-- Webhooks
DROP POLICY IF EXISTS webhooks_manage ON webhooks;
DROP POLICY IF EXISTS webhooks_select ON webhooks;

-- Exports
DROP POLICY IF EXISTS exports_delete ON exports;
DROP POLICY IF EXISTS exports_update ON exports;
DROP POLICY IF EXISTS exports_insert ON exports;
DROP POLICY IF EXISTS exports_select ON exports;

-- Ingestions
DROP POLICY IF EXISTS ingestions_update ON ingestions;
DROP POLICY IF EXISTS ingestions_insert ON ingestions;
DROP POLICY IF EXISTS ingestions_select ON ingestions;

-- Raw Records
DROP POLICY IF EXISTS raw_records_delete ON raw_records;
DROP POLICY IF EXISTS raw_records_update ON raw_records;
DROP POLICY IF EXISTS raw_records_insert ON raw_records;
DROP POLICY IF EXISTS raw_records_select ON raw_records;
*/

COMMIT;
