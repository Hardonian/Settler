-- =================================================================================
-- Resilience & Archival Milestone: Indexing Strategy & Bulk Audit Support
-- =================================================================================

-- 1. Bidirectional Graph Querying Indexes (Runs <-> Exceptions)
-- Optimizes loading a run's exceptions, specifically filtering by their resolution status.
CREATE INDEX IF NOT EXISTS idx_exceptions_run_id_status
ON public.exceptions(run_id, status);

-- Optimizes tenant-scoped queries searching for specific error signatures across runs.
CREATE INDEX IF NOT EXISTS idx_exceptions_tenant_signature
ON public.exceptions(tenant_id, error_signature);

-- 2. Stale Run Reaper Optimization
-- A partial index that ONLY tracks runs in the 'Processing' state.
-- This makes the Stale Run Reaper's sweep O(1) instead of scanning the entire table.
CREATE INDEX IF NOT EXISTS idx_runs_stale_reaper
ON public.runs(tenant_id, created_at)
WHERE status = 'Processing';

-- 3. Archival Boundary Optimization
-- Optimizes background archival jobs that lock runs older than 30 days.
CREATE INDEX IF NOT EXISTS idx_runs_completed_archival
ON public.runs(tenant_id, created_at)
WHERE status IN ('Completed', 'Completed with Exceptions', 'Failed');

-- 4. Bulk Audit Semantics
-- Add an array column to support batch processing without flooding the audit table.
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS batch_entity_ids UUID[] DEFAULT NULL;
