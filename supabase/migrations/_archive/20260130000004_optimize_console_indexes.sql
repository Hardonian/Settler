-- Migration: Optimize Console Database Indexes
-- Created: 2026-01-30
-- Description: Adds performance indexes for console queries

BEGIN;

-- Receipts indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_receipts_upload_id ON receipts(upload_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);

-- Composite index for common query pattern (upload + created_at)
CREATE INDEX IF NOT EXISTS idx_receipts_upload_created ON receipts(upload_id, created_at DESC);

-- Usage events indexes for faster analytics
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account ON usage_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);

-- Composite index for common query pattern (billing_account + timestamp)
CREATE INDEX IF NOT EXISTS idx_usage_events_account_timestamp ON usage_events(billing_account_id, timestamp DESC);

-- API keys indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at) WHERE revoked_at IS NULL;

-- Feature flags indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_billing_account ON feature_flags(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted ON feature_flags(deleted_at) WHERE deleted_at IS NULL;

-- Uploads index for receipt queries
CREATE INDEX IF NOT EXISTS idx_uploads_billing_account ON uploads(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at DESC);

COMMIT;
