-- Migration: 90-Day Survival - Drift & Staleness Detection
-- Created: 2026-01-28
-- Description: Detects stale content, outdated assumptions, documentation drift
-- CRITICAL: System must self-correct and flag misleading content

BEGIN;

-- ============================================================================
-- STALENESS TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS staleness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(100) NOT NULL, -- 'documentation', 'feature_flag', 'pricing', 'api_schema', 'help_content'
  content_id UUID,
  content_key VARCHAR(255), -- For non-UUID content (e.g., API endpoint path)
  last_updated TIMESTAMPTZ,
  staleness_threshold_days INTEGER DEFAULT 90,
  is_stale BOOLEAN DEFAULT false,
  flagged_at TIMESTAMPTZ,
  auto_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staleness_content ON staleness_checks(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_staleness_stale ON staleness_checks(is_stale) WHERE is_stale = true;
CREATE INDEX IF NOT EXISTS idx_staleness_updated ON staleness_checks(last_updated);

-- ============================================================================
-- DETECT STALE CONTENT
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_stale_content()
RETURNS jsonb AS $$
DECLARE
  v_content RECORD;
  v_result jsonb := '[]'::jsonb;
  v_stale_count INTEGER := 0;
  v_days_old INTEGER;
BEGIN
  -- Check feature flags (should be reviewed monthly)
  FOR v_content IN
    SELECT 
      id,
      'feature_flag' as content_type,
      updated_at as last_updated,
      30 as threshold_days
    FROM feature_flags
    WHERE deleted_at IS NULL
      AND updated_at < NOW() - INTERVAL '30 days'
  LOOP
    v_days_old := EXTRACT(EPOCH FROM (NOW() - v_content.last_updated)) / 86400;
    
    -- Check if already flagged
    IF NOT EXISTS (
      SELECT 1 FROM staleness_checks
      WHERE content_type = v_content.content_type
        AND content_id = v_content.id
        AND is_stale = true
    ) THEN
      INSERT INTO staleness_checks (
        content_type,
        content_id,
        last_updated,
        staleness_threshold_days,
        is_stale,
        flagged_at
      ) VALUES (
        v_content.content_type,
        v_content.id,
        v_content.last_updated,
        v_content.threshold_days,
        true,
        NOW()
      );
      
      v_stale_count := v_stale_count + 1;
      v_result := v_result || jsonb_build_object(
        'content_type', v_content.content_type,
        'content_id', v_content.id,
        'days_old', v_days_old
      );
    END IF;
  END LOOP;
  
  -- Check API keys (should be rotated periodically)
  FOR v_content IN
    SELECT 
      id,
      'api_key' as content_type,
      created_at as last_updated,
      180 as threshold_days -- 6 months
    FROM api_keys
    WHERE revoked_at IS NULL
      AND created_at < NOW() - INTERVAL '180 days'
  LOOP
    v_days_old := EXTRACT(EPOCH FROM (NOW() - v_content.last_updated)) / 86400;
    
    IF NOT EXISTS (
      SELECT 1 FROM staleness_checks
      WHERE content_type = v_content.content_type
        AND content_id = v_content.id
        AND is_stale = true
    ) THEN
      INSERT INTO staleness_checks (
        content_type,
        content_id,
        last_updated,
        staleness_threshold_days,
        is_stale,
        flagged_at
      ) VALUES (
        v_content.content_type,
        v_content.id,
        v_content.last_updated,
        v_content.threshold_days,
        true,
        NOW()
      );
      
      v_stale_count := v_stale_count + 1;
    END IF;
  END LOOP;
  
  -- Check subscriptions (should be reviewed if unchanged for 90 days)
  FOR v_content IN
    SELECT 
      id,
      'subscription' as content_type,
      updated_at as last_updated,
      90 as threshold_days
    FROM subscriptions
    WHERE status = 'active'
      AND updated_at < NOW() - INTERVAL '90 days'
  LOOP
    v_days_old := EXTRACT(EPOCH FROM (NOW() - v_content.last_updated)) / 86400;
    
    IF NOT EXISTS (
      SELECT 1 FROM staleness_checks
      WHERE content_type = v_content.content_type
        AND content_id = v_content.id
        AND is_stale = true
    ) THEN
      INSERT INTO staleness_checks (
        content_type,
        content_id,
        last_updated,
        staleness_threshold_days,
        is_stale,
        flagged_at
      ) VALUES (
        v_content.content_type,
        v_content.id,
        v_content.last_updated,
        v_content.threshold_days,
        true,
        NOW()
      );
      
      v_stale_count := v_stale_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'stale_items_found', v_stale_count,
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-ARCHIVE VERY STALE CONTENT
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_archive_stale_content()
RETURNS jsonb AS $$
DECLARE
  v_stale RECORD;
  v_result jsonb := '[]'::jsonb;
  v_archived_count INTEGER := 0;
BEGIN
  -- Archive content that's been stale for 2x the threshold
  FOR v_stale IN
    SELECT *
    FROM staleness_checks
    WHERE is_stale = true
      AND auto_archived = false
      AND last_updated < NOW() - (staleness_threshold_days * 2 || ' days')::interval
    LIMIT 50
  LOOP
    BEGIN
      -- Archive based on content type
      CASE v_stale.content_type
        WHEN 'feature_flag' THEN
          -- Soft delete feature flag
          UPDATE feature_flags
          SET deleted_at = NOW()
          WHERE id = v_stale.content_id;
        
        WHEN 'api_key' THEN
          -- Don't auto-revoke API keys (security risk)
          -- Just flag for review
          NULL;
        
        ELSE
          -- For other types, just mark as archived
          NULL;
      END CASE;
      
      -- Mark as archived
      UPDATE staleness_checks
      SET 
        auto_archived = true,
        archived_at = NOW()
      WHERE id = v_stale.id;
      
      v_archived_count := v_archived_count + 1;
      v_result := v_result || jsonb_build_object(
        'content_type', v_stale.content_type,
        'content_id', v_stale.content_id,
        'action', 'archived'
      );
      
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object(
        'content_type', v_stale.content_type,
        'content_id', v_stale.content_id,
        'action', 'error',
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'archived_count', v_archived_count,
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DETECT ASSUMPTION DRIFT
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_assumption_drift()
RETURNS jsonb AS $$
DECLARE
  v_drift RECORD;
  v_result jsonb := '[]'::jsonb;
  v_drift_count INTEGER := 0;
BEGIN
  -- Check for subscriptions with usage patterns that don't match plan
  FOR v_drift IN
    SELECT 
      s.id as subscription_id,
      s.plan_id,
      ba.id as billing_account_id,
      COUNT(ue.id) as usage_count,
      SUM(ue.quantity) as total_usage
    FROM subscriptions s
    JOIN billing_accounts ba ON ba.id = s.billing_account_id
    LEFT JOIN usage_events ue ON ue.billing_account_id = ba.id
      AND ue.timestamp > NOW() - INTERVAL '30 days'
    WHERE s.status = 'active'
    GROUP BY s.id, s.plan_id, ba.id
    HAVING 
      -- Free plan with high usage
      (s.plan_id = 'free' AND COUNT(ue.id) > 1000)
      OR
      -- Pro plan with no usage (might need downgrade)
      (s.plan_id = 'pro' AND COUNT(ue.id) = 0)
  LOOP
    v_drift_count := v_drift_count + 1;
    
    -- Create alert for assumption drift
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'medium',
      'Subscription Usage Pattern Drift',
      format('Subscription %s has usage pattern that may not match plan %s', 
        v_drift.subscription_id, v_drift.plan_id),
      'assumption_drift',
      jsonb_build_object(
        'subscription_id', v_drift.subscription_id,
        'plan_id', v_drift.plan_id,
        'usage_count', v_drift.usage_count,
        'total_usage', v_drift.total_usage
      )
    );
    
    v_result := v_result || jsonb_build_object(
      'subscription_id', v_drift.subscription_id,
      'drift_type', 'usage_pattern',
      'plan_id', v_drift.plan_id
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'drift_detections', v_drift_count,
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FRESHNESS CHECK FOR CRITICAL DATA
-- ============================================================================

CREATE OR REPLACE FUNCTION check_data_freshness()
RETURNS jsonb AS $$
DECLARE
  v_freshness RECORD;
  v_result jsonb := '{}'::jsonb;
BEGIN
  -- Check health checks freshness (should run every 5 minutes)
  SELECT 
    MAX(timestamp) as last_check,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '10 minutes') as recent_checks
  INTO v_freshness
  FROM health_checks
  WHERE timestamp > NOW() - INTERVAL '1 hour';
  
  IF v_freshness.last_check IS NULL OR 
     v_freshness.last_check < NOW() - INTERVAL '10 minutes' THEN
    -- Health checks are stale
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'high',
      'Health Checks Stale',
      format('Last health check was %s minutes ago', 
        EXTRACT(EPOCH FROM (NOW() - COALESCE(v_freshness.last_check, NOW()))) / 60),
      'data_freshness',
      jsonb_build_object(
        'last_check', v_freshness.last_check,
        'recent_checks', v_freshness.recent_checks
      )
    );
    
    v_result := v_result || jsonb_build_object(
      'health_checks', jsonb_build_object(
        'stale', true,
        'last_check', v_freshness.last_check
      )
    );
  END IF;
  
  -- Check agent runs freshness
  SELECT 
    MAX(started_at) as last_run,
    COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '1 hour') as recent_runs
  INTO v_freshness
  FROM agent_runs
  WHERE started_at > NOW() - INTERVAL '24 hours';
  
  IF v_freshness.last_run IS NULL OR 
     v_freshness.last_run < NOW() - INTERVAL '2 hours' THEN
    v_result := v_result || jsonb_build_object(
      'agent_runs', jsonb_build_object(
        'stale', true,
        'last_run', v_freshness.last_run
      )
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE DRIFT DETECTION
-- ============================================================================

-- Detect stale content daily
SELECT cron.schedule(
  'detect-stale-content',
  '0 6 * * *',
  $$
  SELECT detect_stale_content();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Auto-archive very stale content weekly
SELECT cron.schedule(
  'auto-archive-stale-content',
  '0 7 * * 0',
  $$
  SELECT auto_archive_stale_content();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Detect assumption drift weekly
SELECT cron.schedule(
  'detect-assumption-drift',
  '0 8 * * 0',
  $$
  SELECT detect_assumption_drift();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Check data freshness every hour
SELECT cron.schedule(
  'check-data-freshness',
  '0 * * * *',
  $$
  SELECT check_data_freshness();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

COMMENT ON TABLE staleness_checks IS 'Tracks content staleness to prevent misleading information';
COMMENT ON FUNCTION detect_stale_content IS 'Detects stale content that may be misleading';
COMMENT ON FUNCTION auto_archive_stale_content IS 'Automatically archives very stale content';
COMMENT ON FUNCTION detect_assumption_drift IS 'Detects when assumptions no longer match reality';
COMMENT ON FUNCTION check_data_freshness IS 'Checks freshness of critical monitoring data';

COMMIT;
