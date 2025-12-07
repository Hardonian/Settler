-- Migration: billing_functions
-- Created: 2025-01-20 00:00:01 UTC
-- Description: Billing functions for usage logging, aggregation, and billing calculations

BEGIN;

-- ============================================================================
-- FUNCTION: log_usage_event
-- ============================================================================
-- Logs a usage event for billing and analytics
-- Parameters:
--   p_billing_account_id: UUID of the billing account
--   p_event_type: Type of event (auth_user_created, db_query, webhook_event, etc.)
--   p_quantity: Quantity of usage (default 1)
--   p_integration_id: Optional integration ID
--   p_add_on_id: Optional add-on ID
--   p_metadata: Optional JSON metadata

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
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id UUID;
BEGIN
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

  RETURN v_event_id;
END;
$$;

-- ============================================================================
-- FUNCTION: aggregate_daily_usage
-- ============================================================================
-- Aggregates usage events into daily aggregates for a given date range
-- Parameters:
--   p_start_date: Start date for aggregation
--   p_end_date: End date for aggregation

CREATE OR REPLACE FUNCTION aggregate_daily_usage(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day',
  p_end_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_aggregated_count INTEGER := 0;
  v_record RECORD;
BEGIN
  -- Aggregate unaggregated events for the date range
  FOR v_record IN
    SELECT
      billing_account_id,
      project_id,
      tenant_id,
      DATE(timestamp) as event_date,
      event_type,
      integration_id,
      add_on_id,
      SUM(quantity) as total_quantity,
      COUNT(*) as event_count
    FROM usage_events
    WHERE DATE(timestamp) >= p_start_date
      AND DATE(timestamp) <= p_end_date
      AND aggregated = false
    GROUP BY
      billing_account_id,
      project_id,
      tenant_id,
      DATE(timestamp),
      event_type,
      integration_id,
      add_on_id
  LOOP
    -- Upsert into daily aggregates
    INSERT INTO usage_aggregate_daily (
      billing_account_id,
      project_id,
      tenant_id,
      date,
      event_type,
      integration_id,
      add_on_id,
      total_quantity,
      event_count
    ) VALUES (
      v_record.billing_account_id,
      v_record.project_id,
      v_record.tenant_id,
      v_record.event_date,
      v_record.event_type,
      v_record.integration_id,
      v_record.add_on_id,
      v_record.total_quantity,
      v_record.event_count
    )
    ON CONFLICT (billing_account_id, project_id, date, event_type, integration_id, add_on_id)
    DO UPDATE SET
      total_quantity = usage_aggregate_daily.total_quantity + v_record.total_quantity,
      event_count = usage_aggregate_daily.event_count + v_record.event_count,
      updated_at = NOW();

    -- Mark events as aggregated
    UPDATE usage_events
    SET aggregated = true
    WHERE billing_account_id = v_record.billing_account_id
      AND (project_id = v_record.project_id OR (project_id IS NULL AND v_record.project_id IS NULL))
      AND DATE(timestamp) = v_record.event_date
      AND event_type = v_record.event_type
      AND (integration_id = v_record.integration_id OR (integration_id IS NULL AND v_record.integration_id IS NULL))
      AND (add_on_id = v_record.add_on_id OR (add_on_id IS NULL AND v_record.add_on_id IS NULL))
      AND aggregated = false;

    v_aggregated_count := v_aggregated_count + 1;
  END LOOP;

  RETURN v_aggregated_count;
END;
$$;

-- ============================================================================
-- FUNCTION: compute_estimated_bill
-- ============================================================================
-- Computes estimated bill for a billing account for a given period
-- Parameters:
--   p_billing_account_id: UUID of the billing account
--   p_start_date: Start date for billing period
--   p_end_date: End date for billing period

CREATE OR REPLACE FUNCTION compute_estimated_bill(
  p_billing_account_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_base_subscription_cost DECIMAL(10, 2) := 49.95;
  v_add_on_costs DECIMAL(10, 2) := 0;
  v_usage_costs DECIMAL(10, 2) := 0;
  v_total_cost DECIMAL(10, 2);
  v_record RECORD;
  v_add_on_record RECORD;
BEGIN
  -- Get active subscription
  SELECT plan_id, plan_name INTO v_record
  FROM subscriptions
  WHERE billing_account_id = p_billing_account_id
    AND status = 'active'
    AND current_period_start <= p_end_date
    AND current_period_end >= p_start_date
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate add-on costs
  FOR v_add_on_record IN
    SELECT
      ao.id,
      ao.base_price_monthly,
      ao.usage_price_per_unit,
      ao.usage_unit,
      COALESCE(SUM(uad.total_quantity), 0) as total_usage
    FROM add_on_purchases aop
    JOIN add_ons ao ON aop.add_on_id = ao.id
    LEFT JOIN usage_aggregate_daily uad ON uad.add_on_id = ao.id
      AND uad.billing_account_id = p_billing_account_id
      AND uad.date >= p_start_date
      AND uad.date <= p_end_date
    WHERE aop.billing_account_id = p_billing_account_id
      AND aop.status = 'active'
    GROUP BY ao.id, ao.base_price_monthly, ao.usage_price_per_unit, ao.usage_unit
  LOOP
    v_add_on_costs := v_add_on_costs + v_add_on_record.base_price_monthly;
    IF v_add_on_record.usage_price_per_unit IS NOT NULL THEN
      v_usage_costs := v_usage_costs + (v_add_on_record.total_usage * v_add_on_record.usage_price_per_unit);
    END IF;
  END LOOP;

  -- Calculate usage overage costs (for base plan limits)
  -- This is a simplified version - actual implementation would check plan limits
  FOR v_record IN
    SELECT
      event_type,
      SUM(total_quantity) as total_quantity
    FROM usage_aggregate_daily
    WHERE billing_account_id = p_billing_account_id
      AND date >= p_start_date
      AND date <= p_end_date
      AND add_on_id IS NULL
    GROUP BY event_type
  LOOP
    -- Apply overage pricing based on event type
    -- This is simplified - actual implementation would check plan limits first
    CASE v_record.event_type
      WHEN 'reconciliation_job' THEN
        IF v_record.total_quantity > 10000 THEN
          v_usage_costs := v_usage_costs + ((v_record.total_quantity - 10000) * 0.05);
        END IF;
      WHEN 'api_request' THEN
        IF v_record.total_quantity > 100000 THEN
          v_usage_costs := v_usage_costs + ((v_record.total_quantity - 100000) * 0.001);
        END IF;
      WHEN 'webhook_event' THEN
        IF v_record.total_quantity > 50000 THEN
          v_usage_costs := v_usage_costs + ((v_record.total_quantity - 50000) * 0.002);
        END IF;
      ELSE
        -- Default overage pricing
        NULL;
    END CASE;
  END LOOP;

  v_total_cost := v_base_subscription_cost + v_add_on_costs + v_usage_costs;

  -- Build result JSON
  v_result := jsonb_build_object(
    'billing_account_id', p_billing_account_id,
    'period_start', p_start_date,
    'period_end', p_end_date,
    'base_subscription_cost', v_base_subscription_cost,
    'add_on_costs', v_add_on_costs,
    'usage_costs', v_usage_costs,
    'total_cost', v_total_cost,
    'currency', 'usd'
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: check_upgrade_requirement
-- ============================================================================
-- Checks if a billing account should be prompted to upgrade based on usage
-- Parameters:
--   p_billing_account_id: UUID of the billing account

CREATE OR REPLACE FUNCTION check_upgrade_requirement(
  p_billing_account_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_current_period_start DATE;
  v_current_period_end DATE;
  v_record RECORD;
  v_warnings JSONB := '[]'::jsonb;
  v_should_upgrade BOOLEAN := false;
BEGIN
  -- Get current billing period
  SELECT current_period_start, current_period_end
  INTO v_current_period_start, v_current_period_end
  FROM subscriptions
  WHERE billing_account_id = p_billing_account_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_period_start IS NULL THEN
    RETURN jsonb_build_object('error', 'No active subscription found');
  END IF;

  -- Check usage against plan limits
  FOR v_record IN
    SELECT
      event_type,
      SUM(total_quantity) as total_quantity,
      CASE event_type
        WHEN 'reconciliation_job' THEN 10000
        WHEN 'api_request' THEN 100000
        WHEN 'webhook_event' THEN 50000
        WHEN 'db_query' THEN 500000
        WHEN 'ai_request' THEN 1000
        ELSE NULL
      END as plan_limit
    FROM usage_aggregate_daily
    WHERE billing_account_id = p_billing_account_id
      AND date >= v_current_period_start
      AND date <= v_current_period_end
      AND add_on_id IS NULL
    GROUP BY event_type
  LOOP
    IF v_record.plan_limit IS NOT NULL AND v_record.total_quantity >= v_record.plan_limit * 0.8 THEN
      v_warnings := v_warnings || jsonb_build_object(
        'event_type', v_record.event_type,
        'current_usage', v_record.total_quantity,
        'plan_limit', v_record.plan_limit,
        'percentage_used', ROUND((v_record.total_quantity / v_record.plan_limit) * 100, 2),
        'threshold', '80%'
      );
      IF v_record.total_quantity >= v_record.plan_limit THEN
        v_should_upgrade := true;
      END IF;
    END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'billing_account_id', p_billing_account_id,
    'should_upgrade', v_should_upgrade,
    'warnings', v_warnings,
    'period_start', v_current_period_start,
    'period_end', v_current_period_end
  );

  RETURN v_result;
END;
$$;

COMMIT;
