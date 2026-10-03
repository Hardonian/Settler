-- Scope alert_history: explicit tenant + separately-authorized global rows
-- (2026-10-03).
--
-- p10 audit: alert_history is tenant-scoped by contract (SECURITY_INVARIANTS
-- INV-2) but the operator alert service and its scheduled jobs emit GLOBAL
-- rows (tenant_id NULL), and the super-admin route reads across tenants.
-- tenant_id stays NULLABLE until those writers are migrated (per the hardening
-- constraint) — instead, the global scope is now EXPLICIT and separately
-- authorized:
--
--   * tenant rows (tenant_id NOT NULL): visible to members of that tenant.
--   * global rows (tenant_id NULL): visible ONLY to tenant admins — an
--     explicit, separately-authorized scope, not a wildcard.
--   * writes: service-side only (checks.log_alert / service_role); no browser
--     INSERT/UPDATE/DELETE policies exist (verified: zero policies before).
--
-- Single permissive policy (post-consolidation form; no overlap findings).

CREATE POLICY "alert_history_tenant_or_admin_global_read"
  ON public.alert_history
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    (tenant_id IN ( SELECT get_user_tenant_ids()))
    OR (tenant_id IS NULL AND COALESCE(is_admin(), false))
  );
