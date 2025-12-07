-- Migration: trial_subscription_fields
-- Created: 2025-01-01
-- Description: Add trial and subscription fields to profiles table for lifecycle email automation

BEGIN;

-- Add trial and subscription fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'trial', 'commercial', 'enterprise')),
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pre_test_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pre_test_answers JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_email_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"lifecycle_emails": true, "monthly_summary": true, "low_activity": true}'::jsonb;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date) WHERE trial_end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_trial_active ON profiles(trial_end_date) WHERE plan_type = 'trial' AND trial_end_date > NOW();
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end ON profiles(subscription_end_date) WHERE subscription_end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_email ON profiles(last_email_sent_at, last_email_type);

-- Function: Get users who need trial lifecycle emails
CREATE OR REPLACE FUNCTION get_trial_users_for_email(
  p_days_remaining INTEGER
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  email VARCHAR,
  name VARCHAR,
  plan_type VARCHAR,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  days_remaining INTEGER,
  industry VARCHAR,
  company_name VARCHAR,
  last_email_type VARCHAR,
  last_email_sent_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.plan_type,
    p.trial_start_date,
    p.trial_end_date,
    EXTRACT(DAY FROM (p.trial_end_date - NOW()))::INTEGER as days_remaining,
    p.industry,
    p.company_name,
    p.last_email_type,
    p.last_email_sent_at
  FROM profiles p
  WHERE p.plan_type = 'trial'
    AND p.trial_end_date IS NOT NULL
    AND p.trial_end_date > NOW()
    AND EXTRACT(DAY FROM (p.trial_end_date - NOW()))::INTEGER = p_days_remaining
    AND (
      -- Only send if we haven't sent this specific email type today
      p.last_email_type IS NULL 
      OR p.last_email_sent_at < NOW() - INTERVAL '1 day'
      OR p.last_email_type != ('trial_day' || p_days_remaining::text)
    )
    AND (p.email_preferences->>'lifecycle_emails')::boolean IS NOT FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get paid users for monthly summary
CREATE OR REPLACE FUNCTION get_paid_users_for_monthly_summary()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email VARCHAR,
  name VARCHAR,
  plan_type VARCHAR,
  industry VARCHAR,
  company_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.plan_type,
    p.industry,
    p.company_name
  FROM profiles p
  WHERE p.plan_type IN ('commercial', 'enterprise')
    AND (p.email_preferences->>'monthly_summary')::boolean IS NOT FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get inactive users for low activity email
CREATE OR REPLACE FUNCTION get_inactive_users(
  p_days_inactive INTEGER DEFAULT 7
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  email VARCHAR,
  name VARCHAR,
  plan_type VARCHAR,
  industry VARCHAR,
  company_name VARCHAR,
  last_activity_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.plan_type,
    p.industry,
    p.company_name,
    COALESCE(
      (SELECT MAX(al.created_at) FROM activity_log al WHERE al.user_id = p.id),
      p.created_at
    ) as last_activity_at
  FROM profiles p
  WHERE p.plan_type IN ('commercial', 'enterprise')
    AND COALESCE(
      (SELECT MAX(al.created_at) FROM activity_log al WHERE al.user_id = p.id),
      p.created_at
    ) < NOW() - (p_days_inactive || ' days')::INTERVAL
    AND (p.email_preferences->>'low_activity')::boolean IS NOT FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update email sent tracking
CREATE OR REPLACE FUNCTION update_email_sent(
  p_user_id UUID,
  p_email_type VARCHAR
) RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    last_email_sent_at = NOW(),
    last_email_type = p_email_type,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
