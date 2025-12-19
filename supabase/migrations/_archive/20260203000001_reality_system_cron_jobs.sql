-- ============================================================================
-- REALITY SYSTEM - CRON JOBS SETUP
-- Created: 2026-02-03 00:00:01 UTC
-- Description: Sets up automated cron jobs for Reality System
-- ============================================================================

BEGIN;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- CRON JOB 1: Collect Reality Metrics (Hourly)
-- ============================================================================

-- Remove existing job if it exists
SELECT cron.unschedule('collect-reality-metrics') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'collect-reality-metrics'
);

-- Schedule metric collection every hour
SELECT cron.schedule(
  'collect-reality-metrics',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/collect-reality-metrics',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- CRON JOB 2: Weekly Reality Loop (Monday 9 AM UTC)
-- ============================================================================

-- Remove existing job if it exists
SELECT cron.unschedule('weekly-reality-loop') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly-reality-loop'
);

-- Schedule weekly loop every Monday at 9 AM UTC
SELECT cron.schedule(
  'weekly-reality-loop',
  '0 9 * * 1',  -- Monday at 9:00 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/weekly-reality-loop',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- ALTERNATIVE: Using Supabase Edge Functions HTTP Invocation
-- ============================================================================

-- Note: If pg_cron is not available, use Supabase Dashboard > Database > Cron Jobs
-- Or set up via GitHub Actions / external scheduler

-- Example GitHub Actions workflow is provided in:
-- .github/workflows/reality-system.yml

COMMENT ON SCHEMA public IS 'Reality System cron jobs configured. Check cron.job table for scheduled jobs.';

COMMIT;
