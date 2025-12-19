-- Migration: Enhanced Agent Cron Jobs with Orchestrator & Monitoring
-- Created: 2026-01-27
-- Description: Updates cron jobs to route through agent-orchestrator and adds monitoring

BEGIN;

-- ============================================================================
-- UPDATE EXISTING JOBS TO USE ORCHESTRATOR
-- ============================================================================

-- Unschedule old direct agent calls
SELECT cron.unschedule('strategic-governor-weekly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'strategic-governor-weekly'
);
SELECT cron.unschedule('architecture-sentinel-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'architecture-sentinel-daily'
);
SELECT cron.unschedule('user-intent-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'user-intent-daily'
);
SELECT cron.unschedule('preemptive-support-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'preemptive-support-daily'
);
SELECT cron.unschedule('organic-growth-weekly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'organic-growth-weekly'
);
SELECT cron.unschedule('autonomous-cfo-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'autonomous-cfo-daily'
);

-- ============================================================================
-- NEW JOBS: Route through Agent Orchestrator
-- ============================================================================

-- Strategic Governor: Every Monday at 9 AM UTC (via orchestrator)
SELECT cron.schedule(
  'strategic-governor-weekly',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('agent_type', 'strategic_governor', 'action', 'run')
  ) AS request_id;
  $$
);

-- Architecture Sentinel: Daily at 2 AM UTC (via orchestrator)
SELECT cron.schedule(
  'architecture-sentinel-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('agent_type', 'architecture_sentinel', 'action', 'run')
  ) AS request_id;
  $$
);

-- User Intent Synthesizer: Daily at 3 AM UTC (via orchestrator)
SELECT cron.schedule(
  'user-intent-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('agent_type', 'user_intent_synthesizer', 'action', 'run')
  ) AS request_id;
  $$
);

-- Preemptive Support: Daily at 4 AM UTC (via orchestrator)
SELECT cron.schedule(
  'preemptive-support-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('agent_type', 'preemptive_support', 'action', 'run')
  ) AS request_id;
  $$
);

-- Organic Growth: Weekly on Sunday at 10 AM UTC (via orchestrator)
SELECT cron.schedule(
  'organic-growth-weekly',
  '0 10 * * 0',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('agent_type', 'organic_growth', 'action', 'run')
  ) AS request_id;
  $$
);

-- Autonomous CFO: Daily at 5 AM UTC (via orchestrator)
SELECT cron.schedule(
  'autonomous-cfo-daily',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('agent_type', 'autonomous_cfo', 'action', 'run')
  ) AS request_id;
  $$
);

-- ============================================================================
-- NEW: Agent Monitor (Dead-Man Switch) - Every 30 minutes
-- ============================================================================

SELECT cron.schedule(
  'agent-monitor-deadman',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/agent-monitor',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- NEW: Daily Founder Digest - Every day at 8 AM UTC
-- ============================================================================

SELECT cron.schedule(
  'founder-digest-daily',
  '0 8 * * *', -- Daily at 8 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/automated-alerting',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'digest', 'type', 'daily')
  ) AS request_id;
  $$
);

-- ============================================================================
-- NEW: Weekly Founder Digest - Every Monday at 9 AM UTC
-- ============================================================================

SELECT cron.schedule(
  'founder-digest-weekly',
  '0 9 * * 1', -- Every Monday at 9 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/automated-alerting',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'digest', 'type', 'weekly')
  ) AS request_id;
  $$
);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- 
-- View all scheduled jobs:
-- SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;
--
-- View recent job runs:
-- SELECT jobid, jobname, status, return_message, start_time 
-- FROM cron.job_run_details 
-- ORDER BY start_time DESC 
-- LIMIT 20;
--
-- ============================================================================
