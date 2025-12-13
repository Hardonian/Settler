# Console Migration Quick Start Guide

## Quick Apply

### Step 1: Apply the Migration

```bash
# Navigate to project root
cd /workspace

# Apply via Supabase CLI (recommended)
supabase db push

# OR apply specific migration file
supabase migration up 20260126000000_console_complete_setup
```

### Step 2: Verify Setup

```bash
# Run verification script
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/verify_console_setup.sql
```

### Step 3: Test Console

1. Navigate to `/console` in your application
2. Verify the page loads without 500 errors
3. Test creating an API key
4. Test viewing usage data

## Common Issues & Solutions

### Issue: "relation already exists"

**Solution**: This is normal. The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times.

### Issue: Console still shows 500 errors

**Checklist**:
1. ✅ Migration completed successfully (no errors in logs)
2. ✅ User is authenticated (check Supabase auth)
3. ✅ Billing account exists for user
4. ✅ RLS policies allow access (check verification script)

**Debug Steps**:
```sql
-- Check if user has billing account
SELECT id, user_id, email, status 
FROM billing_accounts 
WHERE user_id = '[YOUR_USER_ID]';

-- Check RLS policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('api_keys', 'console_activities', 'billing_accounts');

-- Test current_user_id function
SELECT current_user_id();
```

### Issue: "permission denied" errors

**Solution**: Ensure you're running migrations as a database superuser or with appropriate permissions.

```sql
-- Check current user permissions
SELECT current_user, usesuper FROM pg_user WHERE usename = current_user;
```

### Issue: Missing tables after migration

**Solution**: Check migration logs for errors and ensure dependencies exist:

```sql
-- Check dependencies
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'users', 'billing_accounts', 'api_keys');
```

If any are missing, apply earlier migrations first.

## Migration File Location

- **Migration**: `supabase/migrations/20260126000000_console_complete_setup.sql`
- **Verification**: `supabase/migrations/verify_console_setup.sql`
- **Documentation**: `CONSOLE_MIGRATION_SUMMARY.md`

## What Gets Created

- ✅ 18 new tables (receipts, feature flags, tenant pages, experiments, etc.)
- ✅ 4 helper functions (current_user_id, log_console_activity, etc.)
- ✅ 19 RLS policies (one per table + console activities has 2)
- ✅ 50+ indexes for performance

## Rollback

If you need to rollback (not recommended in production):

```sql
-- Drop tables (WARNING: This will delete all data!)
DROP TABLE IF EXISTS console_activities CASCADE;
DROP TABLE IF EXISTS experiment_metric_events CASCADE;
DROP TABLE IF EXISTS experiment_variants CASCADE;
DROP TABLE IF EXISTS experiments CASCADE;
DROP TABLE IF EXISTS tenant_page_revisions CASCADE;
DROP TABLE IF EXISTS tenant_pages CASCADE;
DROP TABLE IF EXISTS tenant_navigation CASCADE;
DROP TABLE IF EXISTS tenant_branding CASCADE;
DROP TABLE IF EXISTS feature_flag_overrides CASCADE;
DROP TABLE IF EXISTS feature_flag_environments CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS receipt_items CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS receipt_uploads CASCADE;
DROP TABLE IF EXISTS webhook_deliveries CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS idempotency_keys CASCADE;
DROP TABLE IF EXISTS stripe_events CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_recent_console_activities(UUID, INTEGER);
DROP FUNCTION IF EXISTS log_console_activity(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB, UUID, VARCHAR);
DROP FUNCTION IF EXISTS current_tenant_id();
DROP FUNCTION IF EXISTS current_user_id();
```

## Support

If issues persist:
1. Check Supabase dashboard logs
2. Review application error logs
3. Verify environment variables
4. Test database connection
5. Check RLS policies match your auth setup
