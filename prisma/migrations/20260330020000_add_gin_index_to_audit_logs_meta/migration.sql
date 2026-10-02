-- Migration: Add GIN index to support efficient querying of audit log metadata.
-- This improves performance of the audit trail page.
--
-- Corrected 2026-10-02: originally targeted a nonexistent `meta` column; the
-- declared schema (prisma/schema.prisma AuditLog.metadata) and the live table
-- both use `metadata` (jsonb). The migration had never applied anywhere
-- (it failed on the only environment), so correcting it in place is safe.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_metadata_gin
  ON audit_logs
  USING GIN (metadata);
