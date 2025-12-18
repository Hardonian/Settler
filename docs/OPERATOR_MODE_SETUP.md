# Operator Mode Setup Guide

Complete setup guide for Operator Mode using GitHub Actions and repository secrets.

## Prerequisites

1. GitHub repository with Actions enabled
2. Repository secrets configured (see below)
3. Database access (DATABASE_URL)

## Step 1: Configure Repository Secrets

Add the following secrets to your GitHub repository:

### Required Secrets

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_DB_PASSWORD` - Database password
- `OPERATOR_USER_ID` - UUID for operator user (optional, defaults to system user)

### Optional Secrets (for alerts)

- `SLACK_WEBHOOK_URL` - Slack webhook URL for alerts
- `ALERT_WEBHOOK_URL` - Custom webhook URL for alerts

### How to Add Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value

## Step 2: Run Migration

The migration will run automatically when you push the migration file, or you can trigger it manually:

### Option A: Automatic (on push to main)

Push the migration file to main branch:
```bash
git add supabase/migrations/20260131000001_operator_mode.sql
git commit -m "feat: add operator mode migration"
git push origin main
```

The workflow `.github/workflows/apply-operator-mode-migration.yml` will run automatically.

### Option B: Manual Trigger

1. Go to Actions tab in GitHub
2. Select "Apply Operator Mode Migration"
3. Click "Run workflow"
4. Select environment (production/staging)
5. Click "Run workflow"

### Verify Migration

After migration completes, verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'alert_rules',
    'alert_history',
    'tenant_usage_ceilings',
    'background_job_limits',
    'kill_switches',
    'backup_records',
    'daily_intelligence'
  )
ORDER BY table_name;
```

## Step 3: Setup Default Alert Rules

### Option A: Automatic (on push to main)

Push the setup script to main branch - the workflow will run automatically.

### Option B: Manual Trigger

1. Go to Actions tab in GitHub
2. Select "Setup Operator Mode Default Alerts"
3. Click "Run workflow"
4. Select environment
5. Click "Run workflow"

### Option C: Local Setup

```bash
export DATABASE_URL="your-database-url"
export OPERATOR_USER_ID="your-operator-user-id"  # Optional
npm run operator-mode:setup-alerts
```

### Default Alert Rules Created

- **High Error Rate**: >5% error rate (high severity, Slack)
- **Critical Error Rate**: >10% error rate (critical severity, Slack + Email)
- **Slow Endpoints**: P95 latency >5s (medium severity, Slack)
- **Failed Ingestions**: >10 failures/day (high severity, Slack)
- **Billing Anomalies**: >5 anomalies/day (medium severity, Slack)

## Step 4: Verify Daily Job is Scheduled

The daily job runs automatically via GitHub Actions cron at 2 AM UTC daily.

### Verify Workflow is Enabled

1. Go to Actions tab in GitHub
2. Find "Operator Mode Daily Job" workflow
3. Verify it's enabled (should show in workflow list)

### Manual Trigger (for testing)

1. Go to Actions tab
2. Select "Operator Mode Daily Job"
3. Click "Run workflow"
4. Select environment
5. Click "Run workflow"

### What the Daily Job Does

1. Generates daily intelligence report
2. Checks alert thresholds
3. Triggers alerts if thresholds exceeded
4. Creates and verifies database backup
5. Cleans up old backups (>30 days)

## Step 5: Run Verification Tests

### Option A: Automatic (on PR/push)

Tests run automatically when operator mode files change.

### Option B: Manual Trigger

1. Go to Actions tab
2. Select "Operator Mode Verification Tests"
3. Click "Run workflow"
4. Select environment (use staging for tests)
5. Click "Run workflow"

### Option C: Local Testing

```bash
export DATABASE_URL="your-database-url"
npm run test:operator-mode
```

### What Tests Verify

- ✅ Simulated failure produces alert + trace_id
- ✅ Kill switch works without redeploy
- ✅ Daily intelligence generation
- ✅ Alert threshold checking
- ✅ Kill switch enable/disable

## Step 6: Configure Slack (Optional)

If you want Slack alerts:

1. Create a Slack webhook:
   - Go to https://api.slack.com/apps
   - Create a new app or use existing
   - Add "Incoming Webhooks" feature
   - Create webhook for your channel
   - Copy webhook URL

2. Add to GitHub secrets:
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Your Slack webhook URL

3. Alerts will automatically use Slack channel

## Step 7: Monitor Operator Mode

### View Daily Intelligence

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/daily-intelligence
```

### Check Alert History

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/alerts/history
```

### View Kill Switches

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/kill-switches
```

### View Backups

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/backups
```

## Troubleshooting

### Migration Fails

1. Check `DATABASE_URL` secret is correct
2. Verify database is accessible
3. Check migration SQL syntax
4. Review workflow logs for errors

### Daily Job Fails

1. Check `DATABASE_URL` secret
2. Verify database connection
3. Check backup directory permissions (if using custom BACKUP_DIR)
4. Review workflow logs

### Alerts Not Triggering

1. Verify alert rules are enabled: Check `alert_rules` table
2. Check thresholds are appropriate
3. Verify Slack webhook URL is set (if using Slack)
4. Run alert check manually: `POST /api/v1/operator/alerts/check`

### Kill Switches Not Working

1. Verify kill switch exists: `GET /api/v1/operator/kill-switches`
2. Check kill switch is enabled (`enabled = true`)
3. Verify code checks kill switches before operations
4. Check database connection

## Workflow Files Created

- `.github/workflows/apply-operator-mode-migration.yml` - Applies migration
- `.github/workflows/operator-mode-daily.yml` - Daily job (runs at 2 AM UTC)
- `.github/workflows/operator-mode-setup-alerts.yml` - Sets up default alerts
- `.github/workflows/operator-mode-verification.yml` - Runs verification tests

## NPM Scripts Added

- `npm run operator-mode:daily` - Run daily job locally
- `npm run operator-mode:setup-alerts` - Setup default alerts locally
- `npm run test:operator-mode` - Run verification tests locally

## Next Steps

1. ✅ Migration applied
2. ✅ Default alerts configured
3. ✅ Daily job scheduled
4. ✅ Verification tests passing
5. ⏭️ Monitor daily intelligence reports
6. ⏭️ Customize alert thresholds as needed
7. ⏭️ Set usage ceilings for tenants
8. ⏭️ Test kill switches in staging

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review `docs/OPERATOR_MODE.md` for detailed documentation
3. Check `docs/OPERATOR_MODE_QUICK_START.md` for quick reference
4. Review `docs/INCIDENT_POSTMORTEM_TEMPLATE.md` for incident response
