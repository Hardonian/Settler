-- Migration: Add index to support efficient searching of recon jobs by name
-- This improves performance of the runs list page.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recon_jobs_name
  ON recon_jobs (name);
