-- Migration: ops_intelligence
-- Created: 2026-01-30 00:00:00 UTC
-- Description: Ops Intelligence & Founder Briefings - Insights Engine, Action Recommendations, Weekly Briefings

BEGIN;

-- ============================================================================
-- OPS INSIGHTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ops_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('cost', 'support', 'usage', 'stability')),
  title VARCHAR(500) NOT NULL,
  summary TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'critical')),
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  time_window JSONB NOT NULL DEFAULT '{}'::jsonb, -- {start: ISO date, end: ISO date}
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb, -- {metrics: {}, pivots: {}, deltas: {}}
  related_entities JSONB DEFAULT '[]'::jsonb, -- [org_ids, routes, features]
  analytics_pivot_id UUID, -- Link to saved Analytics Studio pivot
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'mitigated', 'expired', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ops_insights_type ON ops_insights(type);
CREATE INDEX IF NOT EXISTS idx_ops_insights_severity ON ops_insights(severity);
CREATE INDEX IF NOT EXISTS idx_ops_insights_status ON ops_insights(status);
CREATE INDEX IF NOT EXISTS idx_ops_insights_created_at ON ops_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_insights_expires_at ON ops_insights(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ops_insights_active ON ops_insights(status, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ops_insights_confidence ON ops_insights(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_ops_insights_evidence_gin ON ops_insights USING GIN (evidence);
CREATE INDEX IF NOT EXISTS idx_ops_insights_related_entities_gin ON ops_insights USING GIN (related_entities);

-- ============================================================================
-- OPS RECOMMENDATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ops_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL REFERENCES ops_insights(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL, -- 'investigate', 'upgrade', 'throttle', 'outreach', 'document', 'fix', 'monitor'
  description TEXT NOT NULL,
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'med', 'high')),
  expected_impact TEXT,
  reversibility BOOLEAN NOT NULL DEFAULT true,
  runbook_link TEXT,
  status VARCHAR(50) DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'rejected', 'executed', 'cancelled')),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ops_recommendations_insight_id ON ops_recommendations(insight_id);
CREATE INDEX IF NOT EXISTS idx_ops_recommendations_status ON ops_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ops_recommendations_action_type ON ops_recommendations(action_type);
CREATE INDEX IF NOT EXISTS idx_ops_recommendations_risk_level ON ops_recommendations(risk_level);
CREATE INDEX IF NOT EXISTS idx_ops_recommendations_suggested ON ops_recommendations(status, created_at DESC) WHERE status = 'suggested';

-- ============================================================================
-- OPS ACTIONS TABLE (Action Ledger)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ops_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES ops_recommendations(id) ON DELETE SET NULL,
  insight_id UUID REFERENCES ops_insights(id) ON DELETE SET NULL,
  action_taken TEXT NOT NULL,
  actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('system', 'admin')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  outcome_notes TEXT,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'partial')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ops_actions_recommendation_id ON ops_actions(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ops_actions_insight_id ON ops_actions(insight_id);
CREATE INDEX IF NOT EXISTS idx_ops_actions_actor_type ON ops_actions(actor_type);
CREATE INDEX IF NOT EXISTS idx_ops_actions_executed_at ON ops_actions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_actions_verification_status ON ops_actions(verification_status);

-- ============================================================================
-- OPS BRIEFINGS TABLE (Weekly Founder Briefings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ops_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  summary_markdown TEXT NOT NULL,
  summary_json JSONB, -- Structured summary for programmatic access
  insights_count INTEGER DEFAULT 0,
  recommendations_count INTEGER DEFAULT 0,
  actions_count INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = system
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ops_briefings_period_start ON ops_briefings(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_ops_briefings_period_end ON ops_briefings(period_end DESC);
CREATE INDEX IF NOT EXISTS idx_ops_briefings_generated_at ON ops_briefings(generated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ops_briefings_period_unique ON ops_briefings(period_start, period_end);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ops_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_briefings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (reuse existing pattern)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM billing_accounts ba
    WHERE ba.user_id = user_id
    AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ops Insights: Admin only
CREATE POLICY ops_insights_admin_only ON ops_insights
  FOR ALL
  USING (
    is_admin_user(auth.uid())
  );

-- Ops Recommendations: Admin only
CREATE POLICY ops_recommendations_admin_only ON ops_recommendations
  FOR ALL
  USING (
    is_admin_user(auth.uid())
  );

-- Ops Actions: Admin only
CREATE POLICY ops_actions_admin_only ON ops_actions
  FOR ALL
  USING (
    is_admin_user(auth.uid())
  );

-- Ops Briefings: Admin only
CREATE POLICY ops_briefings_admin_only ON ops_briefings
  FOR ALL
  USING (
    is_admin_user(auth.uid())
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER ops_insights_updated_at
  BEFORE UPDATE ON ops_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ops_recommendations_updated_at
  BEFORE UPDATE ON ops_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-expire insights after expires_at
CREATE OR REPLACE FUNCTION expire_insights()
RETURNS void AS $$
BEGIN
  UPDATE ops_insights
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to mark insight as resolved
CREATE OR REPLACE FUNCTION resolve_insight(
  p_insight_id UUID,
  p_resolved_by UUID,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE ops_insights
  SET 
    status = 'resolved',
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    resolution_notes = p_resolution_notes,
    updated_at = NOW()
  WHERE id = p_insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept recommendation
CREATE OR REPLACE FUNCTION accept_recommendation(
  p_recommendation_id UUID,
  p_accepted_by UUID
)
RETURNS void AS $$
BEGIN
  UPDATE ops_recommendations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = p_accepted_by,
    updated_at = NOW()
  WHERE id = p_recommendation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute recommendation
CREATE OR REPLACE FUNCTION execute_recommendation(
  p_recommendation_id UUID,
  p_executed_by UUID,
  p_action_taken TEXT,
  p_outcome_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
  v_insight_id UUID;
BEGIN
  -- Get insight_id from recommendation
  SELECT insight_id INTO v_insight_id
  FROM ops_recommendations
  WHERE id = p_recommendation_id;

  -- Create action record
  INSERT INTO ops_actions (
    recommendation_id,
    insight_id,
    action_taken,
    actor_type,
    actor_id,
    outcome_notes
  ) VALUES (
    p_recommendation_id,
    v_insight_id,
    p_action_taken,
    'admin',
    p_executed_by,
    p_outcome_notes
  ) RETURNING id INTO v_action_id;

  -- Update recommendation status
  UPDATE ops_recommendations
  SET 
    status = 'executed',
    executed_at = NOW(),
    executed_by = p_executed_by,
    updated_at = NOW()
  WHERE id = p_recommendation_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
