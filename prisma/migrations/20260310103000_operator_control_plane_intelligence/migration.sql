CREATE TABLE IF NOT EXISTS operator_anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  metric TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  triggered_count INTEGER NOT NULL DEFAULT 1,
  first_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_value DOUBLE PRECISION NOT NULL,
  baseline_value DOUBLE PRECISION NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operator_anomaly_alerts_last_triggered
  ON operator_anomaly_alerts (last_triggered_at DESC);

CREATE TABLE IF NOT EXISTS operator_error_issue_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature TEXT NOT NULL UNIQUE,
  github_issue_number INTEGER,
  github_issue_url TEXT,
  github_issue_state TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triaged_at TIMESTAMPTZ,
  cooldown_until TIMESTAMPTZ,
  observation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operator_error_issue_links_last_seen
  ON operator_error_issue_links (last_seen_at DESC);
