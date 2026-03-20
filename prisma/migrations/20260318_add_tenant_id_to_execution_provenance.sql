-- Migration: Add tenant_id to execution_provenance table
-- Created: 2026-03-18
-- Purpose: SECURITY FIX - Add tenant isolation to execution_provenance table
-- This table was missing tenant_id which is a security vulnerability

-- ============================================================================
-- STEP 1: Add tenant_id column as nullable (for backfill)
-- ============================================================================

ALTER TABLE execution_provenance 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- ============================================================================
-- STEP 2: Backfill tenant_id from snapshot_id relationship
-- The snapshot_id references run_snapshots which has tenant_id
-- ============================================================================

UPDATE execution_provenance ep
SET tenant_id = rs.tenant_id
FROM run_snapshots rs
WHERE ep.snapshot_id = rs.id
  AND ep.tenant_id IS NULL;

-- ============================================================================
-- STEP 3: Add foreign key constraint to tenants
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'execution_provenance_tenant_id_fkey' 
      AND conrelid = 'execution_provenance'::regclass
  ) THEN
    ALTER TABLE execution_provenance 
    ADD CONSTRAINT execution_provenance_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add index for tenant-based queries (security & performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_execution_provenance_tenant_id 
ON execution_provenance(tenant_id);

-- Create composite index with run_result_id for common query patterns
CREATE INDEX IF NOT EXISTS idx_execution_provenance_tenant_run_result 
ON execution_provenance(tenant_id, run_result_id);

-- ============================================================================
-- STEP 5: Alter column to NOT NULL (now that all rows have values)
-- ============================================================================

ALTER TABLE execution_provenance 
ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON TABLE execution_provenance IS 'Execution provenance data with tenant isolation';
COMMENT ON COLUMN execution_provenance.tenant_id IS 'Tenant identifier for multi-tenant security isolation';
