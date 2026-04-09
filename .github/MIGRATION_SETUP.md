# Database Migration Setup Guide

## GitHub Actions Migration Workflows

Two workflows are available for applying database migrations:

### 1. Automatic Migrations (`migrations.yml`)

- **Triggers**:
  - Push to `main` or `develop` branches when migration files change
  - Pull requests to `main` or `develop`
  - Manual dispatch
- **Behavior**: Automatically applies migrations to staging on push, requires manual approval for production

### 2. Safe Mode Migrations (`migrations-safe.yml`)

- **Triggers**: Manual dispatch only
- **Features**:
  - Validates migration syntax before applying
  - Dry-run mode available
  - Manual environment selection
  - Production requires approval

## Required Repository Secrets

Set these secrets in GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Staging Environment

- `SUPABASE_DB_URL_STAGING` - PostgreSQL connection string for staging
  - Format: `postgresql://postgres:[password]@[host]:[port]/postgres`
- `SUPABASE_DB_PASSWORD_STAGING` - Database password for staging
- `SUPABASE_PROJECT_ID_STAGING` - Supabase project ID (optional, for CLI)
- `SUPABASE_ACCESS_TOKEN` - Supabase access token (optional, for CLI)

### Production Environment

- `SUPABASE_DB_URL_PRODUCTION` - PostgreSQL connection string for production
- `SUPABASE_DB_PASSWORD_PRODUCTION` - Database password for production
- `SUPABASE_PROJECT_ID_PRODUCTION` - Supabase project ID (optional)
- `SUPABASE_ACCESS_TOKEN` - Same token (can be shared)

## Getting Connection Strings

### From Supabase Dashboard

1. Go to your Supabase project
2. Navigate to `Settings > Database`
3. Find "Connection string" section
4. Copy the "URI" format connection string
5. Replace `[YOUR-PASSWORD]` with your actual database password

### Format

```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## Environment Protection Rules

### Staging Environment

- No approval required
- Auto-applies on push to `main`/`develop`

### Production Environment

- **Requires manual approval** (set in GitHub Environments)
- Only applies via `workflow_dispatch` with manual trigger
- Double-check before approving!

## Setting Up Environments

1. Go to `Settings > Environments` in your GitHub repository
2. Create two environments:
   - `staging` - No protection rules
   - `production` - Add "Required reviewers" (at least 1)

## Usage

### Automatic (on push)

```bash
# Just commit and push migration files
git add supabase/migrations/20260130000000_new_migration.sql
git commit -m "Add new migration"
git push origin main
```

### Manual (Safe Mode)

1. Go to `Actions` tab in GitHub
2. Select "Apply Database Migrations (Safe Mode)"
3. Click "Run workflow"
4. Select environment (staging/production)
5. Optionally enable "Dry run"
6. Click "Run workflow"

### Manual (Direct)

1. Go to `Actions` tab
2. Select "Apply Database Migrations"
3. Click "Run workflow"
4. Select environment
5. Click "Run workflow"

## Migration File Naming

Migrations are applied in alphabetical order. Use timestamp prefix:

```
20260130000000_description.sql
20260130000001_description.sql
20260130000002_description.sql
```

## Verification

After migrations run, check:

1. GitHub Actions logs for success/failure
2. Migration summary in workflow summary
3. Database tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('receipts', 'ai_analysis_usage', 'ai_analyses');
   ```

## Troubleshooting

### Migration Fails

1. Check GitHub Actions logs
2. Verify connection string format
3. Check database permissions
4. Verify migration SQL syntax

### Connection Issues

1. Verify secrets are set correctly
2. Check IP allowlist in Supabase (if enabled)
3. Verify password is correct
4. Check connection string format

### Rollback

Migrations don't auto-rollback. To rollback:

1. Create a new migration that reverses changes
2. Apply via workflow
3. Or manually run rollback SQL

## Security Best Practices

1. ✅ Never commit secrets to repository
2. ✅ Use GitHub Secrets for all credentials
3. ✅ Enable environment protection for production
4. ✅ Require approvals for production migrations
5. ✅ Use separate credentials for staging/production
6. ✅ Rotate passwords regularly
7. ✅ Monitor migration logs for unauthorized access

## Migration Checklist

Before pushing migrations:

- [ ] Migration file follows naming convention
- [ ] SQL syntax is valid
- [ ] Migration is idempotent (can be run multiple times safely)
- [ ] RLS policies are included
- [ ] Indexes are created
- [ ] No destructive changes without backup
- [ ] Tested locally first

## Current Migrations

The following migrations will be applied:

1. `20260130000000_settler_receipts_hash_chain.sql` - Receipts table with hash chain
2. `20260130000001_settler_tenant_context_helper.sql` - Tenant context helper function
3. `20260130000002_settler_rls_hardening.sql` - RLS policy updates
4. `20260130000003_settler_ai_tokens.sql` - AI analysis tokens tables

Total: 4 migrations
