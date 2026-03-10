-- DB fallback for distributed rate limiting counters
CREATE TABLE IF NOT EXISTS rate_limit_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key TEXT NOT NULL,
  bucket_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(scope_key, bucket_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_expires_at ON rate_limit_counters(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_scope_bucket ON rate_limit_counters(scope_key, bucket_start DESC);
