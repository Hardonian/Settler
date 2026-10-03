-- Optimize RLS policies to evaluate auth/current_setting once per statement
-- (2026-10-03). Supabase performance advisor flagged 19 auth_rls_initplan
-- findings: policies re-evaluating auth.uid()/auth.jwt()/current_setting() per
-- row. Remediation per the advisor's contract: wrap the volatile calls in
-- scalar subqueries so the planner treats them as initialization plans.
--
-- Semantics: auth.uid(), auth.jwt(), and current_setting() are constant within
-- a statement (tenant context is switched via separate set_tenant_context RPC
-- calls, never mid-statement), so per-row and per-statement evaluation are
-- identical. Policy shapes (commands, roles, USING/WITH CHECK pairing) are
-- preserved exactly via ALTER POLICY.

-- audit_logs.audit_logs_select_tenant
ALTER POLICY audit_logs_select_tenant ON public.audit_logs USING (((tenant_id IN ( SELECT get_user_tenant_ids() AS get_user_tenant_ids)) OR (user_id = (select auth.uid()))));

-- idempotency_keys.tenant_isolation_idempotency_keys
ALTER POLICY tenant_isolation_idempotency_keys ON public.idempotency_keys USING ((tenant_id = ((select current_setting('app.current_tenant_id'::text, true)))::uuid));

-- billing_accounts.billing_accounts_select_own
ALTER POLICY billing_accounts_select_own ON public.billing_accounts USING ((user_id = (select auth.uid())));

-- billing_accounts.billing_accounts_update_own
ALTER POLICY billing_accounts_update_own ON public.billing_accounts USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));

-- feature_flags.feature_flags_select
ALTER POLICY feature_flags_select ON public.feature_flags USING (((is_global = true) OR (billing_account_id IN ( SELECT billing_accounts.id
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid()))))));

-- receipt_uploads.receipt_uploads_select
ALTER POLICY receipt_uploads_select ON public.receipt_uploads USING ((billing_account_id IN ( SELECT billing_accounts.id
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid())))));

-- usage_aggregate_daily.usage_aggregate_daily_select
ALTER POLICY usage_aggregate_daily_select ON public.usage_aggregate_daily USING ((billing_account_id IN ( SELECT billing_accounts.id
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid())))));

-- subscriptions.subscriptions_select
ALTER POLICY subscriptions_select ON public.subscriptions USING ((billing_account_id IN ( SELECT billing_accounts.id
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid())))));

-- add_on_purchases.add_on_purchases_isolation
ALTER POLICY add_on_purchases_isolation ON public.add_on_purchases USING ((billing_account_id IN ( SELECT billing_accounts.id
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid()))))) WITH CHECK ((billing_account_id IN ( SELECT billing_accounts.id
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid())))));

-- recon_jobs.recon_jobs_insert
ALTER POLICY recon_jobs_insert ON public.recon_jobs WITH CHECK (((tenant_id IN ( SELECT get_user_tenant_ids() AS get_user_tenant_ids)) OR (tenant_id IN ( SELECT COALESCE(billing_accounts.tenant_id, billing_accounts.id) AS "coalesce"
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid()))))));

-- recon_jobs.recon_jobs_select
ALTER POLICY recon_jobs_select ON public.recon_jobs USING (((tenant_id IN ( SELECT get_user_tenant_ids() AS get_user_tenant_ids)) OR (tenant_id IN ( SELECT COALESCE(billing_accounts.tenant_id, billing_accounts.id) AS "coalesce"
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid()))))));

-- recon_jobs.recon_jobs_update
ALTER POLICY recon_jobs_update ON public.recon_jobs USING (((tenant_id IN ( SELECT get_user_tenant_ids() AS get_user_tenant_ids)) OR (tenant_id IN ( SELECT COALESCE(billing_accounts.tenant_id, billing_accounts.id) AS "coalesce"
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid())))))) WITH CHECK (((tenant_id IN ( SELECT get_user_tenant_ids() AS get_user_tenant_ids)) OR (tenant_id IN ( SELECT COALESCE(billing_accounts.tenant_id, billing_accounts.id) AS "coalesce"
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid()))))));

-- recon_results.recon_results_select
ALTER POLICY recon_results_select ON public.recon_results USING (((tenant_id IN ( SELECT get_user_tenant_ids() AS get_user_tenant_ids)) OR (tenant_id IN ( SELECT COALESCE(billing_accounts.tenant_id, billing_accounts.id) AS "coalesce"
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid()))))));

-- usage_events.usage_events_select
ALTER POLICY usage_events_select ON public.usage_events USING ((billing_account_id IN ( SELECT billing_accounts.id
   FROM billing_accounts
  WHERE (billing_accounts.user_id = (select auth.uid())))));

-- ingestion_dlq.tenant_isolation_ingestion_dlq
ALTER POLICY tenant_isolation_ingestion_dlq ON public.ingestion_dlq USING (((tenant_id = ((select current_setting('app.current_tenant_id'::text, true)))::uuid) OR (tenant_id IS NULL)));

-- decision_traces.decision_traces_owner_read
ALTER POLICY decision_traces_owner_read ON public.decision_traces USING ((org_id = ((select auth.jwt()) ->> 'sub'::text)));

-- reconciliation_spec_versions.reconciliation_spec_versions_tenant_isolation
ALTER POLICY reconciliation_spec_versions_tenant_isolation ON public.reconciliation_spec_versions USING (((org_id)::text = (select current_setting('request.jwt.claim.org_id'::text, true)))) WITH CHECK (((org_id)::text = (select current_setting('request.jwt.claim.org_id'::text, true))));

-- reconciliation_memory.reconciliation_memory_tenant_isolation
ALTER POLICY reconciliation_memory_tenant_isolation ON public.reconciliation_memory USING (((org_id)::text = (select current_setting('request.jwt.claim.org_id'::text, true)))) WITH CHECK (((org_id)::text = (select current_setting('request.jwt.claim.org_id'::text, true))));

-- reconciliation_codegen_artifacts.reconciliation_codegen_artifacts_tenant_isolation
ALTER POLICY reconciliation_codegen_artifacts_tenant_isolation ON public.reconciliation_codegen_artifacts USING (((org_id)::text = (select current_setting('request.jwt.claim.org_id'::text, true)))) WITH CHECK (((org_id)::text = (select current_setting('request.jwt.claim.org_id'::text, true))));
