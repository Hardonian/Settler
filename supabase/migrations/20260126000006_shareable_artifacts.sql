-- Migration: Shareable Artifacts Table
-- Created: 2026-01-26
-- Description: Store shareable links for reports, dashboards, etc.

BEGIN;

CREATE TABLE IF NOT EXISTS shareable_artifacts (
  id VARCHAR(12) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artifact_type VARCHAR(100) NOT NULL, -- 'reconciliation_report', 'receipt', 'dashboard'
  artifact_id UUID NOT NULL,
  public BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shareable_artifacts_user_id ON shareable_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_shareable_artifacts_expires_at ON shareable_artifacts(expires_at);
CREATE INDEX IF NOT EXISTS idx_shareable_artifacts_public ON shareable_artifacts(public) WHERE public = TRUE;

COMMENT ON TABLE shareable_artifacts IS 'Stores shareable links for reports, dashboards, and other artifacts';

COMMIT;
