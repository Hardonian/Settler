-- Migration: ai_safety_layer
-- Created: 2025-01-20 00:00:07 UTC
-- Description: AI/automation safety layer with rate limits, cost guardrails, RUQ enforcement
-- Priority: P1 (High - Cost explosion prevention)

BEGIN;

-- ============================================================================
-- AI USAGE QUOTAS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE CASCADE,
  
  -- Quota limits
  daily_request_limit INTEGER DEFAULT 1000,
  monthly_request_limit INTEGER DEFAULT 30000,
  daily_cost_limit_usd DECIMAL(10, 2) DEFAULT 10.00,
  monthly_cost_limit_usd DECIMAL(10, 2) DEFAULT 300.00,
  
  -- Current usage
  daily_requests INTEGER DEFAULT 0,
  monthly_requests INTEGER DEFAULT 0,
  daily_cost_usd DECIMAL(10, 2) DEFAULT 0,
  monthly_cost_usd DECIMAL(10, 2) DEFAULT 0,
  
  -- Reset dates
  daily_reset_date DATE DEFAULT CURRENT_DATE,
  monthly_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
  
  -- Status
  suspended BOOLEAN DEFAULT false,
  suspended_reason TEXT,
  suspended_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, billing_account_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_tenant_id ON ai_usage_quotas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_billing_account_id ON ai_usage_quotas(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_suspended ON ai_usage_quotas(suspended) WHERE suspended = true;

-- ============================================================================
-- AI USAGE EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL, -- 'inference', 'training', 'embedding', etc.
  model_name VARCHAR(100), -- 'gpt-4', 'claude-3', 'custom-model', etc.
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Cost
  cost_usd DECIMAL(10, 6) NOT NULL,
  cost_breakdown JSONB, -- {"input": 0.001, "output": 0.002}
  
  -- Performance
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_tenant_id ON ai_usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_billing_account_id ON ai_usage_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_timestamp ON ai_usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_event_type ON ai_usage_events(event_type);

-- ============================================================================
-- FUNCTION: Check AI quota before usage
-- ============================================================================

CREATE OR REPLACE FUNCTION check_ai_quota(
  p_tenant_id UUID,
  p_billing_account_id UUID,
  p_estimated_cost_usd DECIMAL(10, 6) DEFAULT 0.001
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quota RECORD;
  v_result JSONB;
  v_daily_reset_needed BOOLEAN := false;
  v_monthly_reset_needed BOOLEAN := false;
BEGIN
  -- Get or create quota
  SELECT * INTO v_quota
  FROM ai_usage_quotas
  WHERE tenant_id = p_tenant_id
    AND billing_account_id = p_billing_account_id;

  -- Create quota if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO ai_usage_quotas (tenant_id, billing_account_id)
    VALUES (p_tenant_id, p_billing_account_id)
    RETURNING * INTO v_quota;
  END IF;

  -- Check if suspended
  IF v_quota.suspended THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'AI usage suspended: ' || COALESCE(v_quota.suspended_reason, 'Unknown reason')
    );
  END IF;

  -- Check daily reset
  IF v_quota.daily_reset_date < CURRENT_DATE THEN
    v_daily_reset_needed := true;
    UPDATE ai_usage_quotas
    SET daily_requests = 0,
        daily_cost_usd = 0,
        daily_reset_date = CURRENT_DATE
    WHERE id = v_quota.id
    RETURNING * INTO v_quota;
  END IF;

  -- Check monthly reset
  IF v_quota.monthly_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    v_monthly_reset_needed := true;
    UPDATE ai_usage_quotas
    SET monthly_requests = 0,
        monthly_cost_usd = 0,
        monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
    WHERE id = v_quota.id
    RETURNING * INTO v_quota;
  END IF;

  -- Check daily limits
  IF v_quota.daily_requests >= v_quota.daily_request_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Daily request limit exceeded',
      'limit', v_quota.daily_request_limit,
      'current', v_quota.daily_requests
    );
  END IF;

  IF v_quota.daily_cost_usd + p_estimated_cost_usd > v_quota.daily_cost_limit_usd THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Daily cost limit exceeded',
      'limit', v_quota.daily_cost_limit_usd,
      'current', v_quota.daily_cost_usd,
      'estimated', p_estimated_cost_usd
    );
  END IF;

  -- Check monthly limits
  IF v_quota.monthly_requests >= v_quota.monthly_request_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Monthly request limit exceeded',
      'limit', v_quota.monthly_request_limit,
      'current', v_quota.monthly_requests
    );
  END IF;

  IF v_quota.monthly_cost_usd + p_estimated_cost_usd > v_quota.monthly_cost_limit_usd THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Monthly cost limit exceeded',
      'limit', v_quota.monthly_cost_limit_usd,
      'current', v_quota.monthly_cost_usd,
      'estimated', p_estimated_cost_usd
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'daily_remaining_requests', v_quota.daily_request_limit - v_quota.daily_requests,
    'daily_remaining_cost', v_quota.daily_cost_limit_usd - v_quota.daily_cost_usd,
    'monthly_remaining_requests', v_quota.monthly_request_limit - v_quota.monthly_requests,
    'monthly_remaining_cost', v_quota.monthly_cost_limit_usd - v_quota.monthly_cost_usd
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Record AI usage and update quotas
-- ============================================================================

