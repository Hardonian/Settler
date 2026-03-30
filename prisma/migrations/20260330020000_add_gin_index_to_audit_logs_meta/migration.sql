-- Migration: Add GIN index to support efficient querying of audit log metadata.
-- This improves performance of the audit trail page.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_meta_gin
  ON audit_logs
  USING GIN (meta);
