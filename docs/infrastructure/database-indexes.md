# Database Index Optimization Guide

## Critical Indexes for Console Performance

### Billing Accounts

```sql
-- Already exists in schema
CREATE INDEX IF NOT EXISTS idx_billing_accounts_user_id ON billing_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_tenant_id ON billing_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_status ON billing_accounts(status);
```

### Receipts

```sql
-- Optimize receipt queries by upload and billing account
CREATE INDEX IF NOT EXISTS idx_receipts_upload_id ON receipts(upload_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_receipts_upload_created ON receipts(upload_id, created_at DESC);
```

### Usage Events

```sql
-- Optimize usage queries
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account ON usage_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_usage_events_account_timestamp ON usage_events(billing_account_id, timestamp DESC);
```

### API Keys

```sql
-- Optimize API key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at) WHERE revoked_at IS NULL;
```

### Feature Flags

```sql
-- Optimize feature flag queries
CREATE INDEX IF NOT EXISTS idx_feature_flags_billing_account ON feature_flags(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted ON feature_flags(deleted_at) WHERE deleted_at IS NULL;
```

## Query Performance Tips

1. **Always use indexes** - Ensure WHERE clauses use indexed columns
2. **Limit result sets** - Use `take`/`limit` to cap results
3. **Select only needed fields** - Use `select` instead of `include` when possible
4. **Use composite indexes** - For queries filtering by multiple columns
5. **Monitor slow queries** - Check query execution times

## Migration to Add Indexes

Add these indexes via migration if they don't exist:

```sql
-- Migration: optimize_console_indexes.sql
BEGIN;

-- Receipts indexes
CREATE INDEX IF NOT EXISTS idx_receipts_upload_id ON receipts(upload_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_upload_created ON receipts(upload_id, created_at DESC);

-- Usage events indexes
CREATE INDEX IF NOT EXISTS idx_usage_events_billing_account ON usage_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_account_timestamp ON usage_events(billing_account_id, timestamp DESC);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at) WHERE revoked_at IS NULL;

-- Feature flags indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_billing_account ON feature_flags(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted ON feature_flags(deleted_at) WHERE deleted_at IS NULL;

COMMIT;
```
