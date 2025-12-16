-- Migration: AI Analysis Tokens
-- Created: 2026-01-30
-- Description: Table for tracking AI analysis token usage

BEGIN;

-- ============================================================================
-- AI ANALYSIS USAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_analysis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_tenant_id ON ai_analysis_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_period_start ON ai_analysis_usage(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_tenant_period ON ai_analysis_usage(tenant_id, period_start DESC);

-- ============================================================================
-- AI ANALYSIS RESULTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,
  input_data JSONB,
  result JSONB NOT NULL,
  tokens_used INTEGER NOT NULL,
  confidence DECIMAL(3, 2),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_analyses_tenant_id ON ai_analyses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_tenant_created ON ai_analyses(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_result_gin ON ai_analyses USING GIN (result);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ai_analysis_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY ai_analysis_usage_tenant_isolation ON ai_analysis_usage
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY ai_analyses_tenant_isolation ON ai_analyses
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_ai_analysis_usage_updated_at
  BEFORE UPDATE ON ai_analysis_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
