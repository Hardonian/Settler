-- Migration: Agent Cron Jobs Setup
-- Created: 2026-01-27
-- Description: Sets up pg_cron jobs for autonomous agents
-- Note: Requires pg_cron extension to be enabled

BEGIN;

-- Enable pg_cron extension if not already enabled
-- Note: Extension creation may require superuser privileges
-- If extension already exists, this will be ignored
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'pg_cron extension requires superuser privileges. Skipping.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create pg_cron extension: %', SQLERRM;
END $$;

-- ============================================================================
-- CRON JOB CONFIGURATION
-- ============================================================================

-- Strategic Governor: Every Monday at 9 AM UTC
SELECT cron.schedule(
  'strategic-governor-weekly',
  '0 9 * * 1', -- Every Monday at 9 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/strategic-governor-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Architecture Sentinel: Daily at 2 AM UTC
SELECT cron.schedule(
  'architecture-sentinel-daily',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/architecture-sentinel-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- User Intent Synthesizer: Daily at 3 AM UTC
SELECT cron.schedule(
  'user-intent-daily',
  '0 3 * * *', -- Daily at 3 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/user-intent-synthesizer-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Preemptive Support: Daily at 4 AM UTC
SELECT cron.schedule(
  'preemptive-support-daily',
  '0 4 * * *', -- Daily at 4 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/preemptive-support-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Organic Growth: Weekly on Sunday at 10 AM UTC
SELECT cron.schedule(
  'organic-growth-weekly',
  '0 10 * * 0', -- Every Sunday at 10 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/organic-growth-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Autonomous CFO: Daily at 5 AM UTC
SELECT cron.schedule(
  'autonomous-cfo-daily',
  '0 5 * * *', -- Daily at 5 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/autonomous-cfo-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- ALTERNATIVE: Use Supabase Edge Function URLs directly
-- If the above doesn't work, use this approach instead:
-- ============================================================================

-- Uncomment and modify these if you need to use direct URLs:
/*
-- Strategic Governor
SELECT cron.schedule(
  'strategic-governor-weekly',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/strategic-governor-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
*/

COMMENT ON EXTENSION pg_cron IS 'Enables scheduled execution of autonomous agent functions';

COMMIT;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
-- 
-- 1. Set your Supabase URL and Service Role Key:
--    ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
--
-- 2. Or modify the cron jobs above to use direct URLs and keys
--
-- 3. View scheduled jobs:
--    SELECT * FROM cron.job;
--
-- 4. View job run history:
--    SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- 5. Unschedule a job:
--    SELECT cron.unschedule('strategic-governor-weekly');
--
-- ============================================================================
