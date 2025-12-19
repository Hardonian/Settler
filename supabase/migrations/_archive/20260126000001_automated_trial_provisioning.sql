-- Migration: Automated Trial Provisioning
-- Created: 2026-01-26
-- Description: Automatically provision 14-day trial for new signups

BEGIN;

-- Function to automatically provision trial for new users
CREATE OR REPLACE FUNCTION provision_trial_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_days INTEGER := 14;
  trial_start TIMESTAMPTZ := NOW();
  trial_end TIMESTAMPTZ := trial_start + (trial_days || ' days')::INTERVAL;
BEGIN
  -- Only provision trial if user doesn't already have a plan_type set
  -- This allows manual overrides if needed
  IF NEW.plan_type IS NULL OR NEW.plan_type = 'free' THEN
    NEW.plan_type := 'trial';
    NEW.trial_start_date := trial_start;
    NEW.trial_end_date := trial_end;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on profiles table insert (when user signs up)
-- Note: This assumes profiles table is created via Supabase auth trigger
-- If profiles are created differently, adjust trigger accordingly
DROP TRIGGER IF EXISTS trigger_provision_trial_on_signup ON profiles;
CREATE TRIGGER trigger_provision_trial_on_signup
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION provision_trial_for_new_user();

-- Function to handle trial expiration
CREATE OR REPLACE FUNCTION handle_trial_expiration()
RETURNS void AS $$
BEGIN
  -- Update expired trials to free tier
  UPDATE profiles
  SET plan_type = 'free',
      trial_end_date = NULL,
      updated_at = NOW()
  WHERE plan_type = 'trial'
    AND trial_end_date IS NOT NULL
    AND trial_end_date < NOW()
    AND (trial_end_date + INTERVAL '1 day') > NOW(); -- Only process once per day

  -- Log trial expirations
  INSERT INTO activity_log (user_id, activity_type, entity_type, entity_id, metadata)
  SELECT 
    id,
    'trial_expired',
    'profile',
    id,
    jsonb_build_object(
      'trial_start_date', trial_start_date,
      'trial_end_date', trial_end_date,
      'expired_at', NOW()
    )
  FROM profiles
  WHERE plan_type = 'free'
    AND trial_end_date IS NOT NULL
    AND updated_at > NOW() - INTERVAL '1 minute'; -- Only log recent expirations
END;
$$ LANGUAGE plpgsql;

-- Function to check and send trial expiration warnings
CREATE OR REPLACE FUNCTION get_trials_expiring_soon(p_days_ahead INTEGER DEFAULT 3)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  trial_end_date TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.trial_end_date,
    EXTRACT(DAY FROM (p.trial_end_date - NOW()))::INTEGER as days_remaining
  FROM profiles p
  WHERE p.plan_type = 'trial'
    AND p.trial_end_date IS NOT NULL
    AND p.trial_end_date > NOW()
    AND EXTRACT(DAY FROM (p.trial_end_date - NOW()))::INTEGER <= p_days_ahead
    AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION provision_trial_for_new_user() IS 'Automatically provisions 14-day trial for new user signups';
COMMENT ON FUNCTION handle_trial_expiration() IS 'Handles trial expiration by converting to free tier';
COMMENT ON FUNCTION get_trials_expiring_soon(INTEGER) IS 'Returns users with trials expiring within specified days';

COMMIT;
