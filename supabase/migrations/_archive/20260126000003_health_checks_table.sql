-- Migration: Health Checks Table
-- Created: 2026-01-26
-- Description: Store automated health check results for monitoring and alerting

BEGIN;

CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type VARCHAR(100) NOT NULL, -- 'automated', 'manual', 'scheduled'
  overall_status VARCHAR(50) NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'unhealthy')),
  results JSONB NOT NULL, -- Array of check results
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(overall_status);
CREATE INDEX IF NOT EXISTS idx_health_checks_type ON health_checks(check_type);

-- Function to get recent health check summary
CREATE OR REPLACE FUNCTION get_health_check_summary(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  last_check TIMESTAMPTZ,
  failure_count INTEGER,
  success_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH check_results AS (
    SELECT
      (result->>'check')::TEXT as check_name,
      (result->>'status')::TEXT as status,
      hc.timestamp
    FROM health_checks hc,
    LATERAL jsonb_array_elements(hc.results) as result
    WHERE hc.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
  )
  SELECT
    check_name,
    MAX(CASE WHEN status = 'unhealthy' THEN 'unhealthy'
             WHEN status = 'degraded' THEN 'degraded'
             ELSE 'healthy' END) as status,
    MAX(timestamp) as last_check,
    COUNT(*) FILTER (WHERE status = 'unhealthy') as failure_count,
    COUNT(*) FILTER (WHERE status = 'healthy') as success_count
  FROM check_results
  GROUP BY check_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE health_checks IS 'Stores automated health check results for monitoring';
COMMENT ON FUNCTION get_health_check_summary(INTEGER) IS 'Returns summary of health checks over specified hours';

COMMIT;
