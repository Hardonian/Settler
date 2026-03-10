-- Performance Indexes Migration
-- Optimizes database queries for 10x scale with composite indexes, partial indexes, and GIN indexes

-- ============================================================================
-- 1. COMPOSITE INDEXES FOR TENANT-SCOPED QUERIES
-- ============================================================================

-- Jobs: Most common query pattern is tenant_id + created_at (list jobs)
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_created_at 
  ON jobs(tenant_id, created_at DESC);

-- Jobs: Filter by tenant + status (active jobs, pending jobs)
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status_created 
  ON jobs(tenant_id, status, created_at DESC);

-- Executions: Tenant + status + started_at (recent executions)
CREATE INDEX IF NOT EXISTS idx_executions_tenant_status_started 
  ON executions(tenant_id, status, started_at DESC);

-- Executions: Job + status (executions for a job)
CREATE INDEX IF NOT EXISTS idx_executions_job_status_started 
  ON executions(job_id, status, started_at DESC);

-- Matches: Tenant + execution (matches for reconciliation)
CREATE INDEX IF NOT EXISTS idx_matches_tenant_execution 
  ON matches(tenant_id, execution_id, matched_at DESC);

-- Matches: Tenant + job + confidence (high-confidence matches)
CREATE INDEX IF NOT EXISTS idx_matches_tenant_job_confidence 
  ON matches(tenant_id, job_id, confidence DESC);

-- Unmatched: Tenant + execution (unmatched records)
CREATE INDEX IF NOT EXISTS idx_unmatched_tenant_execution 
  ON unmatched(tenant_id, execution_id, created_at DESC);

-- Reports: Tenant + execution (reports for reconciliation)
CREATE INDEX IF NOT EXISTS idx_reports_tenant_execution 
  ON reports(tenant_id, execution_id, generated_at DESC);

-- Reports: Tenant + date range (reports in date range)
CREATE INDEX IF NOT EXISTS idx_reports_tenant_date_range 
  ON reports(tenant_id, date_range_start, date_range_end);

-- Audit logs: Tenant + timestamp (audit trail)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp 
  ON audit_logs(tenant_id, timestamp DESC);

-- Audit logs: Tenant + event + timestamp (specific events)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_event_timestamp 
  ON audit_logs(tenant_id, event, timestamp DESC);

-- Reconciliation runs: Operator/control-plane windows and list queries
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_started_created_id
  ON reconciliation_runs((COALESCE(started_at, created_at)) DESC, id DESC);

-- Reconciliation runs: Tenant activity and health lookups
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_started_created
  ON reconciliation_runs(tenant_id, (COALESCE(started_at, created_at)) DESC);

-- Reconciliation runs: Failed-run scans in operator anomaly checks
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_status_started_created
  ON reconciliation_runs(status, (COALESCE(started_at, created_at)) DESC);

-- Reconciliation matches: Join/group path used to compute manual review rates
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_manual_review_rollup
  ON reconciliation_matches(run_id, tenant_id)
  WHERE reviewed = false AND match_type IN ('manual', 'unmatched');

-- Runtime event stream: hot query for error signatures in control plane
CREATE INDEX IF NOT EXISTS idx_operator_runtime_events_error_signature_recent
  ON operator_runtime_events(event_type, occurred_at DESC)
  INCLUDE (error_id, tenant_id, run_id, metadata)
  WHERE event_type = 'error_thrown';

