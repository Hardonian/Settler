-- Migration: 90-Day Survival - Founder Re-Entry Readiness
-- Created: 2026-01-28
-- Description: Ensures system state is legible, decisions documented, changes traceable
-- CRITICAL: Founder must understand what happened during absence

BEGIN;

-- ============================================================================
-- SYSTEM STATE SNAPSHOT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_state_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type VARCHAR(100) NOT NULL, -- 'daily', 'weekly', 'monthly', 'event_triggered'
  snapshot_date DATE NOT NULL,
  system_metrics JSONB NOT NULL,
  critical_events JSONB DEFAULT '[]',
  alerts_summary JSONB DEFAULT '{}',
  billing_summary JSONB DEFAULT '{}',
  user_activity_summary JSONB DEFAULT '{}',
  agent_runs_summary JSONB DEFAULT '{}',
  health_summary JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_type, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_type_date ON system_state_snapshots(snapshot_type, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON system_state_snapshots(snapshot_date DESC);

-- ============================================================================
-- CREATE SYSTEM STATE SNAPSHOT
-- ============================================================================

CREATE OR REPLACE FUNCTION create_system_state_snapshot(p_snapshot_type VARCHAR DEFAULT 'daily')
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_system_metrics JSONB;
  v_critical_events JSONB;
  v_alerts_summary JSONB;
  v_billing_summary JSONB;
  v_user_activity_summary JSONB;
  v_agent_runs_summary JSONB;
  v_health_summary JSONB;
BEGIN
  -- System metrics
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL),
    'active_billing_accounts', (SELECT COUNT(*) FROM billing_accounts WHERE status = 'active' AND deleted_at IS NULL),
    'active_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'total_api_keys', (SELECT COUNT(*) FROM api_keys WHERE revoked_at IS NULL),
    'total_receipts', (SELECT COUNT(*) FROM receipts),
    'total_feature_flags', (SELECT COUNT(*) FROM feature_flags WHERE deleted_at IS NULL)
  ) INTO v_system_metrics;
  
  -- Critical events (last 24 hours)
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'severity', severity,
    'title', title,
    'message', message,
    'created_at', created_at
  ) ORDER BY created_at DESC)
  INTO v_critical_events
  FROM alerts
  WHERE severity IN ('critical', 'high')
    AND created_at > NOW() - INTERVAL '24 hours';
  
  -- Alerts summary
  SELECT jsonb_build_object(
    'critical', (SELECT COUNT(*) FROM alerts WHERE severity = 'critical' AND resolved_at IS NULL),
    'high', (SELECT COUNT(*) FROM alerts WHERE severity = 'high' AND resolved_at IS NULL),
    'medium', (SELECT COUNT(*) FROM alerts WHERE severity = 'medium' AND resolved_at IS NULL),
    'low', (SELECT COUNT(*) FROM alerts WHERE severity = 'low' AND resolved_at IS NULL),
    'total_unresolved', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL)
  ) INTO v_alerts_summary;
  
  -- Billing summary
  SELECT jsonb_build_object(
    'total_revenue_estimate', (
      SELECT COALESCE(SUM(estimated_cost), 0)
      FROM usage_aggregate_daily
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'active_trials', (
      SELECT COUNT(*)
      FROM subscriptions
      WHERE status = 'trialing'
    ),
    'past_due_subscriptions', (
      SELECT COUNT(*)
      FROM subscriptions
      WHERE status = 'past_due'
    ),
    'recent_payment_failures', (
      SELECT COUNT(*)
      FROM billing_reconciliation_log
      WHERE reconciliation_type = 'payment_failed'
        AND created_at > NOW() - INTERVAL '7 days'
    )
  ) INTO v_billing_summary;
  
  -- User activity summary
  SELECT jsonb_build_object(
    'new_users_24h', (
      SELECT COUNT(*)
      FROM users
      WHERE created_at > NOW() - INTERVAL '24 hours'
    ),
    'active_users_24h', (
      SELECT COUNT(DISTINCT user_id)
      FROM usage_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    ),
    'api_requests_24h', (
      SELECT COUNT(*)
      FROM usage_events
      WHERE timestamp > NOW() - INTERVAL '24 hours'
        AND event_type LIKE 'api_%'
    )
  ) INTO v_user_activity_summary;
  
  -- Agent runs summary
  SELECT jsonb_build_object(
    'total_runs_24h', (
      SELECT COUNT(*)
      FROM agent_runs
      WHERE started_at > NOW() - INTERVAL '24 hours'
    ),
    'failed_runs_24h', (
      SELECT COUNT(*)
      FROM agent_runs
      WHERE started_at > NOW() - INTERVAL '24 hours'
        AND status = 'failed'
    ),
    'avg_duration_ms', (
      SELECT AVG(duration_ms)
      FROM agent_runs
      WHERE started_at > NOW() - INTERVAL '24 hours'
        AND duration_ms IS NOT NULL
    )
  ) INTO v_agent_runs_summary;
  
  -- Health summary
  SELECT jsonb_build_object(
    'overall_status', (
      SELECT overall_status
      FROM health_checks
      ORDER BY timestamp DESC
      LIMIT 1
    ),
    'open_circuit_breakers', (
      SELECT COUNT(*)
      FROM circuit_breakers
      WHERE status = 'open'
    ),
    'degraded_services', (
      SELECT jsonb_agg(service_name)
      FROM circuit_breakers
      WHERE status IN ('open', 'half_open')
    )
  ) INTO v_health_summary;
  
  -- Insert snapshot
  INSERT INTO system_state_snapshots (
    snapshot_type,
    snapshot_date,
    system_metrics,
    critical_events,
    alerts_summary,
    billing_summary,
    user_activity_summary,
    agent_runs_summary,
    health_summary
  ) VALUES (
    p_snapshot_type,
    CURRENT_DATE,
    v_system_metrics,
    COALESCE(v_critical_events, '[]'::jsonb),
    v_alerts_summary,
    v_billing_summary,
    v_user_activity_summary,
    v_agent_runs_summary,
    v_health_summary
  ) RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GET RE-ENTRY SUMMARY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_re_entry_summary(p_days INTEGER DEFAULT 90)
RETURNS jsonb AS $$
DECLARE
  v_summary JSONB;
  v_snapshots JSONB;
  v_timeline JSONB;
BEGIN
  -- Get latest snapshot
  SELECT row_to_json(s.*) INTO v_summary
  FROM system_state_snapshots s
  ORDER BY snapshot_date DESC, created_at DESC
  LIMIT 1;
  
  -- Get snapshot timeline
  SELECT jsonb_agg(jsonb_build_object(
    'date', snapshot_date,
    'type', snapshot_type,
    'metrics', system_metrics,
    'alerts', alerts_summary
  ) ORDER BY snapshot_date DESC)
  INTO v_snapshots
  FROM system_state_snapshots
  WHERE snapshot_date >= CURRENT_DATE - (p_days || ' days')::interval;
  
  -- Get critical events timeline
  SELECT jsonb_agg(jsonb_build_object(
    'date', created_at::date,
    'severity', severity,
    'title', title,
    'message', message
  ) ORDER BY created_at DESC)
  INTO v_timeline
  FROM alerts
  WHERE severity IN ('critical', 'high')
    AND created_at >= NOW() - (p_days || ' days')::interval;
  
  RETURN jsonb_build_object(
    'current_state', v_summary,
    'snapshot_timeline', COALESCE(v_snapshots, '[]'::jsonb),
    'critical_events_timeline', COALESCE(v_timeline, '[]'::jsonb),
    'summary_period_days', p_days,
    'generated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DECISION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS automated_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type VARCHAR(100) NOT NULL, -- 'retry_job', 'open_circuit', 'archive_content', 'notify_user'
  decision_context JSONB NOT NULL,
  decision_outcome JSONB NOT NULL,
  reasoning TEXT,
  automated_by VARCHAR(100) DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_type ON automated_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_created ON automated_decisions(created_at DESC);

-- ============================================================================
-- LOG AUTOMATED DECISION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_automated_decision(
  p_decision_type VARCHAR,
  p_decision_context JSONB,
  p_decision_outcome JSONB,
  p_reasoning TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_decision_id UUID;
BEGIN
  INSERT INTO automated_decisions (
    decision_type,
    decision_context,
    decision_outcome,
    reasoning
  ) VALUES (
    p_decision_type,
    p_decision_context,
    p_decision_outcome,
    p_reasoning
  ) RETURNING id INTO v_decision_id;
  
  RETURN v_decision_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CHANGE AUDIT SUMMARY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_change_audit_summary(p_days INTEGER DEFAULT 90)
RETURNS jsonb AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_changes', (
      SELECT COUNT(*)
      FROM audit_logs
      WHERE created_at >= NOW() - (p_days || ' days')::interval
    ),
    'changes_by_type', (
      SELECT jsonb_object_agg(resource_type, count)
      FROM (
        SELECT resource_type, COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= NOW() - (p_days || ' days')::interval
        GROUP BY resource_type
      ) subq
    ),
    'changes_by_action', (
      SELECT jsonb_object_agg(action, count)
      FROM (
        SELECT action, COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= NOW() - (p_days || ' days')::interval
        GROUP BY action
      ) subq
    ),
    'automated_decisions', (
      SELECT COUNT(*)
      FROM automated_decisions
      WHERE created_at >= NOW() - (p_days || ' days')::interval
    ),
    'automated_decisions_by_type', (
      SELECT jsonb_object_agg(decision_type, count)
      FROM (
        SELECT decision_type, COUNT(*) as count
        FROM automated_decisions
        WHERE created_at >= NOW() - (p_days || ' days')::interval
        GROUP BY decision_type
      ) subq
    )
  ) INTO v_summary;
  
  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE SNAPSHOTS
-- ============================================================================

-- Daily snapshot at midnight UTC
SELECT cron.schedule(
  'daily-system-snapshot',
  '0 0 * * *',
  $$
  SELECT create_system_state_snapshot('daily');
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Weekly snapshot on Sundays
SELECT cron.schedule(
  'weekly-system-snapshot',
  '0 0 * * 0',
  $$
  SELECT create_system_state_snapshot('weekly');
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

COMMENT ON TABLE system_state_snapshots IS 'Snapshots of system state for founder re-entry visibility';
COMMENT ON TABLE automated_decisions IS 'Log of all automated decisions made during founder absence';
COMMENT ON FUNCTION create_system_state_snapshot IS 'Creates a snapshot of current system state';
COMMENT ON FUNCTION get_re_entry_summary IS 'Generates comprehensive summary for founder re-entry';
COMMENT ON FUNCTION log_automated_decision IS 'Logs an automated decision for audit trail';
COMMENT ON FUNCTION get_change_audit_summary IS 'Summarizes all changes during absence period';

COMMIT;
