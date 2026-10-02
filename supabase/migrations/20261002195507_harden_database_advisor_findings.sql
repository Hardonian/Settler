-- capacity_alerts is an internal scheduled helper, not a Data API RPC.
ALTER FUNCTION public.capacity_alerts()
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.capacity_alerts()
  FROM PUBLIC, anon, authenticated;

-- Cost rollups are internal billing data. Materialized views do not support
-- RLS, so remove direct browser-role access and retain server-role access.
REVOKE ALL ON TABLE public.mv_usage_daily_costs
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.mv_usage_daily_costs TO service_role;
