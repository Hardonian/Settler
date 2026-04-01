-- Migration: Add index to support efficient sorting of deterministic match results
-- This improves performance of the run detail page.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deterministic_match_results_matched_at
  ON deterministic_match_results (tenant_id, run_result_id, matched_at DESC);
