-- Migration: Add tenant_governance table for freeze state
-- Created: 2026-03-17
-- Purpose: Enable persistent tenant-level governance controls including system freeze

CREATE TABLE IF NOT EXISTS tenant_governance (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    frozen BOOLEAN NOT NULL DEFAULT FALSE,
    frozen_at TIMESTAMPTZ,
    frozen_by UUID REFERENCES users(id) ON DELETE SET NULL,
    freeze_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient frozen state checks
CREATE INDEX IF NOT EXISTS idx_tenant_governance_frozen ON tenant_governance(tenant_id, frozen) WHERE frozen = TRUE;

-- Add comment for documentation
COMMENT ON TABLE tenant_governance IS 'Tenant-level governance controls including system freeze state for emergency read-only mode';
COMMENT ON COLUMN tenant_governance.frozen IS 'When true, tenant is in read-only mode and all write operations should be blocked';
COMMENT ON COLUMN tenant_governance.frozen_at IS 'Timestamp when system was frozen';
COMMENT ON COLUMN tenant_governance.frozen_by IS 'User who initiated the freeze';
COMMENT ON COLUMN tenant_governance.freeze_reason IS 'Reason provided for freezing the system';
