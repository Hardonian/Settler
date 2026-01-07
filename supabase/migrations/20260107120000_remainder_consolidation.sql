-- ============================================================================
-- REMAINDER CONSOLIDATION MIGRATION (FINAL LAUNCH PREP)
-- ============================================================================
-- Covers all tables missing explicit policies in previous migrations.
-- Focuses on Site Builder, Experiments, Webhooks, Onboarding, and Metadata.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. UTILITY FUNCTIONS (Idempotent)
-- ============================================================================

-- Ensure get_user_tenant_ids exists (re-definition for safety/idempotency)
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
  
  -- Also check tenant_users if it exists (future proofing)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_users') THEN
    RETURN QUERY
    SELECT DISTINCT tu.tenant_id
    FROM tenant_users tu
    WHERE tu.user_id = auth.uid();
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;

-- ============================================================================
-- 2. SITE BUILDER & CMS (Tenants, Pages, Branding)
-- ============================================================================

-- tenant_branding
ALTER TABLE IF EXISTS tenant_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view branding for their tenants" ON tenant_branding;
CREATE POLICY "Users can view branding for their tenants"
  ON tenant_branding FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can update branding for their tenants" ON tenant_branding;
CREATE POLICY "Users can update branding for their tenants"
  ON tenant_branding FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can insert branding for their tenants" ON tenant_branding;
CREATE POLICY "Users can insert branding for their tenants"
  ON tenant_branding FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- tenant_navigation
ALTER TABLE IF EXISTS tenant_navigation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view navigation for their tenants" ON tenant_navigation;
CREATE POLICY "Users can view navigation for their tenants"
  ON tenant_navigation FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can update navigation for their tenants" ON tenant_navigation;
CREATE POLICY "Users can update navigation for their tenants"
  ON tenant_navigation FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can insert navigation for their tenants" ON tenant_navigation;
CREATE POLICY "Users can insert navigation for their tenants"
  ON tenant_navigation FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- tenant_pages
ALTER TABLE IF EXISTS tenant_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pages for their tenants" ON tenant_pages;
CREATE POLICY "Users can view pages for their tenants"
  ON tenant_pages FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can manage pages for their tenants" ON tenant_pages;
CREATE POLICY "Users can manage pages for their tenants"
  ON tenant_pages FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- tenant_page_revisions
ALTER TABLE IF EXISTS tenant_page_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view revisions for their pages" ON tenant_page_revisions;
CREATE POLICY "Users can view revisions for their pages"
  ON tenant_page_revisions FOR SELECT TO authenticated
  USING (
    tenant_page_id IN (
      SELECT id FROM tenant_pages WHERE tenant_id IN (SELECT public.get_user_tenant_ids())
    )
  );

DROP POLICY IF EXISTS "Users can create revisions for their pages" ON tenant_page_revisions;
CREATE POLICY "Users can create revisions for their pages"
  ON tenant_page_revisions FOR INSERT TO authenticated
  WITH CHECK (
    tenant_page_id IN (
      SELECT id FROM tenant_pages WHERE tenant_id IN (SELECT public.get_user_tenant_ids())
    )
  );

-- ============================================================================
-- 3. EXPERIMENTS & A/B TESTING
-- ============================================================================

-- experiments
ALTER TABLE IF EXISTS experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view experiments for their tenants" ON experiments;
CREATE POLICY "Users can view experiments for their tenants"
  ON experiments FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can manage experiments for their tenants" ON experiments;
CREATE POLICY "Users can manage experiments for their tenants"
  ON experiments FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- experiment_variants
ALTER TABLE IF EXISTS experiment_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view variants for their experiments" ON experiment_variants;
CREATE POLICY "Users can view variants for their experiments"
  ON experiment_variants FOR SELECT TO authenticated
  USING (
    experiment_id IN (
      SELECT id FROM experiments WHERE tenant_id IN (SELECT public.get_user_tenant_ids())
    )
  );

DROP POLICY IF EXISTS "Users can manage variants for their experiments" ON experiment_variants;
CREATE POLICY "Users can manage variants for their experiments"
  ON experiment_variants FOR ALL TO authenticated
  USING (
    experiment_id IN (
      SELECT id FROM experiments WHERE tenant_id IN (SELECT public.get_user_tenant_ids())
    )
  )
  WITH CHECK (
    experiment_id IN (
      SELECT id FROM experiments WHERE tenant_id IN (SELECT public.get_user_tenant_ids())
    )
  );

