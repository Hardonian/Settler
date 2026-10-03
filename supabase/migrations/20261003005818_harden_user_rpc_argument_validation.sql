-- Harden user RPC argument validation (2026-10-03).
--
-- p3 verification of the browser-executable SECURITY DEFINER allowlist found
-- two caller-parameterized oracles that bypass RLS without checking the caller:
--
-- 1. get_user_activity_metrics(user_id): probed any user's activity,
--    subscription, and payment-recovery state. Now requires self or admin.
--    (The web's customer-segmentation view legitimately reads other members'
--    metrics for admins, so is_admin() is permitted.)
-- 2. validate_usage_event_server_side(...): returned billing/subscription/
--    add-on state for ANY billing account id. Now only validates billing
--    accounts owned by the caller (or admin) and returns false otherwise,
--    preserving its boolean-validation contract.
--
-- Both keep signatures and return shapes unchanged.

CREATE OR REPLACE FUNCTION public.get_user_activity_metrics(user_id uuid)
RETURNS TABLE (
  active_last_7_days boolean,
  active_days_last_30 integer,
  days_since_last_activity integer,
  total_jobs_created integer,
  has_upgraded boolean,
  using_premium_features boolean,
  explicitly_cancelled boolean,
  has_payment_issues boolean,
  usage_percentage numeric,
  integration_count integer,
  viewed_enterprise_features boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app_private AS $$
BEGIN
  IF get_user_activity_metrics.user_id IS DISTINCT FROM auth.uid()
     AND NOT COALESCE(is_admin(), false) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
      AND created_at > NOW() - INTERVAL '7 days'
    ) AS active_last_7_days,

    COALESCE((
      SELECT COUNT(DISTINCT DATE(created_at))::INTEGER
      FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
      AND created_at > NOW() - INTERVAL '30 days'
    ), 0) AS active_days_last_30,

    COALESCE((
      SELECT EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER
      FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
    ), 999) AS days_since_last_activity,

    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
    ), 0) AS total_jobs_created,

    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = get_user_activity_metrics.user_id
      AND status = 'active'
      AND plan_type IN ('commercial', 'enterprise')
    ) AS has_upgraded,

    FALSE AS using_premium_features,

    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = get_user_activity_metrics.user_id
      AND status = 'cancelled'
      AND cancelled_at IS NOT NULL
    ) AS explicitly_cancelled,

    EXISTS (
      SELECT 1 FROM payment_recovery
      WHERE payment_recovery.user_id = get_user_activity_metrics.user_id
      AND status = 'active'
    ) AS has_payment_issues,

    50.0 AS usage_percentage,

    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM integration_credentials
      WHERE integration_credentials.user_id = get_user_activity_metrics.user_id
      AND status = 'active'
    ), 0) AS integration_count,

    FALSE AS viewed_enterprise_features;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_activity_metrics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_activity_metrics(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.validate_usage_event_server_side(
  p_billing_account_id uuid,
  p_event_type character varying,
  p_integration_id character varying DEFAULT NULL::character varying,
  p_add_on_id uuid DEFAULT NULL::uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app_private AS $$
DECLARE
  v_billing_account RECORD;
  v_subscription RECORD;
  v_add_on_purchase RECORD;
BEGIN
  -- Ownership: only the billing account owner (or an admin) may validate it.
  SELECT * INTO v_billing_account
  FROM billing_accounts
  WHERE id = p_billing_account_id
    AND status = 'active'
    AND deleted_at IS NULL
    AND (user_id = auth.uid() OR COALESCE(is_admin(), false));

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE billing_account_id = p_billing_account_id
    AND status = 'active'
    AND current_period_end > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
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

  IF p_add_on_id IS NOT NULL THEN
    SELECT * INTO v_add_on_purchase
    FROM add_on_purchases
    WHERE billing_account_id = p_billing_account_id
      AND add_on_id = p_add_on_id
      AND status = 'active';

    IF NOT FOUND THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_usage_event_server_side(uuid, character varying, character varying, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_usage_event_server_side(uuid, character varying, character varying, uuid) TO authenticated, service_role;
