-- Migration: initial_schema
-- Created: 2025-11-28 19:37:35 UTC
-- Description: Initial database schema for Settler API - Core tables, indexes, and extensions

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TENANTS TABLE (Multi-tenancy foundation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  quotas JSONB NOT NULL DEFAULT '{
    "rateLimitRpm": 1000,
    "storageBytes": 1073741824,
    "concurrentJobs": 5,
    "monthlyReconciliations": 1000,
    "customDomains": 0
  }'::jsonb,
  config JSONB NOT NULL DEFAULT '{
    "customDomainVerified": false,
    "dataResidencyRegion": "us",
    "enableAdvancedMatching": false,
    "enableMLFeatures": false,
    "webhookTimeout": 30000,
    "maxRetries": 3
  }'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_parent ON tenants(parent_tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_tier ON tenants(tier);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted ON tenants(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants USING GIN ((config->'customDomain'));

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'developer',
  data_residency_region VARCHAR(10) DEFAULT 'us',
  data_retention_days INTEGER DEFAULT 365,
  deleted_at TIMESTAMPTZ,
  deletion_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(tenant_id, LOWER(email));

-- ============================================================================
-- 3. API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  key_prefix VARCHAR(20) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  scopes TEXT[] DEFAULT ARRAY['jobs:read', 'jobs:write', 'reports:read'],
  rate_limit INTEGER DEFAULT 1000,
  ip_whitelist TEXT[],
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active_tenant ON api_keys(tenant_id, created_at DESC) WHERE revoked_at IS NULL;

-- ============================================================================
-- 4. JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  source_adapter VARCHAR(100) NOT NULL,
  source_config_encrypted TEXT NOT NULL,
  target_adapter VARCHAR(100) NOT NULL,
  target_config_encrypted TEXT NOT NULL,
  rules JSONB NOT NULL,
  schedule VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status ON jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_created_at ON jobs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status_created ON jobs(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_active_tenant_created ON jobs(tenant_id, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_rules_gin ON jobs USING GIN (rules);
CREATE INDEX IF NOT EXISTS idx_jobs_list_covering ON jobs(tenant_id, created_at DESC) INCLUDE (id, name, status, source_adapter, target_adapter);
CREATE INDEX IF NOT EXISTS idx_jobs_cursor_pagination ON jobs(tenant_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_name_lower ON jobs(tenant_id, LOWER(name));

-- ============================================================================
-- 5. EXECUTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  summary JSONB,
  duration_ms BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_job_id ON executions(job_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_tenant_id ON executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_executions_tenant_status_started ON executions(tenant_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_job_status_started ON executions(job_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_running_tenant_started ON executions(tenant_id, started_at DESC) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_executions_failed_tenant_started ON executions(tenant_id, started_at DESC) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_executions_summary_gin ON executions USING GIN (summary);
CREATE INDEX IF NOT EXISTS idx_executions_list_covering ON executions(tenant_id, started_at DESC) INCLUDE (id, job_id, status, completed_at);
CREATE INDEX IF NOT EXISTS idx_executions_cursor_pagination ON executions(tenant_id, started_at DESC, id DESC);

-- ============================================================================
-- 6. MATCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  source_id VARCHAR(255) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR(10),
  confidence DECIMAL(3, 2),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_job_id ON matches(job_id);
CREATE INDEX IF NOT EXISTS idx_matches_execution_id ON matches(execution_id);
CREATE INDEX IF NOT EXISTS idx_matches_source_id ON matches(source_id);
CREATE INDEX IF NOT EXISTS idx_matches_target_id ON matches(target_id);
CREATE INDEX IF NOT EXISTS idx_matches_job_status ON matches(job_id, confidence);
CREATE INDEX IF NOT EXISTS idx_matches_tenant_id ON matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matches_tenant_execution ON matches(tenant_id, execution_id, matched_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_tenant_job_confidence ON matches(tenant_id, job_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_matches_cursor_pagination ON matches(tenant_id, matched_at DESC, id DESC);

-- ============================================================================
-- 7. UNMATCHED TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS unmatched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  source_id VARCHAR(255),
  target_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(10),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unmatched_job_id ON unmatched(job_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_execution_id ON unmatched(execution_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_tenant_id ON unmatched(tenant_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_tenant_execution ON unmatched(tenant_id, execution_id, created_at DESC);

-- ============================================================================
-- 8. REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  summary JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_job_id ON reports(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_execution_id ON reports(execution_id);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_execution ON reports(tenant_id, execution_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_date_range ON reports(tenant_id, date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_reports_summary_gin ON reports USING GIN (summary);

-- ============================================================================
-- 9. WEBHOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active_tenant ON webhooks(tenant_id, created_at DESC) WHERE status = 'active';

-- ============================================================================
-- 10. WEBHOOK PAYLOADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_payloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter VARCHAR(100) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  signature VARCHAR(255),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_payloads_adapter ON webhook_payloads(adapter);
CREATE INDEX IF NOT EXISTS idx_webhook_payloads_processed ON webhook_payloads(processed, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_payloads_tenant_id ON webhook_payloads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_payloads_payload_gin ON webhook_payloads USING GIN (payload);

-- ============================================================================
-- 11. WEBHOOK DELIVERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50),
  status_code INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending_retry ON webhook_deliveries(webhook_id, next_retry_at) WHERE status = 'failed' AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_payload_gin ON webhook_deliveries USING GIN (payload);

-- ============================================================================
-- 12. WEBHOOK CONFIGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_configs (
  adapter VARCHAR(100) PRIMARY KEY,
  secret VARCHAR(255) NOT NULL,
  signature_algorithm VARCHAR(50) DEFAULT 'hmac-sha256',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  event VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  ip VARCHAR(45),
  user_agent TEXT,
  method VARCHAR(10),
  path VARCHAR(500),
  status_code INTEGER,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_event_timestamp ON audit_logs(tenant_id, event, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON audit_logs USING GIN (metadata);

-- ============================================================================
-- 14. IDEMPOTENCY KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_user_key ON idempotency_keys(user_id, key);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_tenant_id ON idempotency_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_active_tenant ON idempotency_keys(tenant_id, created_at DESC) WHERE expires_at > NOW();

-- ============================================================================
-- 15. SECURITY TABLES
-- ============================================================================

-- Revoked tokens table (for JWT revocation)
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti VARCHAR(255) PRIMARY KEY,
  revoked_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);

-- Blocked IPs table (for incident response)
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip VARCHAR(45) NOT NULL,
  reason TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  unblocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip, tenant_id) WHERE unblocked_at IS NULL
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_tenant_id ON blocked_ips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(ip) WHERE unblocked_at IS NULL;

-- Security events table (enhanced audit logging)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  ip VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_id ON security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

-- ============================================================================
-- 16. TENANT USAGE TRACKING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  metric_value BIGINT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, metric_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_id ON tenant_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON tenant_usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_type ON tenant_usage(metric_type);

-- Real-time quota tracking
CREATE TABLE IF NOT EXISTS tenant_quota_usage (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  current_storage_bytes BIGINT DEFAULT 0,
  current_concurrent_jobs INTEGER DEFAULT 0,
  current_monthly_reconciliations INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
