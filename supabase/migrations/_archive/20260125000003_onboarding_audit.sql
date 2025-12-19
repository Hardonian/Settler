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

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_progress') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'current_step') THEN
      ALTER TABLE onboarding_progress ADD COLUMN current_step VARCHAR(50) NOT NULL DEFAULT 'welcome';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'completed_steps') THEN
      ALTER TABLE onboarding_progress ADD COLUMN completed_steps TEXT[] NOT NULL DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'skipped_steps') THEN
      ALTER TABLE onboarding_progress ADD COLUMN skipped_steps TEXT[] NOT NULL DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'progress') THEN
      ALTER TABLE onboarding_progress ADD COLUMN progress INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'metadata') THEN
      ALTER TABLE onboarding_progress ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'completed_at') THEN
      ALTER TABLE onboarding_progress ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- Create indexes conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboarding_progress') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'user_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'onboarding_progress' AND indexname = 'idx_onboarding_progress_user_id') THEN
        EXECUTE 'CREATE INDEX idx_onboarding_progress_user_id ON onboarding_progress(user_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'current_step') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'onboarding_progress' AND indexname = 'idx_onboarding_progress_current_step') THEN
        EXECUTE 'CREATE INDEX idx_onboarding_progress_current_step ON onboarding_progress(current_step)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'progress') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'onboarding_progress' AND indexname = 'idx_onboarding_progress_progress') THEN
        EXECUTE 'CREATE INDEX idx_onboarding_progress_progress ON onboarding_progress(progress)';
      END IF;
    END IF;
  END IF;
END $$;

-- Add RLS policies for onboarding_progress
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own onboarding progress
DROP POLICY IF EXISTS onboarding_progress_user_access ON onboarding_progress;
CREATE POLICY onboarding_progress_user_access ON onboarding_progress
  FOR ALL
  USING (user_id = auth.uid()::uuid);

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

-- Create indexes conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_logs_user_id') THEN
        EXECUTE 'CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'created_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_logs_user_created') THEN
          EXECUTE 'CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC)';
        END IF;
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'billing_account_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_logs_billing_account_id') THEN
        EXECUTE 'CREATE INDEX idx_audit_logs_billing_account_id ON audit_logs(billing_account_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'tenant_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_logs_tenant_id') THEN
        EXECUTE 'CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'resource_type') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_logs_resource_type') THEN
        EXECUTE 'CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'action') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_logs_action') THEN
        EXECUTE 'CREATE INDEX idx_audit_logs_action ON audit_logs(action)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'created_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'audit_logs' AND indexname = 'idx_audit_logs_created_at') THEN
        EXECUTE 'CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC)';
      END IF;
    END IF;
  END IF;
END $$;

-- Add RLS policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs for their own resources
DROP POLICY IF EXISTS audit_logs_user_access ON audit_logs;
-- Only create policy if required tables/columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_accounts')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_accounts' AND column_name = 'user_id') THEN
    EXECUTE '
      CREATE POLICY audit_logs_user_access ON audit_logs
        FOR SELECT
        USING (
          user_id = auth.uid()::uuid OR
          billing_account_id IN (
            SELECT id FROM billing_accounts WHERE user_id = auth.uid()::uuid
          ) OR
          tenant_id IN (
            SELECT id FROM tenants WHERE billing_account_id IN (
              SELECT id FROM billing_accounts WHERE user_id = auth.uid()::uuid
            )
          )
        )';
  END IF;
END $$;

-- Add updated_at trigger for onboarding_progress
DROP FUNCTION IF EXISTS update_onboarding_progress_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_updated_at();

-- Add comments
COMMENT ON TABLE onboarding_progress IS 'Tracks user onboarding progress through guided steps';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all sensitive operations';
