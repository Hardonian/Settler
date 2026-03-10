-- Operator runtime event stream for control plane intelligence

CREATE TABLE IF NOT EXISTS operator_runtime_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  run_id UUID,
  records_processed INTEGER,
  duration_ms INTEGER,
  classification_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  manual_review_count INTEGER,
  error_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operator_runtime_events_tenant_time
  ON operator_runtime_events (tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_runtime_events_type_time
  ON operator_runtime_events (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_runtime_events_run
  ON operator_runtime_events (tenant_id, run_id, occurred_at DESC);
