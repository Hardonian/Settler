# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflows

### `ci.yml` - Continuous Integration
**Triggers:** Push to main/develop, Pull requests

**Jobs:**
- Environment validation
- Lint and type check
- Tests (unit + integration)
- Security scan
- Build
- E2E tests
- Load tests

### `post-merge-validation.yml` - Post-Merge Validation & Setup
**Triggers:** Push to main

**Jobs:**
- Comprehensive validation (type check, lint, format, build)
- Run migrations on staging
- Run migrations on production (requires approval)
- Post-deployment verification

**Features:**
- Automatically runs database migrations when PR is merged to main
- Validates environment configuration
- Verifies build artifacts
- Checks for accidentally committed secrets
- Runs health checks after deployment

### `auto-migrate-on-merge.yml` - Auto-Migrate on Merge
**Triggers:** PR closed (merged to main)

**Features:**
- Detects new migration files in PR
- Automatically runs migrations if migrations are present
- Creates summary of applied migrations

### `deploy-production.yml` - Production Deployment
**Triggers:** Push to main, Manual dispatch

**Jobs:**
- Run tests
- Build application
- Run database migrations
- Deploy to Vercel
- Verify deployment
- Post-deployment health check

### `deploy-preview.yml` - Preview Deployment
**Triggers:** Pull requests

**Jobs:**
- Build and deploy preview environment
- Run tests
- No migrations (preview uses test database)

## Environment Secrets Required

### Production Environment
- `DATABASE_URL` - Production database connection string
- `JWT_SECRET` - Production JWT secret
- `ENCRYPTION_KEY` - Production encryption key
- `PRODUCTION_URL` - Production API URL (for health checks)
- `VERCEL_TOKEN` - Vercel deployment token (optional)
- `VERCEL_ORG_ID` - Vercel organization ID (optional)
- `VERCEL_PROJECT_ID` - Vercel project ID (optional)

### Staging Environment
- `STAGING_DATABASE_URL` - Staging database connection string
- `STAGING_JWT_SECRET` - Staging JWT secret
- `STAGING_ENCRYPTION_KEY` - Staging encryption key
- `STAGING_URL` - Staging API URL (for health checks)

## Migration Workflow

When a PR with migration files is merged to main:

1. **Post-Merge Validation** runs:
   - Validates environment schema
   - Type checks, lints, formats
   - Builds application
   - Verifies artifacts

2. **Staging Migrations** run:
   - Migrations applied to staging database
   - Health checks verify staging

3. **Production Migrations** run (requires approval):
   - Migrations applied to production database
   - Health checks verify production

4. **Post-Deployment Verification**:
   - All endpoints verified
   - Health checks pass
   - Deployment summary created

## Manual Triggers

All workflows support `workflow_dispatch` for manual triggering:
- Go to Actions → Select workflow → Run workflow

## Migration Detection

Migrations are automatically detected if:
- Files in `packages/api/src/db/migrations/` are added/modified
- PR commit message contains `[migrate]` or `[migration]`
- Workflow is manually triggered

## Safety Features

- **Production migrations require approval** (GitHub environment protection)
- **Staging migrations run first** (catch issues before production)
- **Health checks** verify migrations didn't break anything
- **Rollback capability** (migrations are reversible)
- **Secret scanning** prevents accidental commits

## Troubleshooting

### Migrations Not Running
- Check if migration files are in the PR
- Verify environment secrets are set
- Check workflow logs for errors

### Migration Failures
- Check database connection string
- Verify migration file syntax
- Check for conflicting migrations
- Review migration logs

### Health Check Failures
- Verify deployment URL is correct
- Check if service is running
- Review application logs
- Verify environment variables
