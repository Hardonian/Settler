-- Distributed webhook replay dedupe ledger
CREATE TABLE IF NOT EXISTS webhook_replay_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key_hash VARCHAR(64) NOT NULL UNIQUE,
  scope_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_replay_keys_expires_at ON webhook_replay_keys(expires_at);
