-- Correct permissive policies recovered from the live Supabase migration ledger.
-- The portfolio tables are server-only. Their original policies were named for
-- service_role but omitted TO service_role, so PostgreSQL applied them to PUBLIC.

DROP POLICY IF EXISTS "service_role_portfolios" ON public.portfolios;
CREATE POLICY "service_role_portfolios"
  ON public.portfolios FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_portfolio_entities" ON public.portfolio_entities;
CREATE POLICY "service_role_portfolio_entities"
  ON public.portfolio_entities FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_entity_performance" ON public.entity_performance;
CREATE POLICY "service_role_entity_performance"
  ON public.entity_performance FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_portfolio_rebalance_log" ON public.portfolio_rebalance_log;
CREATE POLICY "service_role_portfolio_rebalance_log"
  ON public.portfolio_rebalance_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_portfolio_intelligence_log" ON public.portfolio_intelligence_log;
CREATE POLICY "service_role_portfolio_intelligence_log"
  ON public.portfolio_intelligence_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_portfolio_risk_events" ON public.portfolio_risk_events;
CREATE POLICY "service_role_portfolio_risk_events"
  ON public.portfolio_risk_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Design-system persistence is user-owned. Restrict both the role and row
-- predicate instead of allowing every Data API role to access every row.
DROP POLICY IF EXISTS "Allow authenticated users to manage their themes" ON public.themes;
CREATE POLICY "themes_owner_all"
  ON public.themes FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to log events" ON public.interaction_events;
CREATE POLICY "interaction_events_owner_insert"
  ON public.interaction_events FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Trigger helpers are internal implementation details, not Data API RPCs.
-- Pin their lookup path and remove the default PUBLIC execute grant.
ALTER FUNCTION public.enforce_decision_trace_outcome_only_update()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.mark_welcome_step_on_signup()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_updated_at()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_updated_at_column()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_usage_export_chunks_updated_at()
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_rule_success_rate()
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.enforce_decision_trace_outcome_only_update()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_welcome_step_on_signup()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at_column()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_usage_export_chunks_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_rule_success_rate()
  FROM PUBLIC, anon, authenticated;
