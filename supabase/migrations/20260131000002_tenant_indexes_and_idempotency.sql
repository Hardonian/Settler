-- Migration: Add Tenant Isolation to IdempotencyKey and Create Composite Indexes
-- Date: 2026-01-31
-- Purpose: 
--   1. Add tenant_id to idempotency_keys table for proper multi-tenant isolation
--   2. Create composite indexes for common query patterns on tenant-scoped tables

-- ============================================================================
-- PART 1: IdempotencyKey Tenant Isolation
-- ============================================================================

-- Add tenant_id column to idempotency_keys (nullable initially for migration safety)
ALTER TABLE idempotency_keys 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Create index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_id 
ON idempotency_keys(tenant_id);

-- Create composite index for idempotency lookups by tenant
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_lookup 
ON idempotency_keys(tenant_id, key) 
WHERE tenant_id IS NOT NULL;

-- Enable RLS if not already enabled
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS idempotency_keys_tenant_isolation ON idempotency_keys;
DROP POLICY IF EXISTS idempotency_keys_insert_own ON idempotency_keys;
DROP POLICY IF EXISTS idempotency_keys_delete_own ON idempotency_keys;

-- Create RLS policy: Users can view idempotency keys for their tenants
CREATE POLICY idempotency_keys_tenant_isolation ON idempotency_keys
  FOR SELECT
  USING (
    tenant_id IS NULL OR -- Global keys (system-level)
    tenant_id IN (SELECT get_user_tenant_ids())
  );

-- Create RLS policy: Users can insert keys for their tenants
CREATE POLICY idempotency_keys_insert_own ON idempotency_keys
  FOR INSERT
  WITH CHECK (
    tenant_id IS NULL OR -- Allow global keys for backwards compatibility
    tenant_id IN (SELECT get_user_tenant_ids())
  );

-- Create RLS policy: Users can delete their own tenant keys
CREATE POLICY idempotency_keys_delete_own ON idempotency_keys
  FOR DELETE
  USING (
    tenant_id IS NOT NULL AND 
    tenant_id IN (SELECT get_user_tenant_ids())
  );

-- ============================================================================
-- PART 2: Composite Indexes for Common Query Patterns
-- ============================================================================

-- ReconJob: tenant + status + created_at (job listing with status filter)
CREATE INDEX IF NOT EXISTS idx_recon_jobs_tenant_status_created 
ON recon_jobs(tenant_id, status, created_at DESC);

-- ReconResult: tenant + status + started (result history queries)
CREATE INDEX IF NOT EXISTS idx_recon_results_tenant_status_started 
ON recon_results(tenant_id, status, started_at DESC);

-- Ingestion: tenant + status + created (ingestion history)
CREATE INDEX IF NOT EXISTS idx_ingestions_tenant_status_created 
ON ingestions(tenant_id, status, created_at DESC);

-- NormalizedTransaction: tenant + status + date (transaction queries)
CREATE INDEX IF NOT EXISTS idx_normalized_transactions_tenant_status_date 
ON normalized_transactions(tenant_id, status, date DESC);

-- DriftEvent: tenant + acknowledged + created (unacknowledged drift queries)
CREATE INDEX IF NOT EXISTS idx_drift_events_tenant_ack_created 
ON drift_events(tenant_id, acknowledged, created_at DESC) 
WHERE acknowledged = false;

-- Export: tenant + status + created (export history)
CREATE INDEX IF NOT EXISTS idx_exports_tenant_status_created 
ON exports(tenant_id, status, created_at DESC);

-- Webhook: tenant + status + created (webhook history)
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_status_created 
ON webhooks(tenant_id, status, created_at DESC);

-- WebhookDelivery: webhook + status + created (delivery history per webhook)
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_status_created 
ON webhook_deliveries(webhook_id, status, created_at DESC);

-- Experiment: tenant + status (active experiments)
CREATE INDEX IF NOT EXISTS idx_experiments_tenant_status 
ON experiments(tenant_id, status) 
WHERE status = 'active';

-- AuditLog: tenant + created (audit history)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
ON audit_logs(tenant_id, created_at DESC);

-- ============================================================================
-- PART 3: Additional Safety Indexes
-- ============================================================================

-- Unique constraint for idempotency keys per tenant
-- Note: Partial index to handle NULL tenant_id (global keys)
CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_unique 
ON idempotency_keys(tenant_id, key) 
WHERE tenant_id IS NOT NULL;

-- Partial index for pending jobs (common query pattern)
CREATE INDEX IF NOT EXISTS idx_recon_jobs_pending 
ON recon_jobs(tenant_id, created_at) 
WHERE status = 'pending';

-- Partial index for failed jobs (for retry logic)
CREATE INDEX IF NOT EXISTS idx_recon_jobs_failed 
ON recon_jobs(tenant_id, retry_count, updated_at) 
WHERE status = 'failed';

-- Partial index for active webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_active 
ON webhooks(tenant_id, created_at) 
WHERE status = 'active';

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%tenant%'
  OR indexname LIKE 'idx_idempotency%'
ORDER BY tablename, indexname;
