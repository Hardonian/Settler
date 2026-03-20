BEGIN;

-- Hot-path index for progress polling and latest-run lookups.
-- Query shape:
--   WHERE recon_job_id = ? AND tenant_id = ? AND status = 'running'
--   ORDER BY started_at DESC LIMIT 1
CREATE INDEX IF NOT EXISTS idx_recon_results_job_tenant_status_started
ON public.recon_results (recon_job_id, tenant_id, status, started_at DESC);

COMMIT;

