-- Migration: ops_intelligence_cron_jobs
-- Created: 2026-01-30 00:00:01 UTC
-- Description: Schedule cron jobs for Ops Intelligence insights and briefings

BEGIN;

-- ============================================================================
-- SCHEDULE OPS INSIGHTS GENERATION (Daily)
-- ============================================================================

-- Generate insights daily at 2 AM UTC
SELECT cron.schedule(
  'generate-ops-insights-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-ops-insights',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'daily')
  ) AS request_id;
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- ============================================================================
-- SCHEDULE WEEKLY BRIEFING GENERATION (Weekly)
-- ============================================================================

-- Generate weekly briefing every Monday at 9 AM UTC
SELECT cron.schedule(
  'generate-weekly-briefing',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-weekly-briefing',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'weekly')
  ) AS request_id;
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- ============================================================================
-- SCHEDULE INSIGHT EXPIRATION (Daily)
-- ============================================================================

-- Expire old insights daily at 3 AM UTC
SELECT cron.schedule(
  'expire-ops-insights-daily',
  '0 3 * * *',
  $$
  SELECT expire_insights();
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

COMMIT;
