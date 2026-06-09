-- P0-E RLS Hardening
-- This migration fixes the 23 `USING (true)` RLS bypasses identified in the adversarial audit.

-- 1. Service Role Only policies
-- These were misconfigured as USING (true) but their names imply they should only be readable
-- by the service_role (which bypasses RLS anyway). We set them to USING (false) to block all public/authenticated access.
ALTER POLICY agent_runs_select_service_role_only ON public.agent_runs USING (false);
ALTER POLICY architecture_violations_select_service_role_only ON public.architecture_violations USING (false);
ALTER POLICY automated_decisions_select_service_role_only ON public.automated_decisions USING (false);
ALTER POLICY billing_reconciliation_log_select_service_role_only ON public.billing_reconciliation_log USING (false);
ALTER POLICY circuit_breakers_select_service_role_only ON public.circuit_breakers USING (false);
ALTER POLICY job_failure_log_select_service_role_only ON public.job_failure_log USING (false);
ALTER POLICY release_safety_checks_select_service_role_only ON public.release_safety_checks USING (false);
ALTER POLICY staleness_checks_select_service_role_only ON public.staleness_checks USING (false);
ALTER POLICY system_state_snapshots_select_service_role_only ON public.system_state_snapshots USING (false);
ALTER POLICY usage_event_idempotency_select_service_role_only ON public.usage_event_idempotency USING (false);

-- 2. Tenant Scoped joined policies
-- alert_notifications must be joined to alerts to check tenant_id
DROP POLICY IF EXISTS alert_notifications_read ON public.alert_notifications;
CREATE POLICY alert_notifications_read ON public.alert_notifications
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.alerts 
    WHERE alerts.id = alert_notifications.alert_id 
    AND alerts.tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid
  ));

-- The following tables don't have a direct path to tenant_id and should be service_role only or admin only.
-- We lock them down to USING (false) for now to prevent data leakage. If users need to read them, a proper tenant relation must be added.
ALTER POLICY alert_rules_read ON public.alert_rules USING (false);
ALTER POLICY canned_responses_read ON public.canned_responses USING (false);
ALTER POLICY confidence_events_read ON public.confidence_events USING (false);
ALTER POLICY escalation_history_read ON public.escalation_history USING (false);
ALTER POLICY escalation_rules_read ON public.escalation_rules USING (false);
ALTER POLICY financial_insights_read ON public.financial_insights USING (false);
ALTER POLICY fraud_signals_read ON public.fraud_signals USING (false);
ALTER POLICY strategic_backlog_read ON public.strategic_backlog USING (false);
ALTER POLICY user_intent_insights_read ON public.user_intent_insights USING (false);

-- Note: `anon_read` policies on growth_content, newsletter_subscriptions, and support_categories are intentionally public and remain USING (true).

-- 3. Add tenant_id to activity_logs
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS tenant_id uuid;
-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON public.activity_logs USING btree (tenant_id);
-- Update RLS for activity_logs to use tenant_id
DROP POLICY IF EXISTS activity_logs_read ON public.activity_logs;
CREATE POLICY activity_logs_read ON public.activity_logs
  FOR SELECT
  USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);

-- 4. Create super_admin_audit_logs to track bypasses
CREATE TABLE IF NOT EXISTS public.super_admin_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  tenant_id_accessed uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admin_audit_logs ENABLE ROW LEVEL SECURITY;
-- Only service role can read/write to prevent tampering
CREATE POLICY super_admin_audit_logs_service_role_only ON public.super_admin_audit_logs USING (false);
