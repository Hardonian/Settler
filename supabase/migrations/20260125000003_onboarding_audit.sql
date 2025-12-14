-- Migration: Add OnboardingProgress and AuditLog tables
-- Purpose: Enable guided onboarding and comprehensive audit logging
-- Date: 2026-01-25

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_step VARCHAR(50) NOT NULL DEFAULT 'welcome',
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  skipped_steps TEXT[] NOT NULL DEFAULT '{}',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  metadata JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for onboarding_progress
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_current_step ON onboarding_progress(current_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_progress ON onboarding_progress(progress);

-- Add RLS policies for onboarding_progress
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own onboarding progress
CREATE POLICY onboarding_progress_user_access ON onboarding_progress
  FOR ALL
  USING (user_id = auth.uid());

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  billing_account_id UUID,
  tenant_id UUID,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_billing_account_id ON audit_logs(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

-- Add RLS policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs for their own resources
CREATE POLICY audit_logs_user_access ON audit_logs
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    ) OR
    tenant_id IN (
      SELECT id FROM tenants WHERE billing_account_id IN (
        SELECT id FROM billing_accounts WHERE user_id = auth.uid()
      )
    )
  );

-- Add updated_at trigger for onboarding_progress
CREATE OR REPLACE FUNCTION update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_updated_at();

-- Add comments
COMMENT ON TABLE onboarding_progress IS 'Tracks user onboarding progress through guided steps';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all sensitive operations';
