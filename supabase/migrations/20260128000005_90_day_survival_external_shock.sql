-- Migration: 90-Day Survival - External Shock Protection
-- Created: 2026-01-28
-- Description: Circuit breakers, rate limits, degraded mode, graceful degradation
-- CRITICAL: System must survive external API failures, cost spikes, unexpected load

BEGIN;

-- ============================================================================
-- CIRCUIT BREAKER TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS circuit_breakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL UNIQUE, -- 'stripe', 'openai', 'shopify', 'tiktok'
  status VARCHAR(50) DEFAULT 'closed', -- closed, open, half_open
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  threshold_failures INTEGER DEFAULT 5, -- Open after 5 failures
  threshold_successes INTEGER DEFAULT 2, -- Half-open -> closed after 2 successes
  timeout_seconds INTEGER DEFAULT 60, -- Stay open for 60 seconds minimum
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_circuit_breakers_status ON circuit_breakers(status);
CREATE INDEX IF NOT EXISTS idx_circuit_breakers_service ON circuit_breakers(service_name);

-- ============================================================================
-- CIRCUIT BREAKER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION record_circuit_breaker_failure(p_service_name VARCHAR)
RETURNS jsonb AS $$
DECLARE
  v_breaker RECORD;
  v_new_status VARCHAR;
