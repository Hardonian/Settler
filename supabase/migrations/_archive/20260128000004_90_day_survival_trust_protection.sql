-- Migration: 90-Day Survival - Data Trust & Confidence Protection
-- Created: 2026-01-28
-- Description: Prevents false certainty, surfaces confidence scores, handles AI errors gracefully
-- CRITICAL: System must never silently produce misleading results

BEGIN;

-- ============================================================================
-- CONFIDENCE TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS confidence_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(100) NOT NULL, -- 'receipt_parse', 'reconciliation', 'ai_inference', 'data_extraction'
  source_id UUID,
  confidence_score DECIMAL(5, 4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  threshold DECIMAL(5, 4) DEFAULT 0.7, -- Minimum acceptable confidence
  result_data JSONB,
  metadata JSONB DEFAULT '{}',
  flagged_low_confidence BOOLEAN DEFAULT false,
  user_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_confidence_source ON confidence_events(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_confidence_score ON confidence_events(confidence_score);
CREATE INDEX IF NOT EXISTS idx_confidence_low ON confidence_events(flagged_low_confidence) WHERE flagged_low_confidence = true;

-- ============================================================================
-- LOG CONFIDENCE EVENT
-- ============================================================================

CREATE OR REPLACE FUNCTION log_confidence_event(
  p_source_type VARCHAR,
  p_source_id UUID,
  p_confidence_score DECIMAL,
  p_threshold DECIMAL DEFAULT 0.7,
  p_result_data JSONB DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_is_low BOOLEAN;
BEGIN
  v_is_low := p_confidence_score < p_threshold;
  
  INSERT INTO confidence_events (
    source_type,
    source_id,
    confidence_score,
    threshold,
    result_data,
    metadata,
    flagged_low_confidence
  ) VALUES (
    p_source_type,
    p_source_id,
    p_confidence_score,
    p_threshold,
    p_result_data,
    p_metadata,
    v_is_low
  ) RETURNING id INTO v_event_id;
  
  -- If low confidence, flag for user notification
  IF v_is_low THEN
    -- Update source record to indicate low confidence
    -- This depends on source type - for receipts, update receipt table
    IF p_source_type = 'receipt_parse' THEN
      UPDATE receipts
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'low_confidence', true,
        'confidence_score', p_confidence_score,
        'confidence_event_id', v_event_id
      )
      WHERE id = p_source_id;
    END IF;
  END IF;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DETECT LOW CONFIDENCE RESULTS
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_low_confidence_results()
RETURNS jsonb AS $$
DECLARE
  v_low_confidence RECORD;
  v_result jsonb := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  -- Find low confidence results from last 24 hours that haven't been notified
  FOR v_low_confidence IN
    SELECT *
    FROM confidence_events
    WHERE flagged_low_confidence = true
      AND user_notified = false
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY confidence_score ASC, created_at DESC
    LIMIT 50
  LOOP
    v_count := v_count + 1;
    
    -- Create alert for very low confidence (< 0.5)
    IF v_low_confidence.confidence_score < 0.5 THEN
      INSERT INTO alerts (
        severity,
        title,
        message,
        check_type,
        details
      ) VALUES (
        'high',
        'Very Low Confidence Result Detected',
        format('%s result has very low confidence (%.2f%%)', 
          v_low_confidence.source_type,
          v_low_confidence.confidence_score * 100),
        'low_confidence',
        jsonb_build_object(
          'source_type', v_low_confidence.source_type,
          'source_id', v_low_confidence.source_id,
          'confidence_score', v_low_confidence.confidence_score,
          'threshold', v_low_confidence.threshold
        )
      );
    END IF;
    
    -- Mark as notified (in practice, would send notification to user)
    UPDATE confidence_events
    SET user_notified = true
    WHERE id = v_low_confidence.id;
    
    v_result := v_result || jsonb_build_object(
      'event_id', v_low_confidence.id,
      'source_type', v_low_confidence.source_type,
      'confidence_score', v_low_confidence.confidence_score
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'low_confidence_count', v_count,
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENSURE RECEIPTS HAVE CONFIDENCE SCORES
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_receipt_confidence()
RETURNS jsonb AS $$
DECLARE
  v_receipt RECORD;
  v_result jsonb := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  -- Find receipts without confidence scores or with NULL confidence
  FOR v_receipt IN
    SELECT id, confidence_score
    FROM receipts
    WHERE confidence_score IS NULL
      AND created_at > NOW() - INTERVAL '7 days'
    LIMIT 100
  LOOP
    v_count := v_count + 1;
    
    -- Set default low confidence if missing
    UPDATE receipts
    SET 
      confidence_score = 0.5, -- Default to medium-low confidence
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'confidence_missing', true,
        'confidence_set_at', NOW()
      )
    WHERE id = v_receipt.id;
    
    -- Log confidence event
    PERFORM log_confidence_event(
      'receipt_parse',
      v_receipt.id,
      0.5,
      0.7,
      '{}'::jsonb,
      jsonb_build_object('reason', 'missing_confidence_score')
    );
    
    v_result := v_result || jsonb_build_object(
      'receipt_id', v_receipt.id,
      'action', 'confidence_set'
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'receipts_updated', v_count,
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VALIDATE DATA INTEGRITY
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_data_integrity()
RETURNS jsonb AS $$
DECLARE
  v_issue RECORD;
  v_result jsonb := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  -- Check for receipts with impossible values
  FOR v_issue IN
    SELECT id, total, subtotal, tax
    FROM receipts
    WHERE total IS NOT NULL
      AND subtotal IS NOT NULL
      AND tax IS NOT NULL
      AND ABS(total - (subtotal + tax)) > 0.01 -- More than 1 cent discrepancy
      AND created_at > NOW() - INTERVAL '7 days'
  LOOP
    v_count := v_count + 1;
    
    -- Flag as potential data integrity issue
    UPDATE receipts
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'integrity_warning', true,
      'discrepancy', ABS(v_issue.total - (v_issue.subtotal + v_issue.tax)),
      'flagged_at', NOW()
    )
    WHERE id = v_issue.id;
    
    v_result := v_result || jsonb_build_object(
      'receipt_id', v_issue.id,
      'issue', 'total_mismatch',
      'discrepancy', ABS(v_issue.total - (v_issue.subtotal + v_issue.tax))
    );
  END LOOP;
  
  -- Check for reconciliation results with impossible confidence
  FOR v_issue IN
    SELECT id, confidence_avg
    FROM recon_results
    WHERE confidence_avg IS NOT NULL
      AND (confidence_avg < 0 OR confidence_avg > 1)
  LOOP
    v_count := v_count + 1;
    
    -- Fix invalid confidence
    UPDATE recon_results
    SET confidence_avg = GREATEST(0, LEAST(1, confidence_avg))
    WHERE id = v_issue.id;
    
    v_result := v_result || jsonb_build_object(
      'recon_result_id', v_issue.id,
      'issue', 'invalid_confidence',
      'original_confidence', v_issue.confidence_avg
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'issues_found', v_count,
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE TRUST PROTECTION JOBS
-- ============================================================================

-- Detect low confidence every hour
SELECT cron.schedule(
  'detect-low-confidence',
  '0 * * * *',
  $$
  SELECT detect_low_confidence_results();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Ensure receipt confidence daily
SELECT cron.schedule(
  'ensure-receipt-confidence',
  '0 4 * * *',
  $$
  SELECT ensure_receipt_confidence();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Validate data integrity daily
SELECT cron.schedule(
  'validate-data-integrity',
  '0 5 * * *',
  $$
  SELECT validate_data_integrity();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

COMMENT ON TABLE confidence_events IS 'Tracks confidence scores to prevent false certainty';
COMMENT ON FUNCTION log_confidence_event IS 'Logs a confidence event and flags low confidence results';
COMMENT ON FUNCTION detect_low_confidence_results IS 'Detects and alerts on low confidence results';
COMMENT ON FUNCTION ensure_receipt_confidence IS 'Ensures all receipts have confidence scores';
COMMENT ON FUNCTION validate_data_integrity IS 'Validates data integrity and flags anomalies';

COMMIT;
