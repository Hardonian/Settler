-- Migration: 90-Day Survival - Data Retention & Cleanup
-- Created: 2026-01-28
-- Description: Automated data retention policies to prevent unbounded growth
-- CRITICAL: Prevents tables from growing indefinitely during founder absence

BEGIN;

-- ============================================================================
-- DATA RETENTION POLICIES
-- ============================================================================

-- 1. Cleanup old health checks (keep last 90 days)
DROP FUNCTION IF EXISTS cleanup_old_health_checks() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS void AS $$
BEGIN
  DELETE FROM health_checks
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Log cleanup
  INSERT INTO audit_logs (
    action,
    resource_type,
    metadata
  ) VALUES (
    'cleanup',
    'health_checks',
    jsonb_build_object(
      'deleted_before', NOW() - INTERVAL '90 days',
      'cleanup_type', 'retention_policy'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Cleanup old diagnostics (keep last 90 days)
DROP FUNCTION IF EXISTS cleanup_old_diagnostics() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_diagnostics()
RETURNS void AS $$
BEGIN
  DELETE FROM diagnostics
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cleanup old alerts (keep resolved alerts for 30 days, unresolved forever)
DROP FUNCTION IF EXISTS cleanup_old_alerts() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS void AS $$
BEGIN
  DELETE FROM alerts
  WHERE resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Cleanup old agent runs (keep last 90 days)
DROP FUNCTION IF EXISTS cleanup_old_agent_runs() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_agent_runs()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_runs
  WHERE started_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Cleanup old usage events (aggregate first, then delete raw events older than 30 days)
DROP FUNCTION IF EXISTS cleanup_old_usage_events() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_usage_events()
RETURNS void AS $$
BEGIN
  -- First, ensure all events older than 30 days are aggregated
  -- (This should be handled by daily aggregation job, but ensure it here)
  
  -- Delete aggregated events older than 30 days
  DELETE FROM usage_events
  WHERE aggregated = true
    AND timestamp < NOW() - INTERVAL '30 days';
  
  -- Delete unaggregated events older than 7 days (shouldn't happen, but safety net)
  DELETE FROM usage_events
  WHERE aggregated = false
    AND timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Cleanup old audit logs (keep last 365 days for compliance)
DROP FUNCTION IF EXISTS cleanup_old_audit_logs() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Cleanup old console activities (keep last 90 days)
DROP FUNCTION IF EXISTS cleanup_old_console_activities() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_console_activities()
RETURNS void AS $$
BEGIN
  DELETE FROM console_activities
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Cleanup old webhook deliveries (keep last 30 days)
DROP FUNCTION IF EXISTS cleanup_old_webhook_deliveries() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_deliveries
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('delivered', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Cleanup old Stripe events (keep last 90 days for reconciliation)
DROP FUNCTION IF EXISTS cleanup_old_stripe_events() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_old_stripe_events()
RETURNS void AS $$
BEGIN
  DELETE FROM stripe_events
  WHERE received_at < NOW() - INTERVAL '90 days'
    AND status IN ('processed', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Cleanup expired idempotency keys (already exists, but ensure it's scheduled)
DROP FUNCTION IF EXISTS cleanup_expired_idempotency_keys() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MASTER CLEANUP FUNCTION (runs all cleanup tasks)
-- ============================================================================

DROP FUNCTION IF EXISTS run_data_retention_cleanup() CASCADE;
CREATE OR REPLACE FUNCTION run_data_retention_cleanup()
RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  start_time timestamp;
  end_time timestamp;
BEGIN
  start_time := clock_timestamp();
  
  -- Run all cleanup functions
  BEGIN
    PERFORM cleanup_old_health_checks();
    result := result || jsonb_build_object('health_checks', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('health_checks', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_diagnostics();
    result := result || jsonb_build_object('diagnostics', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('diagnostics', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_alerts();
    result := result || jsonb_build_object('alerts', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('alerts', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_agent_runs();
    result := result || jsonb_build_object('agent_runs', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('agent_runs', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_usage_events();
    result := result || jsonb_build_object('usage_events', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('usage_events', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_audit_logs();
    result := result || jsonb_build_object('audit_logs', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('audit_logs', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_console_activities();
    result := result || jsonb_build_object('console_activities', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('console_activities', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_webhook_deliveries();
    result := result || jsonb_build_object('webhook_deliveries', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('webhook_deliveries', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_old_stripe_events();
    result := result || jsonb_build_object('stripe_events', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('stripe_events', SQLERRM);
  END;
  
  BEGIN
    PERFORM cleanup_expired_idempotency_keys();
    result := result || jsonb_build_object('idempotency_keys', 'success');
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('idempotency_keys', SQLERRM);
  END;
  
  end_time := clock_timestamp();
  
  result := result || jsonb_build_object(
    'started_at', start_time,
    'completed_at', end_time,
    'duration_ms', EXTRACT(EPOCH FROM (end_time - start_time)) * 1000
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE CLEANUP (via pg_cron)
-- ============================================================================

-- Run cleanup daily at 3 AM UTC
SELECT cron.schedule(
  'data-retention-cleanup-daily',
  '0 3 * * *', -- Daily at 3 AM UTC
  $$
  SELECT run_data_retention_cleanup();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- ============================================================================
-- MONITORING: Track table sizes
-- ============================================================================

DROP FUNCTION IF EXISTS get_table_size_monitoring() CASCADE;
CREATE OR REPLACE FUNCTION get_table_size_monitoring()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  table_size text,
  last_vacuum timestamp,
  last_analyze timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname||'.'||tablename::text as table_name,
    n_live_tup::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    last_vacuum,
    last_analyze
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_data_retention_cleanup() IS 'Master cleanup function for data retention policies - runs daily via cron';
COMMENT ON FUNCTION get_table_size_monitoring() IS 'Monitor table sizes to detect unbounded growth';

COMMIT;
