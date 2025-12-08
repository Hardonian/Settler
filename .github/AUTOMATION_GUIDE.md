# GitHub Actions Automation Guide

This guide explains the automated workflows that run when PRs are merged to main.

## Overview

When a PR is merged to `main`, the following workflows automatically execute:

1. **Post-Merge Validation** - Validates code, builds, checks for issues
2. **Migration Detection** - Detects if migration files were added
3. **Staging Migrations** - Runs migrations on staging first (safety)
4. **Production Migrations** - Runs migrations on production (requires approval)
5. **Deployment** - Deploys to production
6. **Verification** - Verifies deployment health

## Workflow Details

### 1. Post-Merge Validation (`post-merge-validation.yml`)

**Triggers:** Push to main

**What it does:**
- Validates environment variable schema
- Type checks all code
- Lints all code
- Checks code formatting
- Builds all packages
- Verifies build artifacts
- Scans for accidentally committed secrets
- Verifies documentation completeness

**Output:** Validation report in GitHub Actions summary

### 2. Auto-Migrate on Merge (`auto-migrate-on-merge.yml`)

**Triggers:** PR closed (merged to main)

**What it does:**
- Detects new migration files in the PR
- Automatically runs migrations if detected
- Creates summary of applied migrations

**Migration Detection:**
- Checks for files in `packages/api/src/db/migrations/`
- Looks for commit messages containing `[migrate]` or `[migration]`
- Can be manually triggered

### 3. Staging Migrations (`post-merge-validation.yml` → `run-migrations-staging`)

**Triggers:** After validation passes, push to main

**What it does:**
- Runs migrations on staging database
- Verifies staging health after migration
- Acts as safety check before production

**Environment:** Uses `staging` GitHub environment secrets

### 4. Production Migrations (`post-merge-validation.yml` → `run-migrations-production`)

**Triggers:** After staging migrations pass, push to main

**What it does:**
- **Requires manual approval** (GitHub environment protection)
- Runs migrations on production database
- Verifies production health after migration

**Safety Features:**
- Requires approval before running
- Runs after staging migrations (catch issues first)
- Health checks verify migrations didn't break anything

**Environment:** Uses `production` GitHub environment secrets

### 5. Production Deployment (`deploy-production.yml`)

**Triggers:** Push to main, Manual dispatch

**What it does:**
- Runs tests
- Builds application
- **Runs database migrations** (if not already run)
- Deploys to Vercel
- Verifies deployment
- Runs post-deployment health checks

**Note:** Migrations are idempotent - safe to run multiple times

### 6. Migration Safety Check (`migration-safety-check.yml`)

**Triggers:** PR with migration files

**What it does:**
- Checks migration file syntax
- Tests migrations on clean database
- Verifies migration rollback capability
- Creates safety report

**Runs on:** Every PR that modifies migration files

## Setup Instructions

### 1. Configure GitHub Environments

Go to **Settings → Environments** and create:

#### Staging Environment
- **Name:** `staging`
- **Required reviewers:** Optional
- **Secrets:**
  - `STAGING_DATABASE_URL`
  - `STAGING_JWT_SECRET`
  - `STAGING_ENCRYPTION_KEY`
  - `STAGING_URL`

#### Production Environment
- **Name:** `production`
- **Required reviewers:** **Required** (recommended: 1-2 reviewers)
- **Deployment branches:** `main` only
- **Secrets:**
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `ENCRYPTION_KEY`
  - `PRODUCTION_URL`
  - `VERCEL_TOKEN` (optional)
  - `VERCEL_ORG_ID` (optional)
  - `VERCEL_PROJECT_ID` (optional)
  - `SUPABASE_URL` (if using Supabase)
  - `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase)
  - `SUPABASE_DB_PASSWORD` (if using Supabase)
  - `REDIS_URL` or `UPSTASH_REDIS_REST_URL` (if using Redis)

### 2. Repository Secrets

Add these secrets at **Settings → Secrets and variables → Actions**:

**Required:**
- `DATABASE_URL` - Production database connection string
- `JWT_SECRET` - Production JWT secret (min 32 chars)
- `ENCRYPTION_KEY` - Production encryption key (exactly 32 chars)

**Optional:**
- `SNYK_TOKEN` - For security scanning
- `VERCEL_TOKEN` - For Vercel deployment
- `VERCEL_ORG_ID` - For Vercel deployment
- `VERCEL_PROJECT_ID` - For Vercel deployment

### 3. Environment Protection Rules

**Production Environment:**
- ✅ **Required reviewers:** 1-2 (recommended)
- ✅ **Wait timer:** 0 minutes (or 5 minutes for extra safety)
- ✅ **Deployment branches:** `main` only

This ensures production migrations require manual approval.

## Workflow Execution Flow

```
PR Merged to Main
    ↓
Post-Merge Validation
    ├─ Validate environment schema ✅
    ├─ Type check ✅
    ├─ Lint ✅
    ├─ Format check ✅
    ├─ Build ✅
    └─ Verify artifacts ✅
    ↓
