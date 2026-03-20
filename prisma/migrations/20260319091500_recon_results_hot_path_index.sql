-- Hot-path index for job progress/status lookups.
-- Matches query pattern:
--   WHERE recon_job_id = ? AND tenant_id = ? AND status = 'running'
--   ORDER BY started_at DESC LIMIT 1
CREATE INDEX IF NOT EXISTS recon_results_recon_job_tenant_status_started_idx
ON recon_results (recon_job_id, tenant_id, status, started_at DESC);

