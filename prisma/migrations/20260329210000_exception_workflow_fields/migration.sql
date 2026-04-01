-- Migration: Exception workflow fields for enterprise-grade exception handling
-- Adds status workflow, assignment, resolution reasons, and notes to reconciliation_matches
-- This closes the gap where exceptions used implicit boolean (reviewed) instead of proper status machine

-- Add exception status field with proper state machine: open → in_progress → resolved|dismissed
ALTER TABLE reconciliation_matches ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) NOT NULL DEFAULT 'open';

-- Add assignment field for operator ownership of exceptions
ALTER TABLE reconciliation_matches ADD COLUMN IF NOT EXISTS "assigned_to" UUID;

-- Add structured resolution reason (separate from matchReason which is system-level)
ALTER TABLE reconciliation_matches ADD COLUMN IF NOT EXISTS "resolution_reason" VARCHAR(100);

-- Add operator notes field (separate from matchReason which is system-level)
ALTER TABLE reconciliation_matches ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add severity field for exception prioritization
ALTER TABLE reconciliation_matches ADD COLUMN IF NOT EXISTS "severity" VARCHAR(20) NOT NULL DEFAULT 'medium';

-- Backfill existing records: convert reviewed boolean to status
UPDATE reconciliation_matches
SET "status" = CASE
  WHEN reviewed = true THEN 'resolved'
  ELSE 'open'
END
WHERE "status" = 'open' AND reviewed = true;

-- Add indexes for efficient exception queue queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_status_assigned
  ON reconciliation_matches (tenant_id, status, assigned_to)
  WHERE match_type = 'unmatched';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_status_severity
  ON reconciliation_matches (tenant_id, status, severity)
  WHERE match_type = 'unmatched';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_assigned_to
  ON reconciliation_matches (tenant_id, assigned_to)
  WHERE assigned_to IS NOT NULL;

-- Add check constraint for status values
ALTER TABLE reconciliation_matches ADD CONSTRAINT chk_match_status
  CHECK ("status" IN ('open', 'in_progress', 'resolved', 'dismissed'));

-- Add check constraint for severity values
ALTER TABLE reconciliation_matches ADD CONSTRAINT chk_match_severity
  CHECK ("severity" IN ('low', 'medium', 'high', 'critical'));
