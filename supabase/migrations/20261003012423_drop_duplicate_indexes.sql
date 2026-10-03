-- Drop provably redundant duplicate indexes (2026-10-03).
--
-- 51 duplicate_index findings (Supabase performance advisor). Each flagged
-- pair was verified definition-identical (columns + uniqueness) before
-- removal; the kept index preserves query capability and uniqueness.
-- Constraint-backed indexes are kept over plain duplicates. No index name
-- is referenced by application SQL, query hints, or scripts outside
-- migration DDL (repo-wide search).
--
-- The 31 api_call_logs partition findings resolve at the PARENT level:
-- api_call_logs carries two identical btree(tenant_id) parent indexes
-- (idx_api_call_logs_tenant, idx_api_call_logs_tenant_id), each attached to
-- one child index per daily partition. Dropping the parent
-- idx_api_call_logs_tenant cascades its 31 loose children, removing 32
-- redundant index objects while idx_api_call_logs_tenant_id and its
-- children remain attached. Forward-only.

-- add_on_purchases: keep idx_add_on_purchases_ba_id, drop idx_add_on_purchases_billing_account_id
DROP INDEX IF EXISTS "idx_add_on_purchases_billing_account_id";
-- billing_accounts: keep idx_billing_accounts_tenant, drop idx_billing_accounts_tenant_id
DROP INDEX IF EXISTS "idx_billing_accounts_tenant_id";
-- billing_accounts: keep idx_billing_accounts_user, drop idx_billing_accounts_user_id
DROP INDEX IF EXISTS "idx_billing_accounts_user_id";
-- deterministic_match_results: keep idx_deterministic_match_results_run_result_id, drop idx_deterministic_match_run_result_id
DROP INDEX IF EXISTS "idx_deterministic_match_run_result_id";
-- deterministic_match_results: keep idx_deterministic_match_results_snapshot_id, drop idx_deterministic_match_snapshot_id
DROP INDEX IF EXISTS "idx_deterministic_match_snapshot_id";
-- deterministic_match_results: keep idx_deterministic_match_results_tenant_id, drop idx_deterministic_match_tenant_id
DROP INDEX IF EXISTS "idx_deterministic_match_tenant_id";
-- feature_flags: keep idx_feature_flags_billing_account, drop idx_feature_flags_billing_account_id
DROP INDEX IF EXISTS "idx_feature_flags_billing_account_id";
-- receipt_uploads: keep idx_receipt_uploads_ba_id, drop idx_receipt_uploads_billing_account_id
DROP INDEX IF EXISTS "idx_receipt_uploads_billing_account_id";
-- recon_jobs: keep idx_recon_jobs_template, drop idx_recon_jobs_template_id
DROP INDEX IF EXISTS "idx_recon_jobs_template_id";
-- recon_jobs: keep idx_recon_jobs_tenant, drop idx_recon_jobs_tenant_id
DROP INDEX IF EXISTS "idx_recon_jobs_tenant_id";
-- recon_results: keep idx_recon_results_job, drop idx_recon_results_recon_job_id
DROP INDEX IF EXISTS "idx_recon_results_recon_job_id";
-- recon_results: keep idx_recon_results_tenant, drop idx_recon_results_tenant_id
DROP INDEX IF EXISTS "idx_recon_results_tenant_id";
-- recon_templates: keep idx_recon_templates_is_public, drop idx_recon_templates_public
DROP INDEX IF EXISTS "idx_recon_templates_public";
-- recon_templates: keep idx_recon_templates_tenant, drop idx_recon_templates_tenant_id
DROP INDEX IF EXISTS "idx_recon_templates_tenant_id";
-- reconciliation_matches: keep idx_reconciliation_matches_run, drop idx_reconciliation_matches_run_id
DROP INDEX IF EXISTS "idx_reconciliation_matches_run_id";
-- reconciliation_matches: keep idx_reconciliation_matches_tenant, drop idx_reconciliation_matches_tenant_id
DROP INDEX IF EXISTS "idx_reconciliation_matches_tenant_id";
-- reconciliation_runs: keep idx_reconciliation_runs_tenant, drop idx_reconciliation_runs_tenant_id
DROP INDEX IF EXISTS "idx_reconciliation_runs_tenant_id";
-- run_snapshots: keep run_snapshots_tenant_id_run_fingerprint_key, drop idx_run_snapshots_tenant_fingerprint
DROP INDEX IF EXISTS "idx_run_snapshots_tenant_fingerprint";
-- usage_aggregate_daily: keep idx_usage_aggregate_daily_ba_id, drop idx_usage_aggregate_daily_billing_account_id
DROP INDEX IF EXISTS "idx_usage_aggregate_daily_billing_account_id";
-- webhook_deliveries: keep idx_webhook_deliveries_webhook, drop idx_webhook_deliveries_webhook_id
DROP INDEX IF EXISTS "idx_webhook_deliveries_webhook_id";
-- api_call_logs (parent): keep idx_api_call_logs_tenant_id, drop idx_api_call_logs_tenant
DROP INDEX IF EXISTS "idx_api_call_logs_tenant";
