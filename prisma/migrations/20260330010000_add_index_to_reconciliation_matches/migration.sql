-- Migration: Add composite index to support efficient querying of exceptions.
-- This improves performance of the dashboards.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_matches_job_id_created_at
  ON reconciliation_matches (run_id, created_at DESC);
