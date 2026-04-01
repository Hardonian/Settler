-- Migration: Add GIN indexes for full-text search on exception notes and match reasons
-- This improves performance of the search functionality in the exception queue.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_notes_gin
  ON reconciliation_matches
  USING GIN (notes gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_match_reason_gin
  ON reconciliation_matches
  USING GIN (match_reason gin_trgm_ops);
