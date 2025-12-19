-- Migration: Autonomous Agents Schema
-- Created: 2026-01-27
-- Description: Schema for autonomous company agents that replace human roles

BEGIN;

-- ============================================================================
-- AGENT RUNS TABLE
-- Tracks all agent executions and their outputs
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type VARCHAR(100) NOT NULL, -- 'strategic_governor', 'architecture_sentinel', etc.
  status VARCHAR(50) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Inputs (what the agent read)
  inputs JSONB DEFAULT '{}'::jsonb,
  
  -- Outputs (what the agent produced)
  outputs JSONB DEFAULT '{}'::jsonb,
  
  -- Artifacts (documents, issues, PRs created)
  artifacts JSONB DEFAULT '[]'::jsonb,
  
  -- Errors
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_type ON agent_runs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON agent_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_status ON agent_runs(agent_type, status, started_at DESC);

-- ============================================================================
-- STRATEGIC BACKLOG TABLE
-- Output from Strategic Governor Agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS strategic_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority INTEGER NOT NULL, -- Lower = higher priority
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'feature', 'bug', 'debt', 'growth', 'retention'
  
  -- Rationale from agent
  rationale TEXT NOT NULL,
  
  -- Metrics that drove this priority
  driving_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Business impact estimate
  estimated_impact VARCHAR(50), -- 'high', 'medium', 'low'
  estimated_effort VARCHAR(50), -- 'high', 'medium', 'low'
  
  -- Status
  status VARCHAR(50) DEFAULT 'proposed', -- 'proposed', 'approved', 'in_progress', 'completed', 'rejected'
  
  -- Links
  related_issue_url TEXT,
  related_pr_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategic_backlog_priority ON strategic_backlog(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategic_backlog_status ON strategic_backlog(status);
CREATE INDEX IF NOT EXISTS idx_strategic_backlog_category ON strategic_backlog(category);

-- ============================================================================
-- ARCHITECTURE VIOLATIONS TABLE
-- Output from Architecture Sentinel Agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS architecture_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type VARCHAR(100) NOT NULL, -- 'complexity_creep', 'dependency_risk', 'performance_regression', 'rls_violation'
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- What violated
  file_path TEXT,
  component_name VARCHAR(255),
  metric_name VARCHAR(100),
  
  -- Details
  current_value DECIMAL(15, 6),
  threshold_value DECIMAL(15, 6),
  violation_description TEXT NOT NULL,
  
  -- Suggested fix
  suggested_action TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'false_positive'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_architecture_violations_type ON architecture_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_architecture_violations_severity ON architecture_violations(severity);
CREATE INDEX IF NOT EXISTS idx_architecture_violations_status ON architecture_violations(status);
CREATE INDEX IF NOT EXISTS idx_architecture_violations_open ON architecture_violations(status, severity) WHERE status = 'open';

-- ============================================================================
-- USER INTENT INSIGHTS TABLE
-- Output from User Intent Synthesizer Agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_intent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type VARCHAR(100) NOT NULL, -- 'pain_point', 'feature_demand', 'usage_pattern', 'drop_off_point'
  
  -- What users are trying to do
  user_goal TEXT NOT NULL,
  
  -- What's happening
  observed_behavior TEXT NOT NULL,
  failure_pattern TEXT,
  
  -- Quantification
  affected_user_count INTEGER DEFAULT 0,
  frequency_score DECIMAL(5, 4), -- 0.0 to 1.0
  severity_score DECIMAL(5, 4), -- 0.0 to 1.0
  
  -- Evidence
  evidence JSONB DEFAULT '[]'::jsonb, -- Array of event IDs, error logs, etc.
  
  -- Recommendations
  recommended_action TEXT,
  feature_suggestion TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'investigating', 'addressed', 'dismissed'
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_intent_insights_type ON user_intent_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_user_intent_insights_status ON user_intent_insights(status);
CREATE INDEX IF NOT EXISTS idx_user_intent_insights_frequency ON user_intent_insights(frequency_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_intent_insights_severity ON user_intent_insights(severity_score DESC);

-- ============================================================================
-- PREEMPTIVE SUPPORT ACTIONS TABLE
-- Output from Preemptive Support AI Agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS preemptive_support_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- What triggered this
  trigger_type VARCHAR(100) NOT NULL, -- 'error_frequency', 'ui_hesitation', 'abandonment_risk'
  trigger_description TEXT NOT NULL,
  
  -- Action taken
  action_type VARCHAR(100) NOT NULL, -- 'in_app_explanation', 'email_guidance', 'feature_suggestion'
  action_content TEXT NOT NULL,
  
  -- Where shown
  shown_in VARCHAR(100), -- 'console', 'receipts', 'api_docs'
  shown_at TIMESTAMPTZ,
  
  -- Outcome
  user_interaction BOOLEAN DEFAULT false,
  issue_resolved BOOLEAN DEFAULT false,
  escalated_to_human BOOLEAN DEFAULT false,
  
  -- Confidence
  confidence_score DECIMAL(5, 4), -- 0.0 to 1.0
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preemptive_support_user ON preemptive_support_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_preemptive_support_tenant ON preemptive_support_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_preemptive_support_trigger ON preemptive_support_actions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_preemptive_support_resolved ON preemptive_support_actions(issue_resolved);

-- ============================================================================
-- GROWTH CONTENT TABLE
-- Output from Organic Growth Engine Agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS growth_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(100) NOT NULL, -- 'blog_post', 'case_study', 'changelog', 'benchmark', 'seo_page'
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  
  -- Source data
  source_data JSONB DEFAULT '{}'::jsonb, -- What usage data drove this content
  
  -- SEO
  seo_title VARCHAR(255),
  seo_description TEXT,
  keywords TEXT[],
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,
  
  -- Performance
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_content_type ON growth_content(content_type);
CREATE INDEX IF NOT EXISTS idx_growth_content_status ON growth_content(status);
CREATE INDEX IF NOT EXISTS idx_growth_content_slug ON growth_content(slug);
CREATE INDEX IF NOT EXISTS idx_growth_content_published ON growth_content(published_at DESC) WHERE status = 'published';

-- ============================================================================
-- FINANCIAL INSIGHTS TABLE
-- Output from Autonomous CFO Lite Agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type VARCHAR(100) NOT NULL, -- 'runway_estimate', 'cost_anomaly', 'pricing_pressure', 'revenue_forecast'
  
  -- The insight
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Numbers
  current_value DECIMAL(15, 2),
  projected_value DECIMAL(15, 2),
  threshold_value DECIMAL(15, 2),
  
  -- Timeframe
  timeframe_start DATE,
  timeframe_end DATE,
  
  -- Urgency
  urgency VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Recommendations
  recommended_action TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_insights_type ON financial_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_financial_insights_urgency ON financial_insights(urgency);
CREATE INDEX IF NOT EXISTS idx_financial_insights_status ON financial_insights(status);
CREATE INDEX IF NOT EXISTS idx_financial_insights_active ON financial_insights(status, urgency) WHERE status = 'active';

-- ============================================================================
-- RELEASE SAFETY CHECKS TABLE
-- Output from Release Gatekeeper Agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS release_safety_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id VARCHAR(255), -- Git commit SHA or version
  check_type VARCHAR(100) NOT NULL, -- 'pre_merge', 'post_deploy', 'smoke_test'
  
  -- Check results
  status VARCHAR(50) NOT NULL, -- 'passed', 'failed', 'warning'
  checks JSONB DEFAULT '[]'::jsonb, -- Array of individual check results
  
  -- Blocking?
  blocks_deployment BOOLEAN DEFAULT false,
  
  -- Risk summary
  risk_summary TEXT,
  risk_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
  
  -- Rollback recommendation
  recommend_rollback BOOLEAN DEFAULT false,
  rollback_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_release_safety_release ON release_safety_checks(release_id);
CREATE INDEX IF NOT EXISTS idx_release_safety_status ON release_safety_checks(status);
CREATE INDEX IF NOT EXISTS idx_release_safety_blocks ON release_safety_checks(blocks_deployment) WHERE blocks_deployment = true;

COMMENT ON TABLE agent_runs IS 'Tracks all autonomous agent executions and their outputs';
COMMENT ON TABLE strategic_backlog IS 'Prioritized backlog items generated by Strategic Governor Agent';
COMMENT ON TABLE architecture_violations IS 'Architecture violations detected by Architecture Sentinel Agent';
COMMENT ON TABLE user_intent_insights IS 'User behavior insights generated by User Intent Synthesizer Agent';
COMMENT ON TABLE preemptive_support_actions IS 'Proactive support actions taken by Preemptive Support AI Agent';
COMMENT ON TABLE growth_content IS 'Content generated by Organic Growth Engine Agent';
COMMENT ON TABLE financial_insights IS 'Financial insights generated by Autonomous CFO Lite Agent';
COMMENT ON TABLE release_safety_checks IS 'Release safety checks performed by Release Gatekeeper Agent';

COMMIT;
