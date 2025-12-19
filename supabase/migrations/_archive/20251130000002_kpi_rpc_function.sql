-- Migration: kpi_rpc_function
-- Created: 2025-11-30
-- Description: RPC function to query KPI health status (for API endpoints)

BEGIN;

-- Function to get KPI health status (for API endpoints that can't query views directly)
CREATE OR REPLACE FUNCTION get_kpi_health_status()
RETURNS TABLE (
  new_users_week BIGINT,
  actions_last_hour BIGINT,
  top_post_engagement BIGINT,
  all_cylinders_firing BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT count FROM kpi_new_users_week)::BIGINT as new_users_week,
    (SELECT count FROM kpi_actions_last_hour)::BIGINT as actions_last_hour,
    COALESCE((SELECT total_engagement FROM kpi_most_engaged_post_today)::BIGINT, 0) as top_post_engagement,
    CASE
      WHEN (SELECT count FROM kpi_new_users_week) > 50 
        AND (SELECT count FROM kpi_actions_last_hour) > 100
        AND COALESCE((SELECT total_engagement FROM kpi_most_engaged_post_today), 0) > 100
      THEN true
      ELSE false
    END as all_cylinders_firing;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION get_kpi_health_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_kpi_health_status() TO anon;

COMMIT;
