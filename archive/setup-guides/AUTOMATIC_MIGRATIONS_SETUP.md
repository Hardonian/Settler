# Automatic Migration Setup

This document explains how migrations are automatically applied to your Supabase database.

## Overview

The system supports **two modes** of automatic migration application:

1. **Local Development** - Post-commit hook prompts to apply migrations locally
2. **CI/CD (GitHub Actions)** - Automatically applies migrations on push to main/develop

## How It Works

### 1. Local Development (Post-Commit Hook)

When you commit migration files locally, a post-commit hook will:

1. Detect if migration files (`supabase/migrations/*.sql`) were committed
2. Check if `DATABASE_URL` is set
3. Prompt you to apply migrations (y/N)
4. Run `scripts/apply-migrations.sh` if you confirm

**To use:**
```bash
# Commit migration files
git add supabase/migrations/20260127000002_missing_rls_policies.sql
git commit -m "Add missing RLS policies"

# Post-commit hook will prompt:
# ❓ Apply migrations to connected database? (y/N)
```

**To skip the prompt:**
- Answer 'n' or wait 5 seconds
- Apply manually later: `npm run db:migrate:apply`

**To disable locally:**
- Unset `DATABASE_URL` environment variable
- Or remove/rename `.husky/post-commit`

### 2. CI/CD (GitHub Actions)

When you push migration files to GitHub:

1. **Workflow:** `.github/workflows/auto-apply-migrations-on-push.yml`
2. **Triggers:** Push to `main` or `develop` branches with changes to `supabase/migrations/**`
3. **Actions:**
   - Detects all migration files
   - Links to Supabase project
   - Applies all migrations using `supabase db push --include-all`
   - Falls back to direct `psql` if CLI fails
   - Verifies migration status
   - Creates summary in GitHub Actions

**Existing workflows also handle migrations:**
- `.github/workflows/supabase-migrate.yml` - Comprehensive migration workflow (runs on push/PR)
- `.github/workflows/auto-migrate-on-pr-push.yml` - Applies migrations on PR (preview environment)

## Manual Migration Application

### Option 1: Using npm script
```bash
npm run db:migrate:apply
```

### Option 2: Using TypeScript script
```bash
npm run db:migrate:auto
# or
tsx scripts/migrate-supabase.ts
```

### Option 3: Using Supabase CLI directly
```bash
# Link to project first
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push --include-all
```

### Option 4: Using direct psql
```bash
# Apply a specific migration
psql $DATABASE_URL -f supabase/migrations/20260127000002_missing_rls_policies.sql

# Apply all migrations
for file in supabase/migrations/*.sql; do
  psql $DATABASE_URL -f "$file"
done
```

## Environment Variables Required

### For Local Development
```bash
# Option 1: Direct PostgreSQL connection
DATABASE_URL=postgresql://user:password@host:port/database

# Option 2: Supabase project (for linking)
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-access-token
```

### For CI/CD (GitHub Secrets)
- `SUPABASE_ACCESS_TOKEN` - Supabase access token
- `SUPABASE_PROJECT_REF` - Supabase project reference ID
- `DATABASE_URL` - Direct PostgreSQL connection string
- `SUPABASE_DB_PASSWORD` - Database password (for psql fallback)

## Migration Files Created

The following new migration files were created and are ready to apply:

1. **`supabase/migrations/20260127000002_missing_rls_policies.sql`**
   - Adds RLS policies for `onboarding_progress`
   - Adds RLS policies for `usage_aggregate_daily`
   - Adds RLS policies for `usage_counters`
   - Adds RLS policies for `health_checks`, `diagnostics`, `alerts`

2. **`supabase/migrations/20260127000003_tenant_membership_helper.sql`**
   - Creates `is_tenant_member(tenant_id UUID)` function
   - Grants execute permissions

3. **`supabase/migrations/20260127000004_critical_indexes.sql`**
   - Adds indexes for `usage_events` (billing_account_id, timestamp DESC)
   - Adds indexes for `usage_aggregate_daily` (billing_account_id, date DESC)
   - Adds indexes for `usage_counters` (billing_account_id, service, period)
   - Adds indexes for `tenant_users` (user_id, tenant_id composite)

## Applying Migrations Now

### Quick Start (Recommended)

1. **Commit the migration files:**
   ```bash
   git add supabase/migrations/20260127*.sql
   git commit -m "Add missing RLS policies, helper functions, and indexes"
   ```

2. **Push to trigger automatic application:**
   ```bash
   git push origin main
   ```

3. **GitHub Actions will automatically:**
   - Detect the migration files
   - Apply them to your Supabase database
   - Verify the application
   - Create a summary

### Manual Application (If Needed)

If you want to apply migrations manually before pushing:

```bash
# Set your database connection
export DATABASE_URL="your-database-url"

# Apply migrations
npm run db:migrate:apply
```

## Verification

After migrations are applied, verify:

1. **Check migration status:**
   ```bash
   supabase migration list
   ```

2. **Verify tables exist:**
   ```sql
   -- Connect to your database
   psql $DATABASE_URL
   
   -- Check tables
   \dt
   
   -- Check functions
   \df is_tenant_member
   
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Test tenant membership function:**
   ```sql
   SELECT is_tenant_member('your-tenant-id');
   ```

## Troubleshooting

### Post-commit hook not running
- Ensure `.husky/post-commit` is executable: `chmod +x .husky/post-commit`
- Check if husky is installed: `npm run prepare`
- Verify git hooks are enabled: `ls -la .git/hooks/`

### Migrations not applying in CI/CD
- Check GitHub Actions logs for errors
- Verify secrets are set correctly in GitHub repository settings
- Ensure `SUPABASE_PROJECT_REF` matches your project
- Check if `DATABASE_URL` is accessible from GitHub Actions

### Migration fails with "already exists" error
- This is normal for idempotent migrations (using `IF NOT EXISTS`)
- The migration script handles these gracefully
- Check logs to confirm what was created

### Connection errors
- Verify `DATABASE_URL` is correct
- Check if database is accessible (firewall, network)
- For Supabase, ensure you're using the correct connection string format
- Try using Supabase CLI linking instead of direct connection

## Safety Features

1. **Idempotent Migrations** - All migrations use `IF NOT EXISTS` / `DROP IF EXISTS` patterns
2. **Transaction Safety** - Migrations run in transactions (BEGIN/COMMIT blocks)
3. **Error Handling** - Failed migrations stop the process and report errors
4. **Verification** - Post-application verification checks migration status
5. **CI/CD Safety** - Migrations only apply on main/develop branches (not on feature branches)

## Next Steps

1. ✅ Commit the new migration files
2. ✅ Push to trigger automatic application
3. ✅ Verify migrations were applied successfully
4. ✅ Test the new functions and RLS policies
5. ✅ Monitor for any issues

---

**Created:** 2026-01-27  
**Status:** ✅ Ready to use