CREATE OR REPLACE FUNCTION record_ai_usage(
  p_tenant_id UUID,
  p_billing_account_id UUID,
  p_event_type VARCHAR(100),
  p_model_name VARCHAR(100),
  p_prompt_tokens INTEGER DEFAULT NULL,
  p_completion_tokens INTEGER DEFAULT NULL,
  p_total_tokens INTEGER DEFAULT NULL,
  p_cost_usd DECIMAL(10, 6),
  p_cost_breakdown JSONB DEFAULT NULL,
  p_latency_ms INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_quota RECORD;
BEGIN
  -- Record usage event
  INSERT INTO ai_usage_events (
    tenant_id,
    billing_account_id,
    event_type,
    model_name,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    cost_usd,
    cost_breakdown,
    latency_ms,
    success,
    error_message,
    metadata
  ) VALUES (
    p_tenant_id,
    p_billing_account_id,
    p_event_type,
    p_model_name,
    p_prompt_tokens,
    p_completion_tokens,
    p_total_tokens,
    p_cost_usd,
    p_cost_breakdown,
    p_latency_ms,
    p_success,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  -- Update quotas
  UPDATE ai_usage_quotas
  SET daily_requests = daily_requests + 1,
      monthly_requests = monthly_requests + 1,
      daily_cost_usd = daily_cost_usd + p_cost_usd,
      monthly_cost_usd = monthly_cost_usd + p_cost_usd,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND billing_account_id = p_billing_account_id;

  -- Check if quota exceeded (for alerting)
  SELECT * INTO v_quota
  FROM ai_usage_quotas
  WHERE tenant_id = p_tenant_id
    AND billing_account_id = p_billing_account_id;

  -- Auto-suspend if cost limit exceeded significantly
  IF v_quota.daily_cost_usd > v_quota.daily_cost_limit_usd * 1.5 THEN
    UPDATE ai_usage_quotas
    SET suspended = true,
        suspended_reason = 'Daily cost limit exceeded by 50%',
        suspended_at = NOW()
    WHERE id = v_quota.id;

    -- Create alert
    INSERT INTO alerts (
      alert_type,
      severity,
      title,
      message,
      tenant_id,
      billing_account_id,
      metadata
    ) VALUES (
      'cost_threshold',
      'critical',
      'AI Usage Suspended',
      format('AI usage suspended due to cost limit exceeded. Daily cost: $%s (limit: $%s)',
        v_quota.daily_cost_usd,
        v_quota.daily_cost_limit_usd
      ),
      p_tenant_id,
      p_billing_account_id,
      jsonb_build_object(
        'daily_cost', v_quota.daily_cost_usd,
        'daily_limit', v_quota.daily_cost_limit_usd,
        'ai_usage_quota_id', v_quota.id
      )
    );
  END IF;

  RETURN v_event_id;
END;
$$;

-- ============================================================================
-- FUNCTION: Reset AI quotas (daily cron job)
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_daily_ai_quotas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  UPDATE ai_usage_quotas
  SET daily_requests = 0,
      daily_cost_usd = 0,
      daily_reset_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE daily_reset_date < CURRENT_DATE;

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  RETURN v_reset_count;
END;
$$;

-- ============================================================================
-- FUNCTION: Reset monthly AI quotas (monthly cron job)
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_monthly_ai_quotas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  UPDATE ai_usage_quotas
  SET monthly_requests = 0,
      monthly_cost_usd = 0,
      monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE,
      updated_at = NOW()
  WHERE monthly_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE;

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  RETURN v_reset_count;
END;
$$;

COMMIT;
