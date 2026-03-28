-- Seed data for development/testing
-- This file is run after migrations in development environments
-- DO NOT include production data or sensitive information

BEGIN;

-- ============================================================================
-- DEFAULT TENANT (for development/testing)
-- ============================================================================

INSERT INTO tenants (id, name, slug, tier, status, quotas, config, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Tenant',
  'default',
  'free',
  'active',
  '{
    "rateLimitRpm": 1000,
    "storageBytes": 1073741824,
    "concurrentJobs": 5,
    "monthlyReconciliations": 1000,
    "customDomains": 0
  }'::jsonb,
  '{
    "customDomainVerified": false,
    "dataResidencyRegion": "us",
    "enableAdvancedMatching": false,
    "enableMLFeatures": false,
    "webhookTimeout": 30000,
    "maxRetries": 3
  }'::jsonb,
  '{
    "createdBy": "system",
    "environment": "development"
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Initialize quota usage tracking for default tenant
INSERT INTO tenant_quota_usage (tenant_id, current_storage_bytes, current_concurrent_jobs, current_monthly_reconciliations, last_reset_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  0,
  0,
  0,
  NOW()
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- EXAMPLE USER (for development/testing)
-- ============================================================================

-- Note: Password hash is for 'password123' - CHANGE IN PRODUCTION!
-- Generated with: bcrypt.hash('password123', 10)
INSERT INTO users (id, tenant_id, email, password_hash, name, role, data_residency_region, data_retention_days)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- password123
  'Admin User',
  'admin',
  'us',
  365
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ============================================================================
-- EXAMPLE API KEY (for development/testing)
-- ============================================================================

-- Note: This is just a placeholder - real API keys should be generated via the API
INSERT INTO api_keys (id, user_id, tenant_id, key_prefix, key_hash, name, scopes, rate_limit)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'sk_test_',
  'placeholder_hash',
  'Development API Key',
  ARRAY['jobs:read', 'jobs:write', 'reports:read'],
  1000
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EXAMPLE WEBHOOK CONFIG (for development/testing)
-- ============================================================================

INSERT INTO webhook_configs (tenant_id, adapter, secret, signature_algorithm)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'stripe', 'whsec_placeholder_secret', 'hmac-sha256'),
  ('00000000-0000-0000-0000-000000000001', 'shopify', 'placeholder_shopify_secret', 'hmac-sha256'),
  ('00000000-0000-0000-0000-000000000001', 'quickbooks', 'placeholder_qb_secret', 'hmac-sha256')
ON CONFLICT (tenant_id, adapter) DO NOTHING;

COMMIT;
