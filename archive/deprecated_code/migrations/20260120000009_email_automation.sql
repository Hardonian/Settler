-- Migration: email_automation
-- Created: 2026-01-20
-- Description: Email automation sequences, templates, and tracking

BEGIN;

-- Email sequence types
CREATE TYPE email_sequence_type AS ENUM (
  'onboarding',
  'upgrade_prompt',
  'expansion',
  'churn_save',
  'trial_ending',
  'payment_failed',
  'activation_reminder'
);

-- Email sequences
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_type email_sequence_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  delay_hours INTEGER NOT NULL DEFAULT 0, -- Delay after previous email or trigger
  order_index INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email sends tracking
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  email_address VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, bounced, failed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User email preferences
CREATE TABLE IF NOT EXISTS user_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  marketing_emails BOOLEAN NOT NULL DEFAULT TRUE,
  product_updates BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_emails BOOLEAN NOT NULL DEFAULT TRUE,
  upgrade_prompts BOOLEAN NOT NULL DEFAULT TRUE,
  churn_save_emails BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_sequences_type ON email_sequences(sequence_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_sequence ON email_templates(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_user_id ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_sequence ON email_sends(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_created_at ON email_sends(created_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER trigger_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER trigger_email_sends_updated_at
  BEFORE UPDATE ON email_sends
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

-- RLS Policies
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own email sends and preferences
CREATE POLICY email_sends_select ON email_sends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_email_preferences_select ON user_email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_email_preferences_update ON user_email_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert default email sequences
INSERT INTO email_sequences (sequence_type, name, description, trigger_event) VALUES
  ('onboarding', 'Welcome Series', 'Welcome emails for new users', 'user_signup'),
  ('upgrade_prompt', 'Upgrade Prompts', 'Prompts to upgrade from free/trial', 'usage_approaching_limit'),
  ('expansion', 'Expansion Opportunities', 'Emails about enterprise features', 'high_usage_detected'),
  ('churn_save', 'Churn Save', 'Emails to prevent churn', 'churn_risk_detected'),
  ('trial_ending', 'Trial Ending', 'Reminders about trial ending', 'trial_ending_soon'),
  ('payment_failed', 'Payment Recovery', 'Payment failure recovery emails', 'payment_failed'),
  ('activation_reminder', 'Activation Reminder', 'Reminders to complete activation', 'inactive_after_signup')
ON CONFLICT DO NOTHING;

COMMIT;