Auto-Migrate Detection
    ├─ Check for migration files
    ├─ If found → Run migrations
    └─ Create migration summary
    ↓
Staging Migrations (if migrations detected)
    ├─ Run migrations on staging
    └─ Verify staging health ✅
    ↓
Production Migrations (requires approval)
    ├─ ⚠️  WAIT FOR APPROVAL
    ├─ Run migrations on production
    └─ Verify production health ✅
    ↓
Production Deployment
    ├─ Run tests ✅
    ├─ Build application ✅
    ├─ Deploy to Vercel ✅
    └─ Verify deployment ✅
    ↓
Post-Deployment Verification
    ├─ Health check ✅
    ├─ API endpoints check ✅
    └─ Create deployment summary ✅
```

## Migration Workflow Details

### Automatic Migration Detection

Migrations run automatically if:
1. **Migration files changed:** Files in `packages/api/src/db/migrations/` are added/modified
2. **Commit message:** PR commit message contains `[migrate]` or `[migration]`
3. **Manual trigger:** Workflow is manually triggered via `workflow_dispatch`

### Migration Safety

1. **Staging First:** Migrations always run on staging before production
2. **Approval Required:** Production migrations require manual approval
3. **Health Checks:** Health endpoints verified after migrations
4. **Rollback Ready:** Migrations are designed to be reversible
5. **Idempotent:** Safe to run migrations multiple times

### Migration Execution

**Staging:**
```bash
cd packages/api
npm run migrate:prod
# Uses STAGING_DATABASE_URL from GitHub secrets
```

**Production:**
```bash
cd packages/api
npm run migrate:prod
# Uses DATABASE_URL from GitHub secrets
# Requires manual approval
```

## Monitoring & Notifications

### GitHub Actions Summary

Each workflow creates a summary in the Actions tab showing:
- ✅ Completed actions
- ⚠️  Warnings
- ❌ Errors
- 📋 Next steps

### Workflow Status

Monitor workflow status at:
- **Actions tab** → Select workflow → View run details
- **Checks tab** → On PR or commit

### Failure Handling

If migrations fail:
1. **Check logs** in GitHub Actions
2. **Review migration files** for syntax errors
3. **Verify database connection** (secrets correct?)
4. **Check migration order** (dependencies correct?)
5. **Manual rollback** if needed (create down migration)

## Manual Triggers

All workflows support manual triggering:

1. Go to **Actions** tab
2. Select workflow (e.g., "Post-Merge Validation")
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow**

## Troubleshooting

### Migrations Not Running

**Check:**
- Are migration files in the PR?
- Are environment secrets set?
- Is workflow enabled?
- Check workflow logs for errors

### Migration Failures

**Common Issues:**
- Database connection string incorrect
- Migration file syntax error
- Conflicting migrations
- Missing dependencies

**Solution:**
- Check migration logs
- Verify database connection
- Test migration locally first
- Review migration file syntax

### Production Approval Not Appearing

**Check:**
- Is production environment configured?
- Are required reviewers set?
- Is branch protection enabled?
- Check environment settings

### Health Checks Failing

**Check:**
- Is application deployed?
- Are environment variables set?
- Is database accessible?
- Check application logs

## Best Practices

### Migration Files

1. **Naming:** Use sequential numbers (`009-refresh-tokens.sql`)
2. **Idempotent:** Use `IF NOT EXISTS` where possible
3. **Reversible:** Include down migrations when possible
4. **Tested:** Test locally before committing
5. **Documented:** Add comments explaining changes

### Commit Messages

Include migration indicators:
```
feat(api): add token rotation [migrate]

- Add refresh_tokens table
- Implement token rotation logic
```

### PR Process

1. **Create PR** with migration files
2. **Migration Safety Check** runs automatically
3. **Review** migration files carefully
4. **Merge** to main
5. **Migrations run** automatically
6. **Monitor** deployment status

## Security Considerations

### Secrets Management

- ✅ **Never commit secrets** to repository
- ✅ **Use GitHub Secrets** for sensitive data
- ✅ **Environment-specific** secrets (staging vs production)
- ✅ **Rotate secrets** regularly
- ✅ **Limit access** to production secrets

### Migration Safety

- ✅ **Staging first** (catch issues before production)
- ✅ **Approval required** (manual review before production)
- ✅ **Health checks** (verify migrations didn't break anything)
- ✅ **Rollback plan** (have down migrations ready)
- ✅ **Backup database** before production migrations

## Summary

When you merge a PR to main:

1. ✅ **Validation** runs automatically
2. ✅ **Migrations detected** automatically
3. ✅ **Staging migrations** run automatically
4. ⚠️  **Production migrations** require approval
5. ✅ **Deployment** happens automatically
6. ✅ **Verification** confirms everything works

**No manual steps required** (except approving production migrations)!

---

For questions or issues, check:
- Workflow logs in GitHub Actions
- Migration files in `packages/api/src/db/migrations/`
- Environment secrets in GitHub Settings
