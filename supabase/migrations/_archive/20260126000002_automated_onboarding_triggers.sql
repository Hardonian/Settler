-- Migration: Automated Onboarding Triggers
-- Created: 2026-01-26
-- Description: Automatically track onboarding progress based on user actions

BEGIN;

-- Function to track onboarding step completion
CREATE OR REPLACE FUNCTION track_onboarding_step_auto()
RETURNS TRIGGER AS $$
DECLARE
  step_name TEXT;
BEGIN
  -- Determine onboarding step based on table and action
  IF TG_TABLE_NAME = 'api_keys' AND TG_OP = 'INSERT' THEN
    step_name := 'first_api_key';
  ELSIF TG_TABLE_NAME = 'reconciliation_jobs' AND TG_OP = 'INSERT' THEN
    step_name := 'first_job';
  ELSIF TG_TABLE_NAME = 'reconciliation_jobs' AND TG_OP = 'UPDATE' AND NEW.status = 'completed' THEN
    step_name := 'first_reconciliation';
  ELSIF TG_TABLE_NAME = 'receipts' AND TG_OP = 'INSERT' THEN
    step_name := 'first_receipt';
  ELSE
    RETURN NEW; -- Unknown table/action, skip
  END IF;

  -- Track the step
  INSERT INTO onboarding_progress (user_id, step, completed, updated_at)
  VALUES (
    COALESCE(NEW.user_id, (NEW.metadata->>'user_id')::UUID),
    step_name,
    TRUE,
    NOW()
  )
  ON CONFLICT (user_id, step) DO UPDATE
  SET completed = TRUE, updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if onboarding tracking fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on api_keys table
DROP TRIGGER IF EXISTS trigger_track_api_key_creation ON api_keys;
CREATE TRIGGER trigger_track_api_key_creation
  AFTER INSERT ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION track_onboarding_step_auto();

-- Trigger on reconciliation_jobs table (if exists)
-- Note: Adjust table name if different
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reconciliation_jobs') THEN
    DROP TRIGGER IF EXISTS trigger_track_first_job ON reconciliation_jobs;
    EXECUTE 'CREATE TRIGGER trigger_track_first_job
      AFTER INSERT ON reconciliation_jobs
      FOR EACH ROW
      EXECUTE FUNCTION track_onboarding_step_auto()';

    DROP TRIGGER IF EXISTS trigger_track_first_reconciliation ON reconciliation_jobs;
    EXECUTE 'CREATE TRIGGER trigger_track_first_reconciliation
      AFTER UPDATE ON reconciliation_jobs
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = ''completed'')
      EXECUTE FUNCTION track_onboarding_step_auto()';
  END IF;
END $$;

-- Trigger on receipts table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN
    DROP TRIGGER IF EXISTS trigger_track_first_receipt ON receipts;
    EXECUTE 'CREATE TRIGGER trigger_track_first_receipt
      AFTER INSERT ON receipts
      FOR EACH ROW
      EXECUTE FUNCTION track_onboarding_step_auto()';
  END IF;
END $$;

-- Function to automatically mark welcome step on signup
CREATE OR REPLACE FUNCTION mark_welcome_step_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO onboarding_progress (user_id, step, completed, updated_at)
  VALUES (NEW.id, 'welcome', TRUE, NOW())
  ON CONFLICT (user_id, step) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to mark welcome step when profile is created
DROP TRIGGER IF EXISTS trigger_mark_welcome_step ON profiles;
CREATE TRIGGER trigger_mark_welcome_step
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION mark_welcome_step_on_signup();

COMMENT ON FUNCTION track_onboarding_step_auto() IS 'Automatically tracks onboarding progress based on user actions';
COMMENT ON FUNCTION mark_welcome_step_on_signup() IS 'Marks welcome step as complete when user signs up';

COMMIT;
