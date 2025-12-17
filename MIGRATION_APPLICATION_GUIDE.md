# Migration Application Guide

**Status:** DATABASE_URL configured - Ready to apply migrations

## Migration Status

- **Total migrations:** 67 files
- **DATABASE_URL:** ✅ Configured
- **Ready to apply:** ✅ Yes

## Application Methods

### Method 1: Migration Script (Recommended)

The script checks which migrations have been applied and only runs pending ones:

```bash
npm run db:migrate:pending
```

**Features:**
- Tracks applied migrations in `schema_migrations` table
- Only applies pending migrations
- Safe to run multiple times

### Method 2: Apply All Migrations

If `schema_migrations` table doesn't exist yet, apply all migrations:

```bash
npm run db:migrate:all
```

**Features:**
- Applies all migrations in order
- Ignores "already exists" errors
- Safe for initial setup

### Method 3: Via Supabase Dashboard (If Network Issues)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Copy contents of each migration file
5. Paste and run in SQL Editor
6. Repeat for all migrations

### Method 4: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref johfcvvmtfiomzxipspz

# Apply all migrations
supabase db push
```

### Method 5: Via Vercel (After Deployment)

After deployment, migrations can be applied via Vercel CLI:

```bash
# Pull environment variables
vercel env pull .env.production

# Apply migrations
npm run db:migrate:pending
```

## Key Migrations to Apply

### Critical for Console
1. `20260126000000_console_complete_setup.sql` - Complete console setup
2. `20260125000000_console_rls_fixes.sql` - RLS policies
3. `20260130000004_optimize_console_indexes.sql` - Performance indexes ⭐ NEW
4. `20250120000002_billing_rls_policies.sql` - Billing RLS
5. `20260127000002_missing_rls_policies.sql` - Additional RLS

### Performance
- `20260130000004_optimize_console_indexes.sql` - Database indexes for faster queries

## Verification Queries

After applying migrations, run these to verify:

```sql
-- Check migrations were applied
SELECT version, applied_at FROM schema_migrations 
ORDER BY applied_at DESC LIMIT 10;

-- Check critical tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'billing_accounts', 
  'api_keys', 
  'receipts', 
  'usage_events', 
  'feature_flags',
  'uploads'
);

-- Check indexes exist (for performance)
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('api_keys', 'billing_accounts', 'usage_events');

-- Check helper functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('current_user_id', 'current_tenant_id');
```

## Expected Results

After successful migration:

- ✅ All tables exist
- ✅ RLS policies enabled
- ✅ Indexes created
- ✅ Helper functions exist
- ✅ `schema_migrations` table populated

## Troubleshooting

### Issue: Network Connectivity Error (ENETUNREACH)

**Solution:**
- Use Supabase Dashboard SQL Editor
- Use Supabase CLI from local machine
- Use Vercel CLI after deployment
- Check Supabase IP allowlist settings

### Issue: Migration Already Exists

**Status:** ✅ Normal - Safe to ignore

The migration script handles "already exists" errors gracefully. These are expected if migrations were partially applied.

### Issue: Permission Denied

**Solution:**
- Verify DATABASE_URL uses correct credentials
- Check database user has CREATE/ALTER permissions
- Verify RLS policies allow operations

## Next Steps After Migration

1. ✅ **Verify tables exist** - Run verification queries
2. ✅ **Test console routes** - Ensure everything works
3. ✅ **Check health endpoint** - `/api/health/console`
4. ✅ **Monitor performance** - Check query times improved

---

**Ready to apply migrations!** Choose the method that works best for your environment.
