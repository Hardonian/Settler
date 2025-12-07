-- Migration: onboarding_progress
-- Created: 2026-01-15
-- Description: Add onboarding progress tracking table

BEGIN;

CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step VARCHAR(100) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, step)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_completed ON onboarding_progress(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_updated_at ON onboarding_progress(updated_at DESC);

COMMENT ON TABLE onboarding_progress IS 'Tracks user onboarding progress and completion';
COMMENT ON COLUMN onboarding_progress.step IS 'Onboarding step identifier (welcome, profile, first_job, etc.)';
COMMENT ON COLUMN onboarding_progress.completed IS 'Whether the step has been completed';

COMMIT;
