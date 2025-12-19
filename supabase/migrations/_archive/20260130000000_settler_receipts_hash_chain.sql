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

-- Conditionally add missing columns if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'source_id') THEN
      ALTER TABLE receipts ADD COLUMN source_id VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'canonical_json') THEN
      ALTER TABLE receipts ADD COLUMN canonical_json JSONB;
      UPDATE receipts SET canonical_json = '{}'::jsonb WHERE canonical_json IS NULL;
      ALTER TABLE receipts ALTER COLUMN canonical_json SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'hash') THEN
      ALTER TABLE receipts ADD COLUMN hash VARCHAR(64);
      UPDATE receipts SET hash = '' WHERE hash IS NULL;
      ALTER TABLE receipts ALTER COLUMN hash SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'prev_hash') THEN
      ALTER TABLE receipts ADD COLUMN prev_hash VARCHAR(64);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'evidence_refs') THEN
      ALTER TABLE receipts ADD COLUMN evidence_refs JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'summary') THEN
      ALTER TABLE receipts ADD COLUMN summary TEXT;
      UPDATE receipts SET summary = '' WHERE summary IS NULL;
      ALTER TABLE receipts ALTER COLUMN summary SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'why_it_matters') THEN
      ALTER TABLE receipts ADD COLUMN why_it_matters TEXT;
      UPDATE receipts SET why_it_matters = '' WHERE why_it_matters IS NULL;
      ALTER TABLE receipts ALTER COLUMN why_it_matters SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'next_steps') THEN
      ALTER TABLE receipts ADD COLUMN next_steps TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'created_by') THEN
      ALTER TABLE receipts ADD COLUMN created_by UUID;
      UPDATE receipts SET created_by = gen_random_uuid() WHERE created_by IS NULL;
      ALTER TABLE receipts ALTER COLUMN created_by SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'tenant_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_tenant_id') THEN
        EXECUTE 'CREATE INDEX idx_receipts_tenant_id ON receipts(tenant_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'source_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_source_id') THEN
        EXECUTE 'CREATE INDEX idx_receipts_source_id ON receipts(source_id)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'hash') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_hash') THEN
        EXECUTE 'CREATE INDEX idx_receipts_hash ON receipts(hash)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'prev_hash') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_prev_hash') THEN
        EXECUTE 'CREATE INDEX idx_receipts_prev_hash ON receipts(prev_hash)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'created_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_created_at') THEN
        EXECUTE 'CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC)';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'tenant_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_tenant_created') THEN
          EXECUTE 'CREATE INDEX idx_receipts_tenant_created ON receipts(tenant_id, created_at DESC)';
        END IF;
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'canonical_json') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_canonical_json_gin') THEN
        EXECUTE 'CREATE INDEX idx_receipts_canonical_json_gin ON receipts USING GIN (canonical_json)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'evidence_refs') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'receipts' AND indexname = 'idx_receipts_evidence_refs_gin') THEN
        EXECUTE 'CREATE INDEX idx_receipts_evidence_refs_gin ON receipts USING GIN (evidence_refs)';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see receipts for tenants they belong to
DROP POLICY IF EXISTS receipts_tenant_isolation ON receipts;
CREATE POLICY receipts_tenant_isolation ON receipts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()::uuid
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at trigger
DROP FUNCTION IF EXISTS update_receipts_updated_at() CASCADE;
DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
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
