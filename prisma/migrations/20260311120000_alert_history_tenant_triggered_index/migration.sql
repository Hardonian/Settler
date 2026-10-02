-- Improve tenant-scoped alert history lookup performance for operator and support tooling.
CREATE INDEX IF NOT EXISTS idx_alert_history_tenant_triggered_at
  ON alert_history(tenant_id, triggered_at DESC);
