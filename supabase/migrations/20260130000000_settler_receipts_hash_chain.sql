-- Migration: Settler Receipts Hash Chain
-- Created: 2026-01-30
-- Description: Add receipts table with hash chain for tamper-evident audit trail

BEGIN;

-- ============================================================================
-- RECEIPTS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id VARCHAR(255),
  canonical_json JSONB NOT NULL,
  hash VARCHAR(64) NOT NULL, -- SHA256 hash (64 hex chars)
  prev_hash VARCHAR(64), -- Previous receipt hash for chain
  evidence_refs JSONB DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  next_steps TEXT,
  created_by UUID NOT NULL, -- References auth.users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_source_id ON receipts(source_id);
CREATE INDEX IF NOT EXISTS idx_receipts_hash ON receipts(hash);
CREATE INDEX IF NOT EXISTS idx_receipts_prev_hash ON receipts(prev_hash);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_created ON receipts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_canonical_json_gin ON receipts USING GIN (canonical_json);
CREATE INDEX IF NOT EXISTS idx_receipts_evidence_refs_gin ON receipts USING GIN (evidence_refs);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see receipts for tenants they belong to
CREATE POLICY receipts_tenant_isolation ON receipts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_receipts_updated_at();

COMMIT;
