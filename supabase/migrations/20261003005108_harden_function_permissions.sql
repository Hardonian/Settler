-- Harden SECURITY DEFINER function permissions (2026-10-03).
--
-- Baseline: 140 anon-executable + 145 authenticated-executable SECURITY DEFINER
-- functions (Supabase security advisor). Each of the 145 was traced to callers:
-- pg_trigger targets, cron.job commands, repo .rpc()/rest calls, and RLS
-- policy expressions. Every function already pins search_path (verified
-- proconfig). This migration grants browser-role EXECUTE only where a caller
-- is proven and the body enforces auth.uid()/admin predicates:
--
--   keep anon+authenticated (RLS policy helpers; policies evaluate as anon too):
--     ['current_tenant_id', 'get_user_tenant_ids', 'is_admin_user', 'is_tenant_admin']
--   keep authenticated only (user RPCs; bodies verified 2026-10-03):
--     invite create/accept (is_tenant_admin / auth.uid + token+expiry guards),
--     presence (own-row only), cms_upsert_page (tenant guard, hardened below),
--     console/activity/KPI reads, usage logging, workspace/org id lookups,
--     get_tables + validate_usage_event_server_side (proven web callers).
--   revoke everything else (trigger, cron, maintenance, unreferenced):
--     124 functions including accept_recommendation (no auth/tenant check,
--     caller-supplied actor) which is deliberately NOT callable by browser
--     roles until redesigned.
--
-- service_role EXECUTE is preserved explicitly on every touched function.
-- postgres (owner) is unaffected.

DO $$
DECLARE fn record;
BEGIN
  -- Policy helpers: keep browser EXECUTE, drop PUBLIC inheritance
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.proname = ANY (ARRAY['current_tenant_id', 'get_user_tenant_ids', 'is_admin_user', 'is_tenant_admin'])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', fn.sig);
  END LOOP;

  -- User RPCs: authenticated only
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.proname = ANY (ARRAY['accept_email_invite', 'accept_membership_invite', 'cms_upsert_page', 'create_email_invite', 'create_membership_invite', 'current_user_id', 'get_current_tenant', 'get_kpi_health_status', 'get_recent_console_activities', 'get_tables', 'get_user_activity_metrics', 'get_user_org_ids', 'get_user_tenant_ids_secure', 'is_admin', 'log_console_activity', 'log_usage_event', 'set_presence_status', 'touch_presence', 'validate_usage_event_server_side'])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn.sig);
  END LOOP;

  -- Internal: no browser access at all
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.proname = ANY (ARRAY['accept_recommendation', 'audit_billing_account_changes', 'audit_integration_credential_changes', 'audit_subscription_changes', 'auto_archive_stale_content', 'auto_disable_failing_integrations', 'auto_enable_rls', 'auto_resolve_confusion', 'backfill_log_partition', 'broadcast_receipt_events_changes', 'broadcast_receipt_items_changes', 'broadcast_receipt_outbox_changes', 'broadcast_receipts_changes', 'bump_message_count', 'check_ai_quota', 'check_and_suspend_abusive_accounts', 'check_circuit_breaker', 'check_critical_job_failures', 'check_data_freshness', 'check_degraded_mode', 'check_rate_limit', 'check_rate_limit_alerts', 'cleanup_expired_idempotency_keys', 'cleanup_expired_revoked_tokens', 'cleanup_old_agent_runs', 'cleanup_old_alerts', 'cleanup_old_api_logs', 'cleanup_old_audit_logs', 'cleanup_old_console_activities', 'cleanup_old_diagnostics', 'cleanup_old_health_checks', 'cleanup_old_rate_limits', 'cleanup_old_stripe_events', 'cleanup_old_usage_events', 'cleanup_old_webhook_deliveries', 'cms_log_page_changes', 'cms_pages_broadcast_trigger', 'create_alert_from_fraud_signal', 'create_state_change_event', 'create_system_state_snapshot', 'create_weekly_snapshot', 'current_user_workspace_ids', 'decrypt_credential', 'delete_user_data', 'detect_anomalies', 'detect_assumption_drift', 'detect_billing_discrepancies', 'detect_low_confidence_results', 'detect_stale_content', 'detect_user_confusion', 'encrypt_credential', 'enforce_rate_limit', 'enforce_subscription_for_feature_flags', 'enforce_subscription_for_receipts', 'enforce_subscription_for_recon_jobs', 'enqueue_receipt_webhooks', 'ensure_cron', 'ensure_receipt_confidence', 'ensure_usage_synced_to_stripe', 'execute_recommendation', 'export_user_data', 'fetch_next_webhook_delivery', 'fn_write_diagnostics', 'fn_write_health_summary', 'get_api_key_tenant', 'get_change_audit_summary', 'get_re_entry_summary', 'get_table_schema', 'get_table_size_monitoring', 'get_user_billing_account_id', 'handle_new_user', 'handle_payment_failure', 'handle_updated_at', 'has_active_subscription', 'has_add_on_purchase', 'has_cms_write_role', 'has_plan_or_higher', 'is_ip_blocked', 'is_paid', 'is_tenant_member', 'jwt_tenant_id', 'log_audit_event', 'log_automated_decision', 'log_confidence_event', 'log_job_failure', 'mark_webhook_delivery_result', 'messages_rate_limit_trigger', 'preview_token_allows', 'process_unresolved_confusion', 'propagate_tenant_id_to_api_keys', 'propagate_tenant_id_to_executions', 'propagate_tenant_id_to_idempotency_keys', 'propagate_tenant_id_to_jobs', 'propagate_tenant_id_to_matches', 'propagate_tenant_id_to_reports', 'propagate_tenant_id_to_unmatched', 'propagate_tenant_id_to_webhooks', 'receipt_events_enqueue_webhooks', 'receipts_broadcast_trigger', 'reconcile_daily_billing', 'record_ai_usage', 'record_circuit_breaker_failure', 'record_circuit_breaker_success', 'refresh_usage_materialized_views', 'reindex_recent_partitions', 'reset_daily_ai_quotas', 'reset_monthly_ai_quotas', 'resolve_insight', 'retry_failed_jobs', 'revoke_membership_invite', 'room_members_broadcast_trigger', 'room_messages_broadcast_trigger', 'rpc_fetch_next_job', 'rpc_fetch_next_webhook_delivery', 'rpc_mark_job_result', 'rpc_mark_webhook_delivery_result', 'run_data_retention_cleanup', 'send_pending_alert_notifications', 'truncate_old_partitions_before', 'validate_data_integrity', 'webhook_deliveries_broadcast_trigger', 'write_audit_notarization_checkpoint'])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;

