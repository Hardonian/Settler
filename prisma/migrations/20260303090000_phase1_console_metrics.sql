-- Phase 1 console metrics warehouse tables (tenant-scoped)

CREATE TABLE IF NOT EXISTS request_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
  rate_limited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_metrics_tenant_created_at ON request_metrics (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_metrics_tenant_route_created_at ON request_metrics (tenant_id, route, created_at DESC);

CREATE TABLE IF NOT EXISTS run_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  fingerprint TEXT,
  replay_ok BOOLEAN,
  evidence_size_bytes BIGINT NOT NULL DEFAULT 0,
  policy_id TEXT NOT NULL,
  policy_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, run_id)
);

CREATE INDEX IF NOT EXISTS idx_run_metrics_tenant_created_at ON run_metrics (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_run_metrics_tenant_run_id ON run_metrics (tenant_id, run_id);

CREATE TABLE IF NOT EXISTS economic_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  compute_units NUMERIC(20,4) NOT NULL DEFAULT 0,
  memory_units NUMERIC(20,4) NOT NULL DEFAULT 0,
  cas_io_units NUMERIC(20,4) NOT NULL DEFAULT 0,
  replay_calls INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_economic_metrics_tenant_created_at ON economic_metrics (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_economic_metrics_tenant_run_id ON economic_metrics (tenant_id, run_id);

CREATE TABLE IF NOT EXISTS policy_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_id TEXT,
  policy_id TEXT NOT NULL,
  policy_hash TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  deny_count INTEGER NOT NULL DEFAULT 0,
  budget_overrun_count INTEGER NOT NULL DEFAULT 0,
  observed_value NUMERIC(20,4),
  limit_value NUMERIC(20,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_metrics_tenant_created_at ON policy_metrics (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_metrics_tenant_policy ON policy_metrics (tenant_id, policy_id, created_at DESC);

CREATE TABLE IF NOT EXISTS drift_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  expected_fingerprint TEXT,
  actual_fingerprint TEXT NOT NULL,
  replay_verification BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drift_metrics_tenant_created_at ON drift_metrics (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drift_metrics_tenant_run_id ON drift_metrics (tenant_id, run_id);