-- request_metrics may be absent in slim deployments, so guard creation.
DO $$
BEGIN
  IF to_regclass('public.request_metrics') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_request_metrics_created_route_status
      ON request_metrics(created_at DESC, route, status_code)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_request_metrics_created_api
      ON request_metrics(created_at DESC)
      WHERE route LIKE ''/api/%''';
  END IF;
END
$$;

-- ============================================================================
-- 2. PARTIAL INDEXES FOR HOT SUBSETS
-- ============================================================================

-- Active jobs only (most common query)
CREATE INDEX IF NOT EXISTS idx_jobs_active_tenant_created 
  ON jobs(tenant_id, created_at DESC) 
  WHERE status = 'active';

-- Running executions only (monitoring)
CREATE INDEX IF NOT EXISTS idx_executions_running_tenant_started 
  ON executions(tenant_id, started_at DESC) 
  WHERE status = 'running';

-- Failed executions only (error tracking)
CREATE INDEX IF NOT EXISTS idx_executions_failed_tenant_started 
  ON executions(tenant_id, started_at DESC) 
  WHERE status = 'failed';

-- Pending webhook deliveries (retry queue)
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending_retry 
  ON webhook_deliveries(webhook_id, next_retry_at) 
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- Active webhooks only
CREATE INDEX IF NOT EXISTS idx_webhooks_active_tenant 
  ON webhooks(tenant_id, created_at DESC) 
  WHERE status = 'active';

-- Non-revoked API keys only
CREATE INDEX IF NOT EXISTS idx_api_keys_active_tenant 
  ON api_keys(tenant_id, created_at DESC) 
  WHERE revoked_at IS NULL;

-- Non-expired idempotency keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_active_tenant 
  ON idempotency_keys(tenant_id, created_at DESC) 
  WHERE expires_at > NOW();

-- ============================================================================
-- 3. GIN INDEXES FOR JSONB COLUMNS
-- ============================================================================

-- Jobs rules (for querying by matching rules)
CREATE INDEX IF NOT EXISTS idx_jobs_rules_gin 
  ON jobs USING GIN (rules);

-- Executions summary (for querying summary data)
CREATE INDEX IF NOT EXISTS idx_executions_summary_gin 
  ON executions USING GIN (summary);

-- Reports summary (for querying report data)
CREATE INDEX IF NOT EXISTS idx_reports_summary_gin 
  ON reports USING GIN (summary);

-- Tenant quotas (for querying quota configs)
CREATE INDEX IF NOT EXISTS idx_tenants_quotas_gin 
  ON tenants USING GIN (quotas);

-- Tenant config (for querying configs)
CREATE INDEX IF NOT EXISTS idx_tenants_config_gin 
  ON tenants USING GIN (config);

-- Audit logs metadata (for querying audit metadata)
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin 
  ON audit_logs USING GIN (metadata);

-- Webhook payloads (for querying payloads)
CREATE INDEX IF NOT EXISTS idx_webhook_payloads_payload_gin 
  ON webhook_payloads USING GIN (payload);

-- Webhook deliveries payload (for querying delivery payloads)
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_payload_gin 
  ON webhook_deliveries USING GIN (payload);

-- ============================================================================
-- 4. COVERING INDEXES (INCLUDE COLUMNS FOR COMMON QUERIES)
-- ============================================================================

-- Jobs list query covering index (avoids table lookup)
CREATE INDEX IF NOT EXISTS idx_jobs_list_covering 
  ON jobs(tenant_id, created_at DESC) 
  INCLUDE (id, name, status, source_adapter, target_adapter);

-- Executions list query covering index
CREATE INDEX IF NOT EXISTS idx_executions_list_covering 
  ON executions(tenant_id, started_at DESC) 
  INCLUDE (id, job_id, status, completed_at);

-- ============================================================================
-- 5. INDEXES FOR CURSOR-BASED PAGINATION
-- ============================================================================

-- Cursor pagination for jobs (using created_at as cursor)
CREATE INDEX IF NOT EXISTS idx_jobs_cursor_pagination 
  ON jobs(tenant_id, created_at DESC, id DESC);

-- Cursor pagination for executions
CREATE INDEX IF NOT EXISTS idx_executions_cursor_pagination 
  ON executions(tenant_id, started_at DESC, id DESC);

-- Cursor pagination for matches
CREATE INDEX IF NOT EXISTS idx_matches_cursor_pagination 
  ON matches(tenant_id, matched_at DESC, id DESC);

-- ============================================================================
-- 6. FUNCTIONAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Jobs by name (case-insensitive search)
CREATE INDEX IF NOT EXISTS idx_jobs_name_lower 
  ON jobs(tenant_id, LOWER(name));

-- Users by email (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
  ON users(tenant_id, LOWER(email));

-- ============================================================================
-- 7. STATISTICS AND ANALYZE
-- ============================================================================

-- Update table statistics for query planner
ANALYZE jobs;
ANALYZE executions;
ANALYZE matches;
ANALYZE unmatched;
ANALYZE reports;
ANALYZE tenants;
ANALYZE users;
ANALYZE webhooks;
ANALYZE audit_logs;
