# Migration Automation Setup

This document explains how to use the automated migration system.

## Quick Start

### Trigger Migrations via Comment

Simply comment `migrate` on any issue or pull request:

```
migrate
```

The workflow will automatically:

1. ✅ Detect pending migrations
2. ✅ Apply them to your database
3. ✅ Comment back with results

## Setup Requirements

### 1. GitHub Secrets

Add these secrets to your repository:

- Go to **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret**

Required secrets:

- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token
- `SUPABASE_PROJECT_REF` - Your project reference ID
- `SUPABASE_DB_PASSWORD` - Database password
- `SUPABASE_URL` - Full project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `SUPABASE_ANON_KEY` - Anonymous key
- `DATABASE_URL` - PostgreSQL connection string (optional)

See `/docs/github-secrets-migration.md` for detailed instructions.

### 2. Workflow Permissions

The workflow requires:

- `contents: read` - To read migration files
- `issues: write` - To comment on issues
- `pull-requests: write` - To comment on PRs

These are already configured in the workflow file.

## Usage Methods

### Method 1: Comment Trigger (Recommended)

1. Open any issue or pull request
2. Comment: `migrate`
3. Wait for the workflow to complete
4. Check the comment reply for results

### Method 2: Manual Workflow Dispatch

1. Go to **Actions** → **Migrate on Comment**
2. Click **Run workflow**
3. Select branch and click **Run workflow**

### Method 3: GitHub CLI

```bash
gh workflow run migrate-on-comment.yml
```

### Method 4: Local Script

```bash
./scripts/apply-pending-migrations.sh
```

Requires environment variables:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- Or `DATABASE_URL`

## Migration Files

### Active Migrations

- Location: `supabase/migrations/`
- Managed by: Supabase CLI
- Status: Tracked in `supabase_migrations.schema_migrations`

### Archived Migrations

- Location: `archive/deprecated_code/migrations/`
- Purpose: Historical reference
- Status: Already applied

## Checking Migration Status

### Via Script

```bash
./scripts/check-migration-status.sh
```

### Via Supabase CLI

```bash
supabase migration list --project-ref YOUR_PROJECT_REF
```

### Via Database Query

```sql
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

## Troubleshooting

### Workflow doesn't trigger on comment

- Ensure workflow file is in `.github/workflows/`
- Check workflow permissions in repository settings
- Verify comment contains exactly `migrate` (case-insensitive)

### Migration fails with authentication error

- Verify `SUPABASE_ACCESS_TOKEN` is valid
- Check token hasn't expired
- Ensure `SUPABASE_PROJECT_REF` is correct

### "No migrations to apply"

- All migrations are already applied
- Check migration status to confirm
- Create new migration if needed: `supabase migration new migration_name`

### Connection refused

- Verify `SUPABASE_DB_PASSWORD` is correct
- Check IP allowlist in Supabase dashboard
- Ensure database is accessible

## Security Best Practices

1. ✅ Never commit secrets to repository
2. ✅ Use environment-specific secrets
3. ✅ Rotate `SUPABASE_ACCESS_TOKEN` periodically
4. ✅ Review workflow logs for exposed values
5. ✅ Limit workflow permissions to minimum required

## Related Documentation

- `/docs/github-secrets-migration.md` - GitHub secrets setup
- `/archive/deprecated_code/migrations/README.md` - Archived migrations info
- `/scripts/apply-pending-migrations.sh` - Migration script
- `/scripts/check-migration-status.sh` - Status check script
