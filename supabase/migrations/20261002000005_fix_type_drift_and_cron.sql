-- Fix live-environment defects found in the 2026-10-02 production-readiness sweep:
--
-- 1. Type drift: usage_aggregate_daily.integration_id was uuid while the
--    declared schema (UsageAggregateDaily.integrationId) and sibling table
--    usage_events.integration_id use TEXT slugs ('stripe', 'shopify', ...).
--    The mismatch failed public.rollup_usage_5m() on every 5-minute cron run.
--    The dependent materialized view is rebuilt identically (drop+create is
--    idempotent here; DROP MATERIALIZED VIEW is not a ledger-destructive op).
-- 2. approvers.approval_threshold was numeric while the model declares Int
--    (table empty at fix time).
-- 3. public.capacity_alerts() overflowed int4 computing 50*1024^3
--    ("integer out of range" every 15 minutes). Literal is now bigint.
-- 4. pg_cron job 28 posted to edge function 'agent-monitor', which is not
--    deployed among the project's functions. Job disabled (idempotent guard);
--    re-enable with cron.schedule once the function exists.

DROP MATERIALIZED VIEW IF EXISTS mv_usage_daily_costs;
ALTER TABLE usage_aggregate_daily ALTER COLUMN integration_id TYPE text USING integration_id::text;
CREATE MATERIALIZED VIEW mv_usage_daily_costs AS
 SELECT billing_account_id,
    project_id,
    tenant_id,
    date,
    event_type,
    integration_id,
    add_on_id,
    total_quantity,
    event_count,
    COALESCE(estimated_cost, 0::numeric) AS estimated_cost
   FROM usage_aggregate_daily uad;
CREATE UNIQUE INDEX idx_mv_usage_daily_pk ON public.mv_usage_daily_costs USING btree (billing_account_id, project_id, date, event_type, integration_id, add_on_id);

ALTER TABLE approvers ALTER COLUMN approval_threshold TYPE integer USING approval_threshold::integer;

CREATE OR REPLACE FUNCTION public.capacity_alerts() RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.capacity_signals ORDER BY collected_at DESC LIMIT 1;
  IF r.total_db_size_bytes IS NOT NULL AND r.total_db_size_bytes > 50::bigint*1024*1024*1024 THEN
    PERFORM checks.log_alert('DB size over 50GB, consider read replicas and partitioning');
  END IF;
  IF r.active_connections IS NOT NULL AND r.active_connections > 80 THEN
    PERFORM checks.log_alert('High active connections, consider pooling and read replicas');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 28) THEN
    PERFORM cron.unschedule(28);
  END IF;
END $$;
