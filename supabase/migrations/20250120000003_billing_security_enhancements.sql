-- Migration: billing_security_enhancements
-- Created: 2025-01-20 00:00:03 UTC
-- Description: Security enhancements for billing: idempotency, fraud detection, usage validation
-- Priority: P0 (CRITICAL - Billing fraud prevention)

BEGIN;

-- ============================================================================
-- IDEMPOTENCY KEYS TABLE FOR USAGE EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_event_idempotency (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  usage_event_id UUID NOT NULL REFERENCES usage_events(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  quantity DECIMAL(15, 6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_billing_account ON usage_event_idempotency(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_event_idempotency_expires_at ON usage_event_idempotency(expires_at);

-- Cleanup expired idempotency keys (run via cron)
DROP FUNCTION IF EXISTS cleanup_expired_idempotency_keys() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM usage_event_idempotency
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- FRAUD DETECTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  signal_type VARCHAR(100) NOT NULL, -- 'usage_spike', 'suspicious_pattern', 'free_tier_bypass', etc.
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_billing_account ON fraud_signals(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_severity ON fraud_signals(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_resolved ON fraud_signals(resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_type ON fraud_signals(signal_type);

-- ============================================================================
-- ENHANCED: log_usage_event with idempotency and fraud detection
-- ============================================================================

DROP FUNCTION IF EXISTS log_usage_event(UUID, VARCHAR, DECIMAL, UUID, UUID, UUID, VARCHAR, UUID, VARCHAR, JSONB, VARCHAR) CASCADE;
CREATE OR REPLACE FUNCTION log_usage_event(
  p_billing_account_id UUID,
  p_event_type VARCHAR(100),
  p_quantity DECIMAL(15, 6) DEFAULT 1,
  p_project_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_integration_id VARCHAR(100) DEFAULT NULL,
  p_add_on_id UUID DEFAULT NULL,
  p_unit VARCHAR(50) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_idempotency_key VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_existing_event_id UUID;
  v_idempotency_key VARCHAR(255);
  v_previous_usage DECIMAL(15, 6);
  v_current_usage DECIMAL(15, 6);
  v_usage_spike_percentage DECIMAL(10, 2);
  v_fraud_signal_id UUID;
BEGIN
  -- Generate idempotency key if not provided
  IF p_idempotency_key IS NULL THEN
    v_idempotency_key := encode(gen_random_bytes(32), 'hex');
  ELSE
    v_idempotency_key := p_idempotency_key;
  END IF;

  -- Check for existing event with same idempotency key
  SELECT usage_event_id INTO v_existing_event_id
  FROM usage_event_idempotency
  WHERE idempotency_key = v_idempotency_key
    AND expires_at > NOW();

  IF v_existing_event_id IS NOT NULL THEN
    -- Return existing event ID (idempotent)
    RETURN v_existing_event_id;
  END IF;

  -- Validate billing account exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM billing_accounts
    WHERE id = p_billing_account_id
      AND status = 'active'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Billing account not found or inactive';
  END IF;

  -- Server-side validation: Check if integration is configured (if integration_id provided)
  IF p_integration_id IS NOT NULL THEN
    -- TODO: Add integration_credentials table check when implemented
    -- For now, we'll allow but log a warning
    NULL;
  END IF;

  -- Insert usage event
  INSERT INTO usage_events (
    billing_account_id,
    project_id,
    user_id,
    tenant_id,
    event_type,
    integration_id,
    add_on_id,
    quantity,
    unit,
    metadata,
    timestamp
  ) VALUES (
    p_billing_account_id,
    p_project_id,
    p_user_id,
    p_tenant_id,
    p_event_type,
    p_integration_id,
    p_add_on_id,
    p_quantity,
    p_unit,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_event_id;

  -- Store idempotency key
  INSERT INTO usage_event_idempotency (
    idempotency_key,
    billing_account_id,
    usage_event_id,
    event_type,
    quantity
  ) VALUES (
    v_idempotency_key,
    p_billing_account_id,
    v_event_id,
    p_event_type,
    p_quantity
  );

  -- Fraud detection: Check for usage spikes
  -- Compare last 24 hours vs previous 24 hours
  SELECT COALESCE(SUM(quantity), 0) INTO v_current_usage
  FROM usage_events
  WHERE billing_account_id = p_billing_account_id
    AND event_type = p_event_type
    AND timestamp >= NOW() - INTERVAL '24 hours';

  SELECT COALESCE(SUM(quantity), 0) INTO v_previous_usage
  FROM usage_events
  WHERE billing_account_id = p_billing_account_id
    AND event_type = p_event_type
    AND timestamp >= NOW() - INTERVAL '48 hours'
    AND timestamp < NOW() - INTERVAL '24 hours';

  -- Calculate spike percentage
  IF v_previous_usage > 0 THEN
    v_usage_spike_percentage := ((v_current_usage - v_previous_usage) / v_previous_usage) * 100;
  ELSE
    -- If no previous usage, any usage is 100% spike (but not suspicious if small)
    v_usage_spike_percentage := CASE WHEN v_current_usage > 1000 THEN 1000 ELSE 0 END;
  END IF;

  -- Flag suspicious usage spikes (>300% increase)
  IF v_usage_spike_percentage > 300 AND v_current_usage > 100 THEN
    INSERT INTO fraud_signals (
      billing_account_id,
      signal_type,
      severity,
      description,
      metadata
    ) VALUES (
      p_billing_account_id,
      'usage_spike',
      CASE
        WHEN v_usage_spike_percentage > 1000 THEN 'critical'
        WHEN v_usage_spike_percentage > 500 THEN 'high'
        ELSE 'medium'
      END,
      format('Usage spike detected: %s%% increase in %s events (current: %s, previous: %s)',
        ROUND(v_usage_spike_percentage, 2),
        p_event_type,
        v_current_usage,
        v_previous_usage
      ),
      jsonb_build_object(
        'event_type', p_event_type,
        'current_usage', v_current_usage,
        'previous_usage', v_previous_usage,
        'spike_percentage', v_usage_spike_percentage,
        'usage_event_id', v_event_id
      )
    )
    RETURNING id INTO v_fraud_signal_id;

    -- Log fraud signal for monitoring
    RAISE WARNING 'Fraud signal created: % (spike: %%)', 
      format('%s (spike: %s%%)', v_fraud_signal_id::text, ROUND(v_usage_spike_percentage, 2)::text);
  END IF;

  RETURN v_event_id;
END;
$$;

-- ============================================================================
-- FUNCTION: check_and_suspend_abusive_accounts
-- ============================================================================
-- Checks for accounts with multiple fraud signals and suspends them
-- Should be run via cron job

DROP FUNCTION IF EXISTS check_and_suspend_abusive_accounts() CASCADE;
CREATE OR REPLACE FUNCTION check_and_suspend_abusive_accounts()
RETURNS TABLE(
  billing_account_id UUID,
  fraud_signal_count BIGINT,
  suspended BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Find accounts with multiple high-severity fraud signals in last 24 hours
  FOR v_record IN
    SELECT
      fs.billing_account_id,
      COUNT(*) as signal_count,
      COUNT(*) FILTER (WHERE fs.severity IN ('high', 'critical')) as high_severity_count
    FROM fraud_signals fs
    WHERE fs.created_at >= NOW() - INTERVAL '24 hours'
      AND fs.resolved = false
    GROUP BY fs.billing_account_id
    HAVING COUNT(*) >= 3 OR COUNT(*) FILTER (WHERE fs.severity IN ('high', 'critical')) >= 2
  LOOP
    -- Suspend billing account
    UPDATE billing_accounts
    SET status = 'suspended',
        updated_at = NOW()
    WHERE id = v_record.billing_account_id
      AND status = 'active';

    -- Return result
    billing_account_id := v_record.billing_account_id;
    fraud_signal_count := v_record.signal_count;
    suspended := true;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ============================================================================
-- FUNCTION: validate_usage_event_server_side
-- ============================================================================
-- Server-side validation to ensure usage events are legitimate
-- This function should be called before logging usage events

DROP FUNCTION IF EXISTS validate_usage_event_server_side(UUID, VARCHAR, VARCHAR, UUID) CASCADE;
CREATE OR REPLACE FUNCTION validate_usage_event_server_side(
  p_billing_account_id UUID,
  p_event_type VARCHAR(100),
  p_integration_id VARCHAR(100) DEFAULT NULL,
  p_add_on_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_billing_account RECORD;
  v_subscription RECORD;
  v_add_on_purchase RECORD;
BEGIN
  -- Check billing account exists and is active
  SELECT * INTO v_billing_account
  FROM billing_accounts
  WHERE id = p_billing_account_id
    AND status = 'active'
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check active subscription exists
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE billing_account_id = p_billing_account_id
    AND status = 'active'
    AND current_period_end > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Allow if in trial period
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE billing_account_id = p_billing_account_id
      AND status = 'trialing'
      AND trial_end > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN false;
    END IF;
  END IF;

  -- If add-on is specified, check if it's purchased
  IF p_add_on_id IS NOT NULL THEN
    SELECT * INTO v_add_on_purchase
    FROM add_on_purchases
    WHERE billing_account_id = p_billing_account_id
      AND add_on_id = p_add_on_id
      AND status = 'active';

    IF NOT FOUND THEN
      -- Add-on not purchased, cannot log usage
      RETURN false;
    END IF;
  END IF;

  -- If integration is specified, validate it's configured
  -- TODO: Add integration_credentials table check when implemented
  -- For now, we'll allow but this should be enhanced

  RETURN true;
END;
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account_timestamp ON usage_events(billing_account_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type_timestamp ON usage_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_billing_account_created ON fraud_signals(billing_account_id, created_at DESC);

COMMIT;