-- cms_upsert_page: the tenant guard compared with <>, which FAILS OPEN when
-- get_user_tenant() is NULL (any unauthenticated caller passed the check).
-- Null-safe comparison + authenticated identity for created_by.
CREATE OR REPLACE FUNCTION public.cms_upsert_page(
  p_tenant_id uuid, p_slug text, p_title text, p_content jsonb,
  p_status text DEFAULT NULL, p_created_by uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app_private AS $$
DECLARE
  v_page_id uuid;
  v_status text;
BEGIN
  IF p_tenant_id IS DISTINCT FROM get_user_tenant() THEN
    RAISE EXCEPTION 'tenant mismatch';
  END IF;

  v_status := COALESCE(p_status, 'draft');

  INSERT INTO cms_pages (tenant_id, slug, title, status)
  VALUES (p_tenant_id, p_slug, p_title, v_status)
  ON CONFLICT (tenant_id, slug)
  DO UPDATE SET title = EXCLUDED.title,
                status = EXCLUDED.status,
                updated_at = NOW()
  RETURNING id INTO v_page_id;

  INSERT INTO cms_page_versions (page_id, content_json, created_by)
  VALUES (v_page_id, p_content,
          CASE WHEN auth.uid() IS NOT NULL THEN auth.uid() ELSE p_created_by END);

  IF v_status = 'published' THEN
    UPDATE cms_pages SET published_at = NOW() WHERE id = v_page_id;
  END IF;

  RETURN v_page_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cms_upsert_page(uuid, text, text, jsonb, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cms_upsert_page(uuid, text, text, jsonb, text, uuid) TO authenticated, service_role;
