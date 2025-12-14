-- Migration: Diagnostics Table
-- Created: 2026-01-26
-- Description: Store automated diagnostic results

BEGIN;

CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_type VARCHAR(100) NOT NULL, -- 'automated', 'manual', 'error_triggered'
  results JSONB NOT NULL, -- Array of diagnostic results
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_timestamp ON diagnostics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostics_type ON diagnostics(diagnostic_type);

COMMENT ON TABLE diagnostics IS 'Stores automated diagnostic results for troubleshooting';

COMMIT;