-- experiment_metric_events
ALTER TABLE IF EXISTS experiment_metric_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view metrics for their tenants" ON experiment_metric_events;
CREATE POLICY "Users can view metrics for their tenants"
  ON experiment_metric_events FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Anon can insert metrics" ON experiment_metric_events;
CREATE POLICY "Anon can insert metrics"
  ON experiment_metric_events FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Auth can insert metrics" ON experiment_metric_events;
CREATE POLICY "Auth can insert metrics"
  ON experiment_metric_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 4. WEBHOOKS & INTEGRATIONS
-- ============================================================================

-- webhooks
ALTER TABLE IF EXISTS webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their webhooks" ON webhooks;
CREATE POLICY "Users can manage their webhooks"
  ON webhooks FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- webhook_deliveries
ALTER TABLE IF EXISTS webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deliveries for their webhooks" ON webhook_deliveries;
CREATE POLICY "Users can view deliveries for their webhooks"
  ON webhook_deliveries FOR SELECT TO authenticated
  USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. ONBOARDING & INVITES
-- ============================================================================

-- onboarding_progress
ALTER TABLE IF EXISTS onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own onboarding" ON onboarding_progress;
CREATE POLICY "Users can manage their own onboarding"
  ON onboarding_progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- tenant_onboarding_progress
ALTER TABLE IF EXISTS tenant_onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their tenant onboarding" ON tenant_onboarding_progress;
CREATE POLICY "Users can manage their tenant onboarding"
  ON tenant_onboarding_progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- workspace_invites
ALTER TABLE IF EXISTS workspace_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invites for their tenants" ON workspace_invites;
CREATE POLICY "Users can view invites for their tenants"
  ON workspace_invites FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can create invites for their tenants" ON workspace_invites;
CREATE POLICY "Users can create invites for their tenants"
  ON workspace_invites FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

DROP POLICY IF EXISTS "Users can update/revoke invites for their tenants" ON workspace_invites;
CREATE POLICY "Users can update/revoke invites for their tenants"
  ON workspace_invites FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- ============================================================================
-- 6. SYSTEM & LOGS (Exports, Audits)
-- ============================================================================

-- exports
ALTER TABLE IF EXISTS exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their exports" ON exports;
CREATE POLICY "Users can manage their exports"
  ON exports FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- audit_logs
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

-- idempotency_keys
ALTER TABLE IF EXISTS idempotency_keys ENABLE ROW LEVEL SECURITY;
-- No explicit policies needed for client access; service role only.
-- Explicitly denying everything for authenticated/anon by default.

-- ============================================================================
-- 7. RECON METADATA (Templates, Rules)
-- ============================================================================

-- mapping_templates
ALTER TABLE IF EXISTS mapping_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public or own templates" ON mapping_templates;
CREATE POLICY "Users can view public or own templates"
  ON mapping_templates FOR SELECT TO authenticated
  USING (
    is_public = true OR
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

DROP POLICY IF EXISTS "Users can manage own templates" ON mapping_templates;
CREATE POLICY "Users can manage own templates"
  ON mapping_templates FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- validation_rules
ALTER TABLE IF EXISTS validation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public or own rules" ON validation_rules;
CREATE POLICY "Users can view public or own rules"
  ON validation_rules FOR SELECT TO authenticated
  USING (
    is_public = true OR
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

DROP POLICY IF EXISTS "Users can manage own rules" ON validation_rules;
CREATE POLICY "Users can manage own rules"
  ON validation_rules FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

-- transform_recipes
ALTER TABLE IF EXISTS transform_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public or own recipes" ON transform_recipes;
CREATE POLICY "Users can view public or own recipes"
  ON transform_recipes FOR SELECT TO authenticated
  USING (
    is_public = true OR
    tenant_id IN (SELECT public.get_user_tenant_ids())
  );

DROP POLICY IF EXISTS "Users can manage own recipes" ON transform_recipes;
CREATE POLICY "Users can manage own recipes"
  ON transform_recipes FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.get_user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_ids()));

COMMIT;
