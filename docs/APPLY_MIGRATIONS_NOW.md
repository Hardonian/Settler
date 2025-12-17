# Apply All Migrations to Supabase

**Status:** DATABASE_URL configured - Ready to apply migrations

## Quick Apply (Recommended)

Since DATABASE_URL is now configured, you can apply all migrations:

### Option 1: Using Migration Script (Checks Applied Migrations)

```bash
npm run db:migrate:pending
```

This script:
- Checks which migrations have been applied
- Only applies pending migrations
- Tracks applied migrations in `schema_migrations` table

### Option 2: Apply All Migrations Directly

```bash
npm run db:migrate:all
```

This script:
- Applies ALL migrations in order
- Ignores "already exists" errors (safe to run multiple times)
- Useful for initial setup

## Network Connectivity Note

If you see `ENETUNREACH` errors, this is a network connectivity issue from the current environment. The migrations can be applied from:

1. **Vercel CLI** (after deployment)
2. **Local machine** with database access
3. **Supabase Dashboard** SQL Editor
4. **Supabase CLI** (if installed)

## Alternative: Apply via Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration file contents
3. Paste and run in SQL Editor
4. Repeat for each migration file

## Alternative: Apply via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref johfcvvmtfiomzxipspz

# Apply migrations
supabase db push
```

## Migration Files to Apply

Found **67 migration files** in `supabase/migrations/`

Key migrations include:
- Console setup migrations
- RLS policy migrations
- Index optimization migrations
- Feature migrations

## Verification

After applying migrations, verify:

```sql
-- Check schema_migrations table exists
SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;

-- Check critical tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('billing_accounts', 'api_keys', 'receipts', 'usage_events', 'feature_flags');

-- Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

## Important Migrations

### Console Setup
- `20260126000000_console_complete_setup.sql` - Complete console setup
- `20260125000000_console_rls_fixes.sql` - RLS policies
- `20260130000004_optimize_console_indexes.sql` - Performance indexes (NEW)

### Critical for Console
- `20250120000002_billing_rls_policies.sql` - Billing RLS
- `20260127000002_missing_rls_policies.sql` - Additional RLS
- `20260130000002_settler_rls_hardening.sql` - RLS hardening

## Next Steps

1. **Apply migrations** using one of the methods above
2. **Verify tables exist** using SQL queries
3. **Check indexes** are created
4. **Test console routes** to ensure everything works

---

**Note:** If network connectivity is an issue from this environment, use Vercel CLI, Supabase Dashboard, or run from a machine with database access.
