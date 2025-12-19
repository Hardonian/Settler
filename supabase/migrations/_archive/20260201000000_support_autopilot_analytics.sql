-- Migration: Support Autopilot + Admin Analytics Studio
-- Created: 2026-02-01
-- Description: Support Autopilot with triage engine, cost intelligence, and analytics pivot system

BEGIN;

-- ============================================================================
-- PART A: SUPPORT AUTOPILOT ENHANCEMENTS
-- ============================================================================

-- Support Ticket Triage Results Table
CREATE TABLE IF NOT EXISTS support_ticket_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES ops_support_tickets(id) ON DELETE CASCADE,
  triage_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0-100 priority score
  suggested_priority VARCHAR(50) NOT NULL CHECK (suggested_priority IN ('low', 'medium', 'high', 'critical')),
  suggested_category VARCHAR(255),
  suggested_assignee UUID REFERENCES users(id),
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  triage_rules_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  correlation_ids UUID[], -- Related ops_events, ops_errors, etc.
  triaged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triaged_by UUID REFERENCES users(id), -- NULL if auto-triaged
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_triage_ticket ON support_ticket_triage(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_triage_score ON support_ticket_triage(triage_score DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_triage_priority ON support_ticket_triage(suggested_priority);

-- Support Correlations Table (links tickets to ops events)
CREATE TABLE IF NOT EXISTS support_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES ops_support_tickets(id) ON DELETE CASCADE,
  correlation_type VARCHAR(50) NOT NULL CHECK (correlation_type IN ('ops_error', 'ops_job', 'ops_webhook', 'ops_event', 'user_action')),
  correlated_id UUID NOT NULL, -- ID of the correlated entity
  correlation_strength DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (correlation_strength >= 0 AND correlation_strength <= 1),
  correlation_reason TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_correlations_ticket ON support_correlations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_correlations_type ON support_correlations(correlation_type, correlated_id);

-- ============================================================================
-- PART B: OPS EVENTS TABLE (for telemetry ingestion)
-- ============================================================================

-- Ops Events Table (unified event log for all operational events)
CREATE TABLE IF NOT EXISTS ops_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL, -- 'api_request', 'job_execution', 'webhook_delivery', 'error', etc.
  event_category VARCHAR(100) NOT NULL, -- 'infrastructure', 'application', 'user_action', 'system'
  route VARCHAR(500), -- API route or endpoint
  method VARCHAR(10), -- HTTP method if applicable
  user_id UUID,
  organization_id UUID,
  request_id VARCHAR(255),
  status_code INTEGER,
  duration_ms INTEGER,
  payload_size_bytes INTEGER,
  response_size_bytes INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_events_created_at ON ops_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_events_type ON ops_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ops_events_category ON ops_events(event_category);
CREATE INDEX IF NOT EXISTS idx_ops_events_org ON ops_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ops_events_user ON ops_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ops_events_route ON ops_events(route);

-- ============================================================================
-- PART C: COST & USAGE INTELLIGENCE TABLES
-- ============================================================================

-- Cost Inputs Table (derived cost signals)
CREATE TABLE IF NOT EXISTS ops_cost_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source VARCHAR(100) NOT NULL CHECK (source IN ('vercel', 'supabase', 'email', 'webhook', 'storage', 'compute', 'other')),
  unit_count INTEGER NOT NULL DEFAULT 0,
  unit_cost_est DECIMAL(10,6) NOT NULL DEFAULT 0, -- Cost per unit
  total_cost_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  derivation_method VARCHAR(255) NOT NULL, -- 'request_count', 'query_count', 'storage_bytes', etc.
  derivation_metadata JSONB DEFAULT '{}'::jsonb, -- Raw inputs used
  organization_id UUID, -- NULL for platform-wide costs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_cost_inputs_date ON ops_cost_inputs(date DESC);
CREATE INDEX IF NOT EXISTS idx_ops_cost_inputs_source ON ops_cost_inputs(source);
CREATE INDEX IF NOT EXISTS idx_ops_cost_inputs_org ON ops_cost_inputs(organization_id);

-- Daily Cost Rollups
CREATE TABLE IF NOT EXISTS ops_cost_daily_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_cost_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  infra_cost_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  data_cost_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  messaging_cost_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  storage_cost_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  compute_cost_est DECIMAL(12,2) NOT NULL DEFAULT 0,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  derivation_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_cost_daily_rollups_date ON ops_cost_daily_rollups(date DESC);

-- Daily Usage Rollups
CREATE TABLE IF NOT EXISTS ops_usage_daily_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  active_orgs INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  total_events INTEGER NOT NULL DEFAULT 0,
  total_webhooks INTEGER NOT NULL DEFAULT 0,
  total_errors INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_usage_daily_rollups_date ON ops_usage_daily_rollups(date DESC);

-- Revenue Inputs Table (for manual revenue entry if Stripe unavailable)
CREATE TABLE IF NOT EXISTS ops_revenue_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  organization_id UUID,
  amount DECIMAL(12,2) NOT NULL,
  source VARCHAR(100) NOT NULL, -- 'stripe', 'manual', 'estimate'
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ops_revenue_inputs_date ON ops_revenue_inputs(date DESC);
CREATE INDEX IF NOT EXISTS idx_ops_revenue_inputs_org ON ops_revenue_inputs(organization_id);

-- ============================================================================
-- PART D: ANALYTICS DATASETS & SAVED VIEWS
-- ============================================================================

-- Saved Analytics Views
CREATE TABLE IF NOT EXISTS ops_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dataset VARCHAR(100) NOT NULL,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of dimension names
  columns JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of dimension names
  measure VARCHAR(255) NOT NULL,
  aggregation VARCHAR(50) NOT NULL DEFAULT 'sum' CHECK (aggregation IN ('sum', 'count', 'avg', 'min', 'max', 'p95')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_range JSONB, -- {start: date, end: date}
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN NOT NULL DEFAULT FALSE, -- Public views visible to all admins
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_saved_views_created_by ON ops_saved_views(created_by);
CREATE INDEX IF NOT EXISTS idx_ops_saved_views_dataset ON ops_saved_views(dataset);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE support_ticket_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_cost_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_cost_daily_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_usage_daily_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_revenue_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_saved_views ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM billing_accounts ba
    WHERE ba.user_id = user_id
    AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Support Ticket Triage: Admin only
CREATE POLICY support_ticket_triage_admin_only ON support_ticket_triage
  FOR ALL
  USING (is_admin(auth.uid()));

-- Support Correlations: Admin only
CREATE POLICY support_correlations_admin_only ON support_correlations
  FOR ALL
  USING (is_admin(auth.uid()));

-- Ops Events: Admin only (read), system can insert
CREATE POLICY ops_events_admin_read ON ops_events
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY ops_events_insert ON ops_events
  FOR INSERT
  WITH CHECK (true); -- System can insert events

-- Cost Inputs: Admin only
CREATE POLICY ops_cost_inputs_admin_only ON ops_cost_inputs
  FOR ALL
  USING (is_admin(auth.uid()));

-- Cost Daily Rollups: Admin only
CREATE POLICY ops_cost_daily_rollups_admin_only ON ops_cost_daily_rollups
  FOR ALL
  USING (is_admin(auth.uid()));

-- Usage Daily Rollups: Admin only
CREATE POLICY ops_usage_daily_rollups_admin_only ON ops_usage_daily_rollups
  FOR ALL
  USING (is_admin(auth.uid()));

-- Revenue Inputs: Admin only, or users can see their org's revenue
CREATE POLICY ops_revenue_inputs_admin_only ON ops_revenue_inputs
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR (
      organization_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id
        AND EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = o.id
          AND om.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY ops_revenue_inputs_admin_insert ON ops_revenue_inputs
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Saved Views: Admin only, or creator can manage their own
CREATE POLICY ops_saved_views_select ON ops_saved_views
  FOR SELECT
  USING (
    is_admin(auth.uid())
    OR (is_public = true AND is_admin(auth.uid()))
    OR created_by = auth.uid()
  );

CREATE POLICY ops_saved_views_insert ON ops_saved_views
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY ops_saved_views_update ON ops_saved_views
  FOR UPDATE
  USING (
    is_admin(auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY ops_saved_views_delete ON ops_saved_views
  FOR DELETE
  USING (
    is_admin(auth.uid())
    OR created_by = auth.uid()
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER support_ticket_triage_updated_at
  BEFORE UPDATE ON support_ticket_triage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ops_cost_daily_rollups_updated_at
  BEFORE UPDATE ON ops_cost_daily_rollups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ops_usage_daily_rollups_updated_at
  BEFORE UPDATE ON ops_usage_daily_rollups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ops_saved_views_updated_at
  BEFORE UPDATE ON ops_saved_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function to get active orgs count for a date
CREATE OR REPLACE FUNCTION get_active_orgs_count(target_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT organization_id)
    FROM ops_events
    WHERE DATE(created_at) = target_date
    AND organization_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get active users count for a date
CREATE OR REPLACE FUNCTION get_active_users_count(target_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM ops_events
    WHERE DATE(created_at) = target_date
    AND user_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

COMMIT;
