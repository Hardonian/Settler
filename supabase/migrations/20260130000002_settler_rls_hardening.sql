-- Migration: RLS Hardening for Settler Tables
-- Created: 2026-01-30
-- Description: Ensure all Settler tables have proper RLS policies with tenant isolation

BEGIN;

-- ============================================================================
-- UPDATE RLS POLICIES TO USE TENANT_USERS MEMBERSHIP
-- ============================================================================

-- Drop existing policies that use current_setting (if they exist)
DROP POLICY IF EXISTS recon_jobs_tenant_isolation ON recon_jobs;
DROP POLICY IF EXISTS recon_results_tenant_isolation ON recon_results;
DROP POLICY IF EXISTS recon_audits_tenant_isolation ON recon_audits;
DROP POLICY IF EXISTS drift_events_tenant_isolation ON drift_events;
DROP POLICY IF EXISTS workflow_runs_tenant_isolation ON workflow_runs;

-- Recreate policies using tenant_users membership (more reliable)
CREATE POLICY recon_jobs_tenant_isolation ON recon_jobs
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY recon_results_tenant_isolation ON recon_results
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY recon_audits_tenant_isolation ON recon_audits
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY drift_events_tenant_isolation ON drift_events
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY workflow_runs_tenant_isolation ON workflow_runs
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- ENSURE ALERTS TABLE HAS RLS
-- ============================================================================

-- Enable RLS on alerts if not already enabled
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS alerts_tenant_isolation ON alerts;

-- Create policy for alerts
CREATE POLICY alerts_tenant_isolation ON alerts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

COMMIT;
