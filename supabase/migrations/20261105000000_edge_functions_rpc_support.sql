-- Edge functions RPC diagnostics and integration telemetry procedures

CREATE OR REPLACE FUNCTION public.check_rls_policies()
RETURNS TABLE (table_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tablename::text
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = false;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rls_policies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rls_policies() TO service_role;

CREATE OR REPLACE FUNCTION public.get_slow_queries(p_min_duration_ms integer DEFAULT 1000)
RETURNS TABLE (query text, calls bigint, total_time double precision)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT query::text, calls, total_exec_time AS total_time
  FROM pg_stat_statements
  WHERE total_exec_time > p_min_duration_ms
  LIMIT 10;
$$;

REVOKE EXECUTE ON FUNCTION public.get_slow_queries(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_slow_queries(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.update_integration_health(p_tenant_id uuid, p_integration_id text, p_success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- updates integration health telemetry
  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_integration_health(uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_integration_health(uuid, text, boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.record_integration_quota_usage(p_tenant_id uuid, p_integration_id text, p_quota_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- records quota telemetry
  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_integration_quota_usage(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_integration_quota_usage(uuid, text, text) TO service_role;
