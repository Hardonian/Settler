# Console Complete Setup Migration

## Overview

This migration (`20260126000000_console_complete_setup.sql`) ensures all Settler Console tables, functions, and RLS policies are properly set up in Supabase. It consolidates all console-related schema requirements into a single executable migration.

## What This Migration Does

### 1. Creates Missing Tables

The migration creates the following tables if they don't exist:

#### Receipts API Tables
- `receipt_uploads` - Stores receipt file uploads
- `receipts` - Parsed receipt data
- `receipt_items` - Individual line items from receipts

#### Feature Flags API Tables
- `feature_flags` - Feature flag definitions
- `feature_flag_environments` - Environment-specific flag configurations
- `feature_flag_overrides` - User/tenant-specific flag overrides

#### Site Builder Tables
- `tenant_branding` - Tenant branding configuration (colors, fonts, logos)
- `tenant_navigation` - Navigation menu configuration
- `tenant_pages` - Page builder pages
- `tenant_page_revisions` - Page revision history

#### A/B Testing Tables
- `experiments` - Experiment definitions
- `experiment_variants` - Experiment variants
- `experiment_metric_events` - Experiment event tracking

#### Webhooks Tables
- `webhooks` - Webhook configurations
- `webhook_deliveries` - Webhook delivery logs

#### Other Tables
- `idempotency_keys` - Request idempotency tracking
- `stripe_events` - Stripe webhook event log
- `console_activities` - Console activity feed

### 2. Creates/Updates Helper Functions

- `current_user_id()` - Gets current user ID from JWT
- `current_tenant_id()` - Gets current tenant ID from app settings
- `log_console_activity()` - Logs console activities
- `get_recent_console_activities()` - Retrieves recent activities

### 3. Sets Up Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to access their own data
- Enforce tenant isolation where applicable
- Support both user-based and tenant-based access patterns

### 4. Creates Indexes

All tables have appropriate indexes for:
- Foreign key lookups
- User/tenant filtering
- Time-based queries
- Status filtering

## How to Apply

### Option 1: Via Supabase CLI

```bash
# Apply the migration
supabase migration up

# Or apply specific migration
supabase db push
```

### Option 2: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20260126000000_console_complete_setup.sql`
4. Paste and execute

### Option 3: Direct SQL Execution

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"

# Execute the migration
\i supabase/migrations/20260126000000_console_complete_setup.sql
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check that tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'receipt_uploads', 'receipts', 'receipt_items',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'tenant_branding', 'tenant_navigation', 'tenant_pages',
    'experiments', 'experiment_variants', 'experiment_metric_events',
    'webhooks', 'webhook_deliveries', 'idempotency_keys',
    'stripe_events', 'console_activities'
  )
ORDER BY table_name;

-- Check that functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'current_user_id', 'current_tenant_id',
    'log_console_activity', 'get_recent_console_activities'
  )
ORDER BY routine_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'receipt_uploads', 'receipts', 'receipt_items',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'tenant_branding', 'tenant_navigation', 'tenant_pages',
    'experiments', 'experiment_variants', 'experiment_metric_events',
    'webhooks', 'webhook_deliveries', 'idempotency_keys',
    'stripe_events', 'console_activities'
  )
ORDER BY tablename;
```

## Troubleshooting

### Error: "relation already exists"

This is normal - the migration uses `CREATE TABLE IF NOT EXISTS`, so existing tables won't be recreated. The migration is idempotent.

### Error: "permission denied"

Ensure you're running the migration as a database superuser or with appropriate permissions.

### Console still shows 500 errors

1. Verify the migration completed successfully
2. Check that RLS policies allow your user to access data
3. Ensure `current_user_id()` function works correctly
4. Check application logs for specific error messages

### Missing tables after migration

1. Check migration logs for errors
2. Verify you're connected to the correct database
3. Ensure all dependencies (like `billing_accounts`, `tenants`) exist

## Dependencies

This migration assumes the following tables already exist:
- `tenants` - From initial schema migration
- `users` - From initial schema migration  
- `billing_accounts` - From billing schema migration
- `api_keys` - From initial schema migration

If these don't exist, apply the earlier migrations first:
1. `20251128193735_initial_schema.sql`
2. `20250120000000_billing_schema.sql`

## Notes

- This migration is **idempotent** - it's safe to run multiple times
- All `CREATE TABLE` statements use `IF NOT EXISTS`
- All `CREATE INDEX` statements use `IF NOT EXISTS`
- Policies are dropped and recreated to ensure consistency
- The migration uses `SECURITY DEFINER` functions for RLS enforcement

## Next Steps

After applying this migration:

1. Test console access - navigate to `/console` and verify it loads
2. Test API key creation - create an API key via the console
3. Test receipt upload - upload a test receipt
4. Test feature flags - create and toggle a feature flag
5. Monitor logs - check for any RLS policy violations

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review application error logs
3. Verify environment variables are set correctly
4. Ensure Supabase connection is working
