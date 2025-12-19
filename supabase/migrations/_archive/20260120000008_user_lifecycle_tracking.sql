-- Migration: user_lifecycle_tracking
-- Created: 2026-01-20
-- Description: User lifecycle tracking, segmentation, churn prediction, and milestone events

BEGIN;

-- User lifecycle stages
CREATE TYPE user_lifecycle_stage AS ENUM (
  'signup',
  'activation',
  'engaged',
  'retention',
  'expansion',
  'at_risk',
  'churned'
);

-- Customer segments
CREATE TYPE customer_segment AS ENUM (
  'free_tier',
  'trial',
  'commercial',
  'enterprise',
  'churned'
);

-- User lifecycle tracking
CREATE TABLE IF NOT EXISTS user_lifecycle (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_stage user_lifecycle_stage NOT NULL DEFAULT 'signup',
  segment customer_segment NOT NULL DEFAULT 'free_tier',
  activated_at TIMESTAMPTZ,
  first_successful_setup_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  churn_risk_score DECIMAL(3,2) DEFAULT 0.0 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 1),
  churn_risk_reasons TEXT[],
  expansion_opportunity_score DECIMAL(3,2) DEFAULT 0.0 CHECK (expansion_opportunity_score >= 0 AND expansion_opportunity_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Milestone events tracking
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_type VARCHAR(100) NOT NULL,
  milestone_data JSONB,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activation checklist
CREATE TABLE IF NOT EXISTS activation_checklist (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checklist_item VARCHAR(100) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, checklist_item)
);

-- Referral program tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, rewarded
  reward_amount DECIMAL(10,2),
  reward_currency VARCHAR(10) DEFAULT 'USD',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Affiliate tracking
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code VARCHAR(100) UNIQUE NOT NULL,
  partner_name VARCHAR(255) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.0, -- percentage
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, paused, terminated
  total_revenue DECIMAL(12,2) DEFAULT 0.0,
  total_payouts DECIMAL(12,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Affiliate conversions
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversion_type VARCHAR(50) NOT NULL, -- signup, upgrade, renewal
  revenue_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer segments (behavioral + billing)
CREATE TABLE IF NOT EXISTS customer_segments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  segment_type VARCHAR(50) NOT NULL, -- behavioral, billing, usage
  segment_name VARCHAR(100) NOT NULL,
  segment_metadata JSONB,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, segment_type, segment_name)
);

-- Payment recovery tracking
CREATE TABLE IF NOT EXISTS payment_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  failure_type VARCHAR(50) NOT NULL, -- declined, insufficient_funds, expired_card
  failure_count INTEGER NOT NULL DEFAULT 1,
  grace_period_ends_at TIMESTAMPTZ,
  recovery_attempts INTEGER NOT NULL DEFAULT 0,
  recovered_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, recovered, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project snapshots for rollback
CREATE TABLE IF NOT EXISTS project_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL, -- references reconciliation_jobs or other project types
  project_type VARCHAR(50) NOT NULL, -- job, integration, workflow
  snapshot_name VARCHAR(255),
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_stage ON user_lifecycle(current_stage);
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_segment ON user_lifecycle(segment);
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_churn_risk ON user_lifecycle(churn_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_type ON user_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_activation_checklist_user_id ON activation_checklist(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate ON affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_user ON affiliate_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_user_id ON customer_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_recovery_user_id ON payment_recovery(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_recovery_status ON payment_recovery(status);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_user_id ON project_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_project ON project_snapshots(project_id, project_type);

-- Functions
CREATE OR REPLACE FUNCTION update_user_lifecycle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_lifecycle_updated_at
  BEFORE UPDATE ON user_lifecycle
  FOR EACH ROW
  EXECUTE FUNCTION update_user_lifecycle_updated_at();

CREATE TRIGGER trigger_payment_recovery_updated_at
  BEFORE UPDATE ON payment_recovery
  FOR EACH ROW
  EXECUTE FUNCTION update_user_lifecycle_updated_at();

-- RLS Policies
ALTER TABLE user_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only see their own lifecycle data
CREATE POLICY user_lifecycle_select ON user_lifecycle
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_milestones_select ON user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY activation_checklist_select ON activation_checklist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY activation_checklist_update ON activation_checklist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY referrals_select ON referrals
  FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY project_snapshots_select ON project_snapshots
  FOR SELECT USING (auth.uid() = user_id);

COMMIT;
