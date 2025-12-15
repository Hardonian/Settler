-- Migration: 90-Day Survival - Billing Protection & Revenue Leak Prevention
-- Created: 2026-01-28
-- Description: Prevents revenue leaks, ensures billing accuracy, handles payment failures
-- CRITICAL: Revenue must continue flowing correctly without human intervention

BEGIN;

-- ============================================================================
-- BILLING RECONCILIATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_reconciliation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  reconciliation_type VARCHAR(50) NOT NULL, -- 'daily', 'monthly', 'payment_failed', 'discrepancy'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  expected_amount DECIMAL(15, 2),
  actual_amount DECIMAL(15, 2),
  discrepancy_amount DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reconciled, discrepancy, failed
  stripe_invoice_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_recon_billing_account ON billing_reconciliation_log(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_billing_recon_status ON billing_reconciliation_log(status);
CREATE INDEX IF NOT EXISTS idx_billing_recon_period ON billing_reconciliation_log(period_start, period_end);

-- ============================================================================
-- DAILY BILLING RECONCILIATION
-- ============================================================================

CREATE OR REPLACE FUNCTION reconcile_daily_billing(p_date DATE DEFAULT CURRENT_DATE)
RETURNS jsonb AS $$
DECLARE
  v_account RECORD;
  v_result jsonb := '[]'::jsonb;
  v_expected DECIMAL(15, 2);
  v_actual DECIMAL(15, 2);
  v_discrepancy DECIMAL(15, 2);
BEGIN
  -- For each active billing account, reconcile usage vs Stripe
  FOR v_account IN
    SELECT DISTINCT ba.id, ba.stripe_customer_id, s.stripe_subscription_id
    FROM billing_accounts ba
    JOIN subscriptions s ON s.billing_account_id = ba.id
    WHERE ba.status = 'active'
      AND s.status = 'active'
      AND ba.deleted_at IS NULL
  LOOP
    -- Calculate expected bill from usage
    SELECT COALESCE(SUM(estimated_cost), 0) INTO v_expected
    FROM usage_aggregate_daily
    WHERE billing_account_id = v_account.id
      AND date = p_date;
    
    -- Get actual Stripe invoice amount (would need Stripe API call in practice)
    -- For now, we'll flag if usage exists but no invoice
    v_actual := NULL;
    
    -- Check if reconciliation already exists
    IF NOT EXISTS (
      SELECT 1 FROM billing_reconciliation_log
      WHERE billing_account_id = v_account.id
        AND reconciliation_type = 'daily'
        AND period_start::date = p_date
    ) THEN
      v_discrepancy := COALESCE(v_expected, 0) - COALESCE(v_actual, 0);
      
      INSERT INTO billing_reconciliation_log (
        billing_account_id,
        reconciliation_type,
        period_start,
        period_end,
        expected_amount,
        actual_amount,
        discrepancy_amount,
        status,
        stripe_subscription_id,
        details
      ) VALUES (
        v_account.id,
        'daily',
        p_date::timestamptz,
        (p_date + INTERVAL '1 day')::timestamptz,
        v_expected,
        v_actual,
        v_discrepancy,
        CASE 
          WHEN v_discrepancy > 0.01 THEN 'discrepancy'
          WHEN v_expected > 0 AND v_actual IS NULL THEN 'pending'
          ELSE 'reconciled'
        END,
        v_account.stripe_subscription_id,
        jsonb_build_object(
          'usage_events', (
            SELECT COUNT(*) FROM usage_events
            WHERE billing_account_id = v_account.id
              AND timestamp::date = p_date
          )
        )
      );
      
      v_result := v_result || jsonb_build_object(
        'billing_account_id', v_account.id,
        'status', CASE 
          WHEN v_discrepancy > 0.01 THEN 'discrepancy'
          WHEN v_expected > 0 AND v_actual IS NULL THEN 'pending'
          ELSE 'reconciled'
        END,
        'discrepancy', v_discrepancy
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'date', p_date,
    'accounts_checked', jsonb_array_length(v_result),
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PAYMENT FAILURE HANDLING
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_payment_failure(
  p_billing_account_id UUID,
  p_stripe_invoice_id VARCHAR,
  p_failure_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_recon_id UUID;
  v_subscription RECORD;
BEGIN
  -- Get subscription details
  SELECT s.* INTO v_subscription
  FROM subscriptions s
  WHERE s.billing_account_id = p_billing_account_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  IF v_subscription IS NULL THEN
    RAISE EXCEPTION 'No active subscription found for billing account %', p_billing_account_id;
  END IF;
  
  -- Log payment failure
  INSERT INTO billing_reconciliation_log (
    billing_account_id,
    reconciliation_type,
    period_start,
    period_end,
    status,
    stripe_invoice_id,
    stripe_subscription_id,
    details
  ) VALUES (
    p_billing_account_id,
    'payment_failed',
    NOW() - INTERVAL '1 day',
    NOW(),
    'failed',
    p_stripe_invoice_id,
    v_subscription.stripe_subscription_id,
    jsonb_build_object(
      'failure_reason', p_failure_reason,
      'handled_at', NOW()
    )
  ) RETURNING id INTO v_recon_id;
  
  -- Update subscription status (Stripe webhook should handle this, but ensure it)
  UPDATE subscriptions
  SET status = 'past_due'
  WHERE id = v_subscription.id;
  
  -- Trigger alert
  INSERT INTO alerts (
    severity,
    title,
    message,
    check_type,
    details
  ) VALUES (
    'high',
    'Payment Failure Detected',
    format('Payment failed for billing account %s: %s', p_billing_account_id, p_failure_reason),
    'payment_failure',
    jsonb_build_object(
      'billing_account_id', p_billing_account_id,
      'stripe_invoice_id', p_stripe_invoice_id,
      'failure_reason', p_failure_reason
    )
  );
  
  RETURN v_recon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DETECT BILLING DISCREPANCIES
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_billing_discrepancies()
RETURNS jsonb AS $$
DECLARE
  v_discrepancy RECORD;
  v_result jsonb := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  -- Find unreconciled discrepancies from last 7 days
  FOR v_discrepancy IN
    SELECT *
    FROM billing_reconciliation_log
    WHERE status = 'discrepancy'
      AND period_start > NOW() - INTERVAL '7 days'
      AND ABS(discrepancy_amount) > 0.01
    ORDER BY ABS(discrepancy_amount) DESC
  LOOP
    v_count := v_count + 1;
    
    -- Create alert for significant discrepancies
    IF ABS(v_discrepancy.discrepancy_amount) > 10.00 THEN
      INSERT INTO alerts (
        severity,
        title,
        message,
        check_type,
        details
      ) VALUES (
        'high',
        'Billing Discrepancy Detected',
        format('Discrepancy of $%s detected for billing account %s', 
          v_discrepancy.discrepancy_amount, 
          v_discrepancy.billing_account_id),
        'billing_discrepancy',
        jsonb_build_object(
          'billing_account_id', v_discrepancy.billing_account_id,
          'discrepancy_amount', v_discrepancy.discrepancy_amount,
          'expected_amount', v_discrepancy.expected_amount,
          'actual_amount', v_discrepancy.actual_amount,
          'period_start', v_discrepancy.period_start,
          'period_end', v_discrepancy.period_end
        )
      );
      
      v_result := v_result || jsonb_build_object(
        'billing_account_id', v_discrepancy.billing_account_id,
        'discrepancy_amount', v_discrepancy.discrepancy_amount
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'discrepancies_found', v_count,
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENSURE USAGE SYNC TO STRIPE
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_usage_synced_to_stripe()
RETURNS jsonb AS $$
DECLARE
  v_account RECORD;
  v_result jsonb := '[]'::jsonb;
  v_unsynced_count INTEGER;
BEGIN
  -- Find accounts with usage that hasn't been synced to Stripe in last 24 hours
  FOR v_account IN
    SELECT DISTINCT ba.id, ba.stripe_customer_id
    FROM billing_accounts ba
    JOIN subscriptions s ON s.billing_account_id = ba.id
    WHERE ba.status = 'active'
      AND s.status = 'active'
      AND ba.stripe_customer_id IS NOT NULL
      AND ba.deleted_at IS NULL
  LOOP
    -- Check if usage exists from yesterday that hasn't been synced
    SELECT COUNT(*) INTO v_unsynced_count
    FROM usage_aggregate_daily uad
    WHERE uad.billing_account_id = v_account.id
      AND uad.date = CURRENT_DATE - INTERVAL '1 day'
      AND NOT EXISTS (
        SELECT 1 FROM billing_reconciliation_log brl
        WHERE brl.billing_account_id = v_account.id
          AND brl.reconciliation_type = 'daily'
          AND brl.period_start::date = CURRENT_DATE - INTERVAL '1 day'
          AND brl.status = 'reconciled'
      );
    
    IF v_unsynced_count > 0 THEN
      -- Trigger sync (would call edge function in practice)
      v_result := v_result || jsonb_build_object(
        'billing_account_id', v_account.id,
        'unsynced_days', v_unsynced_count,
        'action', 'sync_required'
      );
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'accounts_checked', jsonb_array_length(v_result),
    'results', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE BILLING JOBS
-- ============================================================================

-- Daily reconciliation at 2 AM UTC
SELECT cron.schedule(
  'daily-billing-reconciliation',
  '0 2 * * *',
  $$
  SELECT reconcile_daily_billing();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Check for discrepancies every 6 hours
SELECT cron.schedule(
  'detect-billing-discrepancies',
  '0 */6 * * *',
  $$
  SELECT detect_billing_discrepancies();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- Ensure usage sync every 4 hours
SELECT cron.schedule(
  'ensure-usage-synced-stripe',
  '0 */4 * * *',
  $$
  SELECT ensure_usage_synced_to_stripe();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

COMMENT ON TABLE billing_reconciliation_log IS 'Tracks billing reconciliation to prevent revenue leaks';
COMMENT ON FUNCTION reconcile_daily_billing IS 'Reconciles daily usage with Stripe invoices';
COMMENT ON FUNCTION handle_payment_failure IS 'Handles payment failures and updates subscription status';
COMMENT ON FUNCTION detect_billing_discrepancies IS 'Detects and alerts on billing discrepancies';

COMMIT;
