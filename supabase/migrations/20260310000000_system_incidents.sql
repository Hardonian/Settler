-- Incident records for operator response workflows
CREATE TABLE IF NOT EXISTS system_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  tenant_id UUID,
  run_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  summary TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  linked_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_incidents_created_at ON system_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON system_incidents(status);
CREATE INDEX IF NOT EXISTS idx_system_incidents_tenant ON system_incidents(tenant_id);
