CREATE TABLE IF NOT EXISTS reconciliation_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
  match_id UUID NULL REFERENCES reconciliation_matches(id) ON DELETE SET NULL,
  sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_user_id UUID NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  entry_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reconciliation_provenance_run_sequence_unique UNIQUE (run_id, sequence)
);

CREATE INDEX IF NOT EXISTS reconciliation_provenance_tenant_idx ON reconciliation_provenance(tenant_id);
CREATE INDEX IF NOT EXISTS reconciliation_provenance_run_idx ON reconciliation_provenance(run_id);
CREATE INDEX IF NOT EXISTS reconciliation_provenance_match_idx ON reconciliation_provenance(match_id);
CREATE INDEX IF NOT EXISTS reconciliation_provenance_event_type_idx ON reconciliation_provenance(event_type);
CREATE INDEX IF NOT EXISTS reconciliation_provenance_created_at_idx ON reconciliation_provenance(created_at);
