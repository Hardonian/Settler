-- Migration: functions_and_triggers
-- Created: 2025-11-28 19:38:16 UTC
-- Description: Database functions, triggers, and helper utilities

BEGIN;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TENANT_ID PROPAGATION
-- ============================================================================

-- Function to propagate tenant_id from user to jobs
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_jobs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_job_tenant_id ON jobs;
CREATE TRIGGER set_job_tenant_id BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_jobs();

-- Function to propagate tenant_id from job to executions
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_executions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_execution_tenant_id ON executions;
CREATE TRIGGER set_execution_tenant_id BEFORE INSERT OR UPDATE ON executions
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_executions();

-- Function to propagate tenant_id from job to matches
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_matches()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_match_tenant_id ON matches;
CREATE TRIGGER set_match_tenant_id BEFORE INSERT OR UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_matches();

-- Function to propagate tenant_id from job to unmatched
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_unmatched()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_unmatched_tenant_id ON unmatched;
CREATE TRIGGER set_unmatched_tenant_id BEFORE INSERT OR UPDATE ON unmatched
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_unmatched();

-- Function to propagate tenant_id from job to reports
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_reports()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_report_tenant_id ON reports;
CREATE TRIGGER set_report_tenant_id BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_reports();

-- Function to propagate tenant_id from user to webhooks
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_webhooks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_webhook_tenant_id ON webhooks;
CREATE TRIGGER set_webhook_tenant_id BEFORE INSERT OR UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_webhooks();

-- Function to propagate tenant_id from user to api_keys
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_api_keys()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_api_key_tenant_id ON api_keys;
CREATE TRIGGER set_api_key_tenant_id BEFORE INSERT OR UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_api_keys();

-- Function to propagate tenant_id from user to idempotency_keys
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_idempotency_keys()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_idempotency_key_tenant_id ON idempotency_keys;
CREATE TRIGGER set_idempotency_key_tenant_id BEFORE INSERT OR UPDATE ON idempotency_keys
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_idempotency_keys();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS on_tenants_updated ON tenants;
CREATE TRIGGER on_tenants_updated
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_users_updated ON users;
CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_jobs_updated ON jobs;
CREATE TRIGGER on_jobs_updated
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_api_keys_updated ON api_keys;
CREATE TRIGGER on_api_keys_updated
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_webhooks_updated ON webhooks;
CREATE TRIGGER on_webhooks_updated
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_reconciliation_graph_nodes_updated ON reconciliation_graph_nodes;
CREATE TRIGGER on_reconciliation_graph_nodes_updated
  BEFORE UPDATE ON reconciliation_graph_nodes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip VARCHAR(45), p_tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip = p_ip
      AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
      AND unblocked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to cleanup expired revoked tokens
CREATE OR REPLACE FUNCTION cleanup_expired_revoked_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM revoked_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if tenant has exceeded quota
CREATE OR REPLACE FUNCTION check_tenant_quota(
  p_tenant_id UUID,
  p_quota_type TEXT,
  p_requested_value BIGINT DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota_limit BIGINT;
  v_current_usage BIGINT;
  v_quotas JSONB;
BEGIN
  SELECT quotas INTO v_quotas FROM tenants WHERE id = p_tenant_id AND deleted_at IS NULL;
  
  IF v_quotas IS NULL THEN
    RETURN false;
  END IF;
  
  CASE p_quota_type
    WHEN 'rateLimitRpm' THEN
      RETURN true;
    WHEN 'storageBytes' THEN
      v_quota_limit := (v_quotas->>'storageBytes')::BIGINT;
      SELECT COALESCE(current_storage_bytes, 0) INTO v_current_usage
      FROM tenant_quota_usage WHERE tenant_id = p_tenant_id;
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    WHEN 'concurrentJobs' THEN
      v_quota_limit := (v_quotas->>'concurrentJobs')::BIGINT;
      SELECT COALESCE(current_concurrent_jobs, 0) INTO v_current_usage
      FROM tenant_quota_usage WHERE tenant_id = p_tenant_id;
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    WHEN 'monthlyReconciliations' THEN
      v_quota_limit := (v_quotas->>'monthlyReconciliations')::BIGINT;
      SELECT COALESCE(SUM(metric_value), 0) INTO v_current_usage
      FROM tenant_usage
      WHERE tenant_id = p_tenant_id
        AND metric_type = 'reconciliation'
        AND period_start >= date_trunc('month', NOW());
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to increment quota usage
CREATE OR REPLACE FUNCTION increment_tenant_quota_usage(
  p_tenant_id UUID,
  p_quota_type TEXT,
  p_value BIGINT DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tenant_quota_usage (tenant_id, current_storage_bytes, current_concurrent_jobs, updated_at)
  VALUES (p_tenant_id, 0, 0, NOW())
  ON CONFLICT (tenant_id) DO UPDATE SET
    current_storage_bytes = CASE
      WHEN p_quota_type = 'storageBytes' THEN tenant_quota_usage.current_storage_bytes + p_value
      ELSE tenant_quota_usage.current_storage_bytes
    END,
    current_concurrent_jobs = CASE
      WHEN p_quota_type = 'concurrentJobs' THEN tenant_quota_usage.current_concurrent_jobs + p_value
      ELSE tenant_quota_usage.current_concurrent_jobs
    END,
    updated_at = NOW();
    
  IF p_quota_type = 'reconciliation' THEN
    INSERT INTO tenant_usage (tenant_id, metric_type, metric_value, period_start, period_end)
    VALUES (
      p_tenant_id,
      'reconciliation',
      p_value,
      date_trunc('month', NOW()),
      date_trunc('month', NOW()) + INTERVAL '1 month'
    )
    ON CONFLICT (tenant_id, metric_type, period_start) DO UPDATE SET
      metric_value = tenant_usage.metric_value + p_value;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
