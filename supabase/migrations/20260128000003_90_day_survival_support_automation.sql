-- Migration: 90-Day Survival - Support Automation & User Guidance
-- Created: 2026-01-28
-- Description: Preemptive support, automated help, prevents silent churn
-- CRITICAL: Users must get help without human intervention

BEGIN;

-- ============================================================================
-- USER CONFUSION DETECTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_confusion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- 'error_repeated', 'feature_misuse', 'abandoned_flow', 'api_error_rate'
  severity VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  context JSONB DEFAULT '{}',
  auto_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  help_provided JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_confusion_user ON user_confusion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_confusion_unresolved ON user_confusion_events(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_confusion_type ON user_confusion_events(event_type);

-- ============================================================================
-- DETECT USER CONFUSION PATTERNS
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_user_confusion()
RETURNS jsonb AS $$
DECLARE
  v_user RECORD;
  v_result jsonb := '[]'::jsonb;
  v_error_count INTEGER;
  v_recent_errors INTEGER;
BEGIN
  -- Detect users with repeated errors in last hour
  FOR v_user IN
    SELECT 
      user_id,
      COUNT(*) as error_count,
      MAX(created_at) as last_error
    FROM error_logs
    WHERE created_at > NOW() - INTERVAL '1 hour'
      AND severity IN ('error', 'critical')
    GROUP BY user_id
    HAVING COUNT(*) >= 3 -- 3+ errors in an hour suggests confusion
  LOOP
    -- Check if we've already detected this
    IF NOT EXISTS (
      SELECT 1 FROM user_confusion_events
      WHERE user_id = v_user.user_id
        AND event_type = 'error_repeated'
        AND detected_at > NOW() - INTERVAL '1 hour'
    ) THEN
      INSERT INTO user_confusion_events (
        user_id,
        event_type,
        severity,
        context
      ) VALUES (
        v_user.user_id,
        'error_repeated',
        CASE 
          WHEN v_user.error_count >= 10 THEN 'critical'
          WHEN v_user.error_count >= 5 THEN 'high'
          ELSE 'medium'
        END,
        jsonb_build_object(
          'error_count', v_user.error_count,
          'last_error', v_user.last_error
        )
      );
      
      v_result := v_result || jsonb_build_object(
        'user_id', v_user.user_id,
        'type', 'error_repeated',
        'count', v_user.error_count
      );
    END IF;
  END LOOP;
  
  -- Detect abandoned API key creation flows
  FOR v_user IN
    SELECT DISTINCT user_id
    FROM audit_logs
    WHERE action = 'api_key_creation_started'
      AND created_at > NOW() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM audit_logs al2
        WHERE al2.user_id = audit_logs.user_id
          AND al2.action = 'api_key_created'
          AND al2.created_at > audit_logs.created_at
      )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM user_confusion_events
      WHERE user_id = v_user.user_id
        AND event_type = 'abandoned_flow'
        AND detected_at > NOW() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO user_confusion_events (
        user_id,
        event_type,
        severity,
        context
      ) VALUES (
        v_user.user_id,
        'abandoned_flow',
        'medium',
        jsonb_build_object('flow', 'api_key_creation')
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'detections', jsonb_array_length(v_result),
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTO-RESOLVE CONFUSION WITH GUIDANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_resolve_confusion(p_confusion_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_confusion RECORD;
  v_help_content JSONB;
BEGIN
  SELECT * INTO v_confusion
  FROM user_confusion_events
  WHERE id = p_confusion_id
    AND resolved_at IS NULL;
  
  IF v_confusion IS NULL THEN
    RETURN jsonb_build_object('error', 'Confusion event not found or already resolved');
  END IF;
  
  -- Generate help content based on event type
  CASE v_confusion.event_type
    WHEN 'error_repeated' THEN
      v_help_content := jsonb_build_object(
        'title', 'Having trouble?',
        'message', 'We noticed you encountered some errors. Here are some helpful resources:',
        'links', jsonb_build_array(
          jsonb_build_object('text', 'API Documentation', 'url', '/docs/api'),
          jsonb_build_object('text', 'Common Issues', 'url', '/docs/troubleshooting'),
          jsonb_build_object('text', 'Contact Support', 'url', '/support')
        ),
        'suggested_action', 'Check the error logs in your console for details'
      );
    
    WHEN 'abandoned_flow' THEN
      v_help_content := jsonb_build_object(
        'title', 'Need help creating an API key?',
        'message', 'Creating an API key is quick and easy. Here''s a guide:',
        'links', jsonb_build_array(
          jsonb_build_object('text', 'API Key Guide', 'url', '/docs/api-keys'),
          jsonb_build_object('text', 'Quick Start', 'url', '/docs/quick-start')
        ),
        'suggested_action', 'Follow our step-by-step guide'
      );
    
    ELSE
      v_help_content := jsonb_build_object(
        'title', 'How can we help?',
        'message', 'Check out our documentation or contact support.',
        'links', jsonb_build_array(
          jsonb_build_object('text', 'Documentation', 'url', '/docs'),
          jsonb_build_object('text', 'Support', 'url', '/support')
        )
      );
  END CASE;
  
  -- Update confusion event
  UPDATE user_confusion_events
  SET
    auto_resolved = true,
    resolved_at = NOW(),
    help_provided = v_help_content
  WHERE id = p_confusion_id;
  
  -- Create in-app notification (would integrate with notification system)
  -- For now, we'll log it to console_activities
  INSERT INTO console_activities (
    billing_account_id,
    action,
    details
  )
  SELECT 
    v_confusion.billing_account_id,
    'help_provided',
    jsonb_build_object(
      'confusion_event_id', p_confusion_id,
      'help_content', v_help_content
    )
  WHERE v_confusion.billing_account_id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'success', true,
    'confusion_id', p_confusion_id,
    'help_provided', v_help_content
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROCESS UNRESOLVED CONFUSION
-- ============================================================================

CREATE OR REPLACE FUNCTION process_unresolved_confusion()
RETURNS jsonb AS $$
DECLARE
  v_confusion RECORD;
  v_result jsonb := '[]'::jsonb;
  v_processed INTEGER := 0;
BEGIN
  -- Process unresolved confusion events older than 5 minutes
  FOR v_confusion IN
    SELECT *
    FROM user_confusion_events
    WHERE resolved_at IS NULL
      AND detected_at < NOW() - INTERVAL '5 minutes'
    ORDER BY 
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      detected_at ASC
    LIMIT 20
  LOOP
    BEGIN
      PERFORM auto_resolve_confusion(v_confusion.id);
      v_processed := v_processed + 1;
      v_result := v_result || jsonb_build_object(
        'confusion_id', v_confusion.id,
        'status', 'resolved'
      );
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object(
        'confusion_id', v_confusion.id,
        'status', 'error',
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed', v_processed,
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE SUPPORT AUTOMATION
-- ============================================================================

-- Detect confusion every 15 minutes
SELECT cron.schedule(
  'detect-user-confusion',
  '*/15 * * * *',
  $$
  SELECT detect_user_confusion();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Process unresolved confusion every 10 minutes
SELECT cron.schedule(
  'process-unresolved-confusion',
  '*/10 * * * *',
  $$
  SELECT process_unresolved_confusion();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

COMMENT ON TABLE user_confusion_events IS 'Tracks user confusion patterns to provide automated help';
COMMENT ON FUNCTION detect_user_confusion IS 'Detects patterns indicating user confusion or need for help';
COMMENT ON FUNCTION auto_resolve_confusion IS 'Automatically provides help content to resolve user confusion';

COMMIT;
