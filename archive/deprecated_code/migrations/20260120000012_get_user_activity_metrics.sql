-- Migration: get_user_activity_metrics function
-- Created: 2026-01-20
-- Description: RPC function to get user activity metrics for lifecycle automation

BEGIN;

CREATE OR REPLACE FUNCTION get_user_activity_metrics(user_id UUID)
RETURNS TABLE (
  active_last_7_days BOOLEAN,
  active_days_last_30 INTEGER,
  days_since_last_activity INTEGER,
  total_jobs_created INTEGER,
  has_upgraded BOOLEAN,
  using_premium_features BOOLEAN,
  explicitly_cancelled BOOLEAN,
  has_payment_issues BOOLEAN,
  usage_percentage DECIMAL,
  integration_count INTEGER,
  viewed_enterprise_features BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Active in last 7 days
    EXISTS (
      SELECT 1 FROM reconciliation_jobs
      WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
      AND created_at > NOW() - INTERVAL '7 days'
    ) AS active_last_7_days,
    
    -- Active days in last 30
    COUNT(DISTINCT DATE(created_at))::INTEGER AS active_days_last_30
    FROM reconciliation_jobs
    WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id
    AND created_at > NOW() - INTERVAL '30 days',
    
    -- Days since last activity
    COALESCE(
      EXTRACT(DAY FROM NOW() - MAX(created_at))::INTEGER,
      999
    ) AS days_since_last_activity
    FROM reconciliation_jobs
    WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id,
    
    -- Total jobs created
    COUNT(*)::INTEGER AS total_jobs_created
    FROM reconciliation_jobs
    WHERE reconciliation_jobs.user_id = get_user_activity_metrics.user_id,
    
    -- Has upgraded
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = get_user_activity_metrics.user_id
      AND status = 'active'
      AND plan_type IN ('commercial', 'enterprise')
    ) AS has_upgraded,
    
    -- Using premium features (mock for now)
    FALSE AS using_premium_features,
    
    -- Explicitly cancelled
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = get_user_activity_metrics.user_id
      AND status = 'cancelled'
      AND cancelled_at IS NOT NULL
    ) AS explicitly_cancelled,
    
    -- Has payment issues
    EXISTS (
      SELECT 1 FROM payment_recovery
      WHERE payment_recovery.user_id = get_user_activity_metrics.user_id
      AND status = 'active'
    ) AS has_payment_issues,
    
    -- Usage percentage (mock calculation)
    50.0 AS usage_percentage,
    
    -- Integration count
    COUNT(*)::INTEGER AS integration_count
    FROM integration_credentials
    WHERE integration_credentials.user_id = get_user_activity_metrics.user_id
    AND is_connected = TRUE,
    
    -- Viewed enterprise features (mock)
    FALSE AS viewed_enterprise_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_activity_metrics IS 'Returns comprehensive activity metrics for a user for lifecycle automation';

COMMIT;
