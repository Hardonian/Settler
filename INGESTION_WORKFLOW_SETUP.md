# Ingestion Pipeline Migration Workflow Setup ✅

## GitHub Actions Workflow Created

A new workflow has been created that automatically runs the ingestion pipeline migration on:
- **Pull Requests** - When ingestion-related files are changed
- **Merge to Main** - When ingestion-related files are merged

## Workflow File

**Location:** `.github/workflows/ingestion-pipeline-migration.yml`

## Triggers

The workflow runs when these files are changed:
- `prisma/schema.prisma`
- `supabase/migrations/**/ingestion*.sql`
- `supabase/migrations/**/*ingestion*.sql`
- `packages/api/src/services/ingestion/**`
- `.github/workflows/ingestion-pipeline-migration.yml`

## What It Does

1. **Checks out code**
2. **Sets up Node.js** (from `.nvmrc`)
3. **Installs dependencies** (`npm ci`)
4. **Checks migration status** (before)
5. **Runs migration** using `prisma migrate deploy`
6. **Verifies migration status** (after)
7. **Verifies tables exist** (checks all 7 ingestion tables)
8. **Generates Prisma Client**
9. **Creates summary** in GitHub Actions summary

## Required Secrets

The workflow uses the `production` environment which requires:

- **DATABASE_URL** - PostgreSQL connection string
  - Should be set in GitHub Actions secrets
  - Format: `postgresql://user:password@host:port/database`

## How It Works

### On Pull Request
- Runs when PR is opened/updated with ingestion changes
- Applies migrations to verify they work
- Does NOT merge migrations (they're already in the PR)

### On Merge to Main
- Runs when code is merged to main branch
- Applies migrations to production database
- Verifies all tables are created successfully

## Migration Command

The workflow uses:
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

This is the non-interactive command for CI/CD that:
- Applies pending migrations
- Does NOT create new migrations
- Is safe for automated environments

## Verification

After migration, the workflow verifies these tables exist:
- ✅ `ingestion_sources`
- ✅ `ingestions`
- ✅ `raw_records`
- ✅ `normalized_transactions`
- ✅ `reconciliation_runs`
- ✅ `reconciliation_matches`
- ✅ `exports`

## Workflow Status

You can check workflow status:
1. Go to GitHub Actions tab
2. Look for "Ingestion Pipeline Migration" workflow
3. Click on the run to see details
4. Check the summary for table verification results

## Troubleshooting

If migration fails:

1. **Check DATABASE_URL secret**
   - Go to Settings → Secrets and variables → Actions
   - Verify `DATABASE_URL` is set in `production` environment

2. **Check database connectivity**
   - Verify database is accessible from GitHub Actions
   - Check firewall/network rules

3. **Check migration file**
   - Verify `supabase/migrations/20250131000000_ingestion_pipeline.sql` exists
   - Check SQL syntax is valid

4. **Check Prisma schema**
   - Run locally: `npx prisma validate --schema=prisma/schema.prisma`

## Next Steps

1. **Verify DATABASE_URL secret is set**
   ```bash
   # In GitHub: Settings → Secrets → Actions → production environment
   # Add: DATABASE_URL = postgresql://user:pass@host:port/db
   ```

2. **Test the workflow**
   - Create a PR with ingestion changes
   - Check GitHub Actions runs the workflow
   - Verify migration succeeds

3. **Merge to main**
   - When PR is merged, workflow runs automatically
   - Migrations are applied to production
   - Tables are verified

## Example Workflow Run

When you commit this PR, you should see:
```
✅ Ingestion Pipeline Migration Completed Successfully

Timestamp: 2025-01-31 12:00:00 UTC
Event: pull_request
Branch: refs/pull/123/merge
Commit: abc123...

✅ All ingestion pipeline migrations have been applied successfully.

### Tables Created:
- ✅ ingestion_sources
- ✅ ingestions
- ✅ raw_records
- ✅ normalized_transactions
- ✅ reconciliation_runs
- ✅ reconciliation_matches
- ✅ exports
```

## Notes

- The workflow uses `prisma migrate deploy` which is safe for CI/CD
- It does NOT create new migrations (only applies existing ones)
- All migrations are idempotent (safe to run multiple times)
- The workflow runs in the `production` environment for security
