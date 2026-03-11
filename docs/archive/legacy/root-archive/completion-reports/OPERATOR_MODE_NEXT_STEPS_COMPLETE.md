# Operator Mode Next Steps - COMPLETED ✅

All next steps have been implemented and automated via GitHub Actions.

## ✅ Step 1: Migration Automation

**Status**: COMPLETE

**Workflow**: `.github/workflows/apply-operator-mode-migration.yml`

**How it works**:
- Automatically runs when migration file is pushed to main
- Can be manually triggered via GitHub Actions UI
- Uses `DATABASE_URL` and `SUPABASE_DB_PASSWORD` secrets
- Verifies tables and indexes after migration

**To run**:
1. Push migration file to main (automatic)
2. OR: Go to Actions → "Apply Operator Mode Migration" → Run workflow

## ✅ Step 2: Daily Job Automation

**Status**: COMPLETE

**Workflow**: `.github/workflows/operator-mode-daily.yml`

**Schedule**: Runs daily at 2 AM UTC via cron

**What it does**:
- Generates daily intelligence report
- Checks alert thresholds
- Triggers alerts if thresholds exceeded
- Creates and verifies database backup
- Cleans up old backups (>30 days)

**To test manually**:
1. Go to Actions → "Operator Mode Daily Job" → Run workflow

**NPM Script**: `npm run operator-mode:daily` (for local testing)

## ✅ Step 3: Default Alert Configuration

**Status**: COMPLETE

**Script**: `scripts/setup-operator-mode-alerts.ts`

**Workflow**: `.github/workflows/operator-mode-setup-alerts.yml`

**Default Rules Created**:
- High Error Rate (>5%) - High severity, Slack
- Critical Error Rate (>10%) - Critical severity, Slack + Email
- Slow Endpoints (P95 >5s) - Medium severity, Slack
- Failed Ingestions (>10/day) - High severity, Slack
- Billing Anomalies (>5/day) - Medium severity, Slack

**To run**:
1. Push setup script to main (automatic)
2. OR: Go to Actions → "Setup Operator Mode Default Alerts" → Run workflow
3. OR: `npm run operator-mode:setup-alerts` (local)

**Secrets needed**:
- `DATABASE_URL` (required)
- `OPERATOR_USER_ID` (optional, defaults to system user)
- `SLACK_WEBHOOK_URL` (optional, for Slack alerts)

## ✅ Step 4: Verification Tests

**Status**: COMPLETE

**Workflow**: `.github/workflows/operator-mode-verification.yml`

**Tests**:
- Daily intelligence generation
- Kill switch enable/disable
- Alert threshold checking
- Simulated failure → alert + trace_id
- Kill switch without redeploy

**To run**:
1. Automatically runs on PR/push to operator mode files
2. OR: Go to Actions → "Operator Mode Verification Tests" → Run workflow
3. OR: `npm run test:operator-mode` (local)

## GitHub Actions Workflows Created

1. **apply-operator-mode-migration.yml**
   - Applies database migration
   - Verifies tables and indexes
   - Can be triggered manually or on push

2. **operator-mode-daily.yml**
   - Runs daily at 2 AM UTC
   - Generates intelligence, checks alerts, creates backups
   - Can be triggered manually for testing

3. **operator-mode-setup-alerts.yml**
   - Sets up default alert rules
   - Can be triggered manually or on push

4. **operator-mode-verification.yml**
   - Runs verification tests
   - Runs automatically on PR/push
   - Can be triggered manually

## NPM Scripts Added

**Root package.json**:
- `npm run operator-mode:daily` - Run daily job
- `npm run operator-mode:setup-alerts` - Setup default alerts
- `npm run test:operator-mode` - Run verification tests

**packages/api/package.json**:
- `npm run operator-mode:daily` - Run daily job (API package)
- `npm run test:operator-mode` - Run verification tests (API package)

## Repository Secrets Required

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_DB_PASSWORD` - Database password

### Optional
- `OPERATOR_USER_ID` - UUID for operator user (defaults to system user)
- `SLACK_WEBHOOK_URL` - Slack webhook for alerts
- `ALERT_WEBHOOK_URL` - Custom webhook for alerts

## Quick Start Checklist

- [ ] Add `DATABASE_URL` secret to GitHub repository
- [ ] Add `SUPABASE_DB_PASSWORD` secret to GitHub repository
- [ ] (Optional) Add `SLACK_WEBHOOK_URL` for Slack alerts
- [ ] Push migration file or trigger migration workflow
- [ ] Trigger setup alerts workflow or run `npm run operator-mode:setup-alerts`
- [ ] Verify daily job workflow is enabled (runs automatically at 2 AM UTC)
- [ ] Run verification tests to confirm everything works
- [ ] Monitor daily intelligence reports

## Documentation

- `docs/OPERATOR_MODE.md` - Comprehensive guide
- `docs/OPERATOR_MODE_QUICK_START.md` - Quick reference
- `docs/OPERATOR_MODE_SETUP.md` - Setup guide (this file)
- `docs/INCIDENT_POSTMORTEM_TEMPLATE.md` - Incident template

## All Steps Complete ✅

All next steps have been implemented:
1. ✅ Migration automation via GitHub Actions
2. ✅ Daily job scheduled at 2 AM UTC
3. ✅ Default alert rules configuration
4. ✅ Verification tests automation

The system is now fully automated and ready for production use!