BEGIN
  -- Get or create circuit breaker
  SELECT * INTO v_breaker
  FROM circuit_breakers
  WHERE service_name = p_service_name
  FOR UPDATE;
  
  IF v_breaker IS NULL THEN
    INSERT INTO circuit_breakers (service_name, status, failure_count, last_failure_at)
    VALUES (p_service_name, 'closed', 1, NOW())
    RETURNING * INTO v_breaker;
  ELSE
    -- Update failure count
    UPDATE circuit_breakers
    SET 
      failure_count = failure_count + 1,
      last_failure_at = NOW(),
      updated_at = NOW()
    WHERE id = v_breaker.id
    RETURNING * INTO v_breaker;
  END IF;
  
  -- Check if should open circuit
  IF v_breaker.status = 'closed' AND v_breaker.failure_count >= v_breaker.threshold_failures THEN
    v_new_status := 'open';
    UPDATE circuit_breakers
    SET 
      status = 'open',
      opened_at = NOW(),
      updated_at = NOW()
    WHERE id = v_breaker.id;
    
    -- Create alert
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'critical',
      format('Circuit Breaker Opened: %s', p_service_name),
      format('Circuit breaker opened for %s after %s failures', 
        p_service_name, v_breaker.failure_count),
      'circuit_breaker',
      jsonb_build_object(
        'service_name', p_service_name,
        'failure_count', v_breaker.failure_count,
        'opened_at', NOW()
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'service_name', p_service_name,
    'status', COALESCE(v_new_status, v_breaker.status),
    'failure_count', v_breaker.failure_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_circuit_breaker_success(p_service_name VARCHAR)
RETURNS jsonb AS $$
DECLARE
  v_breaker RECORD;
  v_new_status VARCHAR;
BEGIN
  SELECT * INTO v_breaker
  FROM circuit_breakers
  WHERE service_name = p_service_name
  FOR UPDATE;
  
  IF v_breaker IS NULL THEN
    -- First success, create breaker in closed state
    INSERT INTO circuit_breakers (service_name, status, success_count, last_success_at)
    VALUES (p_service_name, 'closed', 1, NOW())
    RETURNING * INTO v_breaker;
  ELSE
    -- Update success count
    UPDATE circuit_breakers
    SET 
      success_count = success_count + 1,
      failure_count = 0, -- Reset failure count on success
      last_success_at = NOW(),
      updated_at = NOW()
    WHERE id = v_breaker.id
    RETURNING * INTO v_breaker;
    
    -- Check if should close circuit (half-open -> closed)
    IF v_breaker.status = 'half_open' AND v_breaker.success_count >= v_breaker.threshold_successes THEN
      v_new_status := 'closed';
      UPDATE circuit_breakers
      SET 
        status = 'closed',
        opened_at = NULL,
        updated_at = NOW()
      WHERE id = v_breaker.id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'service_name', p_service_name,
    'status', COALESCE(v_new_status, v_breaker.status),
    'success_count', v_breaker.success_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_circuit_breaker(p_service_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_breaker RECORD;
BEGIN
  SELECT * INTO v_breaker
  FROM circuit_breakers
  WHERE service_name = p_service_name;
  
  IF v_breaker IS NULL THEN
    RETURN true; -- No breaker exists, allow request
  END IF;
  
  -- If closed, allow
  IF v_breaker.status = 'closed' THEN
    RETURN true;
  END IF;
  
  -- If open, check timeout
  IF v_breaker.status = 'open' THEN
    IF v_breaker.opened_at IS NULL OR 
       NOW() - v_breaker.opened_at < INTERVAL '1 second' * v_breaker.timeout_seconds THEN
      RETURN false; -- Still in timeout period
    ELSE
      -- Timeout expired, move to half-open
      UPDATE circuit_breakers
      SET 
        status = 'half_open',
        success_count = 0,
        updated_at = NOW()
      WHERE id = v_breaker.id;
      RETURN true; -- Allow one request to test
    END IF;
  END IF;
  
  -- If half-open, allow (testing)
  IF v_breaker.status = 'half_open' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RATE LIMITING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- user_id, api_key_id, ip_address, etc.
  identifier_type VARCHAR(50) NOT NULL, -- 'user', 'api_key', 'ip', 'global'
  endpoint VARCHAR(255),
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_seconds INTEGER DEFAULT 60,
  limit_count INTEGER DEFAULT 100,
  blocked BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, identifier_type, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(blocked) WHERE blocked = true;

-- ============================================================================
-- RATE LIMIT CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier VARCHAR,
  p_identifier_type VARCHAR,
  p_endpoint VARCHAR DEFAULT NULL,
  p_limit_count INTEGER DEFAULT 100,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS jsonb AS $$
DECLARE
  v_limit RECORD;
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Calculate window start
  v_window_start := date_trunc('second', NOW() - 
    (EXTRACT(EPOCH FROM NOW())::bigint % p_window_seconds || ' seconds')::interval);
  
  -- Get or create rate limit record
  SELECT * INTO v_limit
  FROM rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND (endpoint = p_endpoint OR (endpoint IS NULL AND p_endpoint IS NULL))
    AND window_start = v_window_start
  FOR UPDATE;
  
  IF v_limit IS NULL THEN
    -- Create new window
    INSERT INTO rate_limits (
      identifier,
      identifier_type,
      endpoint,
      request_count,
      window_start,
      window_seconds,
      limit_count
    ) VALUES (
      p_identifier,
      p_identifier_type,
      p_endpoint,
      1,
      v_window_start,
      p_window_seconds,
      p_limit_count
    );
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_limit_count - 1,
      'reset_at', v_window_start + (p_window_seconds || ' seconds')::interval
    );
  ELSE
    -- Increment count
    v_current_count := v_limit.request_count + 1;
    
    UPDATE rate_limits
    SET 
      request_count = v_current_count,
      blocked = v_current_count > v_limit.limit_count,
      updated_at = NOW()
    WHERE id = v_limit.id;
    
    IF v_current_count > v_limit.limit_count THEN
      -- Rate limit exceeded
      RETURN jsonb_build_object(
        'allowed', false,
        'remaining', 0,
        'reset_at', v_limit.window_start + (v_limit.window_seconds || ' seconds')::interval,
        'limit_exceeded', true
      );
    ELSE
      RETURN jsonb_build_object(
        'allowed', true,
        'remaining', v_limit.limit_count - v_current_count,
        'reset_at', v_limit.window_start + (v_limit.window_seconds || ' seconds')::interval
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP OLD RATE LIMIT WINDOWS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DEGRADED MODE DETECTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_degraded_mode()
RETURNS jsonb AS $$
DECLARE
  v_open_breakers INTEGER;
  v_degraded_services JSONB := '[]'::jsonb;
BEGIN
  -- Count open circuit breakers
  SELECT COUNT(*) INTO v_open_breakers
  FROM circuit_breakers
  WHERE status = 'open';
  
  -- Get list of degraded services
  SELECT jsonb_agg(jsonb_build_object(
    'service_name', service_name,
    'status', status,
    'opened_at', opened_at
  )) INTO v_degraded_services
  FROM circuit_breakers
  WHERE status IN ('open', 'half_open');
  
  -- If critical services are down, enable degraded mode
  IF v_open_breakers > 0 THEN
    -- Update system status (would be in a system_status table)
    -- For now, create alert
    INSERT INTO alerts (
      severity,
      title,
      message,
      check_type,
      details
    ) VALUES (
      'critical',
      'Degraded Mode Active',
      format('%s services are currently degraded', v_open_breakers),
      'degraded_mode',
      jsonb_build_object(
        'degraded_services', v_degraded_services,
        'open_breakers', v_open_breakers
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'degraded_mode', v_open_breakers > 0,
    'degraded_services', v_degraded_services,
    'open_breakers', v_open_breakers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE EXTERNAL SHOCK PROTECTION
-- ============================================================================

-- Cleanup old rate limits every hour
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  $$
  SELECT cleanup_old_rate_limits();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Check degraded mode every 5 minutes
SELECT cron.schedule(
  'check-degraded-mode',
  '*/5 * * * *',
  $$
  SELECT check_degraded_mode();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

COMMENT ON TABLE circuit_breakers IS 'Circuit breakers to prevent cascading failures from external services';
COMMENT ON TABLE rate_limits IS 'Rate limiting to prevent abuse and cost spikes';
COMMENT ON FUNCTION check_circuit_breaker IS 'Checks if circuit breaker allows request';
COMMENT ON FUNCTION check_rate_limit IS 'Checks and enforces rate limits';
COMMENT ON FUNCTION check_degraded_mode IS 'Detects and alerts on degraded mode';

COMMIT;
