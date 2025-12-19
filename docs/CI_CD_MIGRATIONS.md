# CI/CD Database Migrations

This document explains how database migrations are automatically applied via GitHub Actions using Supabase Pooler connections.

## Overview

Migrations are automatically applied when:
- ✅ **Push to main** - Any push to main branch with migration files
- ✅ **Merge PR to main** - When a PR with migrations is merged
- ✅ **Manual trigger** - Via workflow_dispatch

**No local migration runs required** - everything happens automatically in CI/CD.

## Setup

### 1. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `DATABASE_URL`
5. Value: Your Supabase pooler connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST].pooler.supabase.com:5432/postgres
   ```
6. Click **Add secret**

### 2. Verify Workflows

The following workflows are automatically set up:

- **`.github/workflows/apply-migrations.yml`** - Main migration workflow
- **`.github/workflows/migrations-on-merge.yml`** - Auto-apply on PR merge
- **`.github/workflows/migrations-on-push.yml`** - Auto-apply on push to main

## How It Works

### On Push to Main

When you push migration files to main:

```bash
git add supabase/migrations/20251219001646_enterprise_multi_tenant_core.sql
git commit -m "Add enterprise multi-tenant migrations"
git push origin main
```

**What happens:**
1. GitHub Actions detects migration files changed
2. Runs `migrations-on-push.yml` workflow
3. Applies all pending migrations via pooler connection
4. Verifies migrations were applied
5. Reports success/failure

### On PR Merge

When a PR with migrations is merged to main:

**What happens:**
1. GitHub Actions detects PR was merged
2. Runs `migrations-on-merge.yml` workflow
3. Checks if PR contains migration files
4. If yes, applies migrations
5. Comments on PR with status

### Manual Trigger

You can manually trigger migrations:

1. Go to **Actions** tab in GitHub
2. Select **Apply Database Migrations** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Security

### Secrets Management

- ✅ **DATABASE_URL** is stored as GitHub secret (encrypted)
- ✅ Never exposed in logs or code
- ✅ Only accessible to GitHub Actions
- ✅ Can be rotated without code changes

### Connection Security

- ✅ Uses SSL/TLS for pooler connections
- ✅ Credentials never logged
- ✅ Connection strings masked in output

## Migration Script

The migration script (`scripts/apply-migrations-direct-pooler.ts`) is:

- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Transaction-safe** - Each migration in transaction
- ✅ **Error-handling** - Clear error messages
- ✅ **Tracking** - Records applied migrations

## Monitoring

### Check Migration Status

View applied migrations in GitHub Actions:

1. Go to **Actions** tab
2. Click on latest workflow run
3. View "Apply migrations" step output

### Verify in Database

You can verify migrations were applied:

```sql
-- Check applied migrations
SELECT version, name, inserted_at 
FROM supabase_migrations.schema_migrations 
ORDER BY inserted_at DESC;

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 
    'memberships', 
    'entitlements', 
    'usage_events', 
    'cms_pages', 
    'cms_page_versions', 
    'cms_media'
  );
```

## Troubleshooting

### Migration Fails in CI

**Check:**
1. DATABASE_URL secret is set correctly
2. Connection string format is valid
3. Password doesn't contain unencoded special characters
4. Database is accessible from GitHub Actions IPs

**View logs:**
- Go to Actions tab
- Click failed workflow
- Check "Apply migrations" step logs

### Migration Already Applied

The script automatically skips already-applied migrations:
```
⊘ Skipping (already applied): 20251219001646_enterprise_multi_tenant_core.sql
```

This is safe and expected.

### Connection Timeout

If connection times out:
1. Check Supabase project is active
2. Verify pooler is enabled
3. Check network connectivity
4. Try direct connection as fallback

## Best Practices

### 1. Migration Naming

Use timestamped names:
```
20251219001646_enterprise_multi_tenant_core.sql
```

### 2. Idempotent Migrations

Always use `IF NOT EXISTS`:
```sql
CREATE TABLE IF NOT EXISTS profiles (...);
```

### 3. Test Locally First

Test migrations locally before pushing:
```bash
# Use local Supabase
supabase db reset
supabase migration up
```

### 4. Review Before Merge

- Review migration SQL in PR
- Test in staging if available
- Verify migration order

### 5. Monitor After Deployment

- Check GitHub Actions logs
- Verify tables in Supabase dashboard
- Test application functionality

## Workflow Files

### apply-migrations.yml

Main workflow that:
- Runs on push to main with migration files
- Runs on PR with migration files
- Can be manually triggered
- Provides PR comments

### migrations-on-merge.yml

Specialized workflow that:
- Only runs when PR is merged (not just closed)
- Checks if PR contains migrations
- Applies migrations if needed
- Provides status feedback

### migrations-on-push.yml

Specialized workflow that:
- Runs on every push to main
- Only if migration files changed
- Applies all pending migrations
- Creates deployment status

## Disabling Auto-Migrations

If you need to disable auto-migrations temporarily:

1. Comment out workflow triggers in `.github/workflows/*.yml`
2. Or add condition: `if: false` to workflow

**Note:** Migrations will need to be applied manually if disabled.

## Rollback

To rollback a migration:

1. Create new migration that reverses changes
2. Push to main
3. Auto-migration will apply rollback

**Example rollback migration:**
```sql
-- Rollback: Remove table
DROP TABLE IF EXISTS cms_media CASCADE;
```

## Support

If migrations fail:

1. Check GitHub Actions logs
2. Verify DATABASE_URL secret
3. Test connection manually
4. Review migration SQL for errors

---

**Status**: ✅ **Fully Automated - No Local Migration Required**
