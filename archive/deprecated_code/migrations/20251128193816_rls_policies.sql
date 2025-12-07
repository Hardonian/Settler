-- Migration: rls_policies
-- Created: 2025-11-28 19:38:16 UTC
-- Description: Row Level Security policies for tenant isolation and access control

BEGIN;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_graph_edges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION FOR TENANT CONTEXT
-- ============================================================================

-- Function to get current tenant context from JWT claims or session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Try to get tenant_id from JWT claim (Supabase auth)
  BEGIN
    v_tenant_id := (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  -- Fallback to session variable if JWT claim not available
  IF v_tenant_id IS NULL THEN
    BEGIN
      v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES FOR TENANT ISOLATION
-- ============================================================================

-- Users policies
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
  FOR ALL USING (tenant_id = current_tenant_id());

-- Jobs policies
DROP POLICY IF EXISTS tenant_isolation_jobs ON jobs;
CREATE POLICY tenant_isolation_jobs ON jobs
  FOR ALL USING (tenant_id = current_tenant_id());

-- Executions policies
DROP POLICY IF EXISTS tenant_isolation_executions ON executions;
CREATE POLICY tenant_isolation_executions ON executions
  FOR ALL USING (tenant_id = current_tenant_id());

-- Matches policies
DROP POLICY IF EXISTS tenant_isolation_matches ON matches;
CREATE POLICY tenant_isolation_matches ON matches
  FOR ALL USING (tenant_id = current_tenant_id());

-- Unmatched policies
DROP POLICY IF EXISTS tenant_isolation_unmatched ON unmatched;
CREATE POLICY tenant_isolation_unmatched ON unmatched
  FOR ALL USING (tenant_id = current_tenant_id());

-- Reports policies
DROP POLICY IF EXISTS tenant_isolation_reports ON reports;
CREATE POLICY tenant_isolation_reports ON reports
  FOR ALL USING (tenant_id = current_tenant_id());

-- Webhooks policies
DROP POLICY IF EXISTS tenant_isolation_webhooks ON webhooks;
CREATE POLICY tenant_isolation_webhooks ON webhooks
  FOR ALL USING (tenant_id = current_tenant_id());

-- API Keys policies
DROP POLICY IF EXISTS tenant_isolation_api_keys ON api_keys;
CREATE POLICY tenant_isolation_api_keys ON api_keys
  FOR ALL USING (tenant_id = current_tenant_id());

-- Webhook payloads policies
DROP POLICY IF EXISTS tenant_isolation_webhook_payloads ON webhook_payloads;
CREATE POLICY tenant_isolation_webhook_payloads ON webhook_payloads
  FOR ALL USING (tenant_id = current_tenant_id());

-- Audit logs policies
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL USING (tenant_id = current_tenant_id());

-- Idempotency keys policies
DROP POLICY IF EXISTS tenant_isolation_idempotency_keys ON idempotency_keys;
CREATE POLICY tenant_isolation_idempotency_keys ON idempotency_keys
  FOR ALL USING (tenant_id = current_tenant_id());

-- Tenant usage policies
DROP POLICY IF EXISTS tenant_isolation_tenant_usage ON tenant_usage;
CREATE POLICY tenant_isolation_tenant_usage ON tenant_usage
  FOR ALL USING (tenant_id = current_tenant_id());

-- Tenant quota usage policies
DROP POLICY IF EXISTS tenant_isolation_tenant_quota_usage ON tenant_quota_usage;
CREATE POLICY tenant_isolation_tenant_quota_usage ON tenant_quota_usage
  FOR ALL USING (tenant_id = current_tenant_id());

-- Reconciliation graph nodes policies
DROP POLICY IF EXISTS tenant_isolation_reconciliation_graph_nodes ON reconciliation_graph_nodes;
CREATE POLICY tenant_isolation_reconciliation_graph_nodes ON reconciliation_graph_nodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = reconciliation_graph_nodes.job_id
        AND jobs.tenant_id = current_tenant_id()
    )
  );

-- Reconciliation graph edges policies
DROP POLICY IF EXISTS tenant_isolation_reconciliation_graph_edges ON reconciliation_graph_edges;
CREATE POLICY tenant_isolation_reconciliation_graph_edges ON reconciliation_graph_edges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reconciliation_graph_nodes n
      INNER JOIN jobs j ON j.id = n.job_id
      WHERE n.id = reconciliation_graph_edges.source_node_id
        AND j.tenant_id = current_tenant_id()
    )
  );

-- ============================================================================
-- SERVICE ROLE BYPASS (for internal operations)
-- ============================================================================

-- Note: Service role key bypasses RLS automatically in Supabase
-- These policies ensure tenant isolation for application-level access

COMMIT;
