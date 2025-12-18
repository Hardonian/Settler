# Operator Mode

Operator Mode enables solo operators and small teams to run Settler at scale with comprehensive observability, automated operations, and proactive alerting.

## Definition of Done

✅ **90% of issues diagnosable without opening code** - Daily intelligence reports provide comprehensive operational visibility

✅ **Routine ops automated** - Daily backups, alert checks, and intelligence generation run automatically

✅ **System warns before customers do** - Threshold-based alerting with email/Slack notifications

## Features

### Daily Intelligence

Daily intelligence reports aggregate key operational metrics:

- **Error Rate Summary**: Overall error rate and breakdown by endpoint
- **Slow Endpoints**: P50, P95, P99 latencies for all endpoints
- **Failed Ingestions**: List of failed ingestion jobs with error messages and trace IDs
- **Billing Anomalies**: Detection of usage spikes and unexpected charges

**API Endpoint**: `GET /api/v1/operator/daily-intelligence?date=2026-01-31`

**Example Response**:
```json
{
  "data": {
    "date": "2026-01-31",
    "errorRate": {
      "overall": 0.012,
      "byEndpoint": [
        {
          "method": "POST",
          "route": "/api/v1/ingestion/upload",
          "errorRate": 0.05,
          "errorCount": 5,
          "totalRequests": 100
        }
      ]
    },
    "slowEndpoints": [
      {
        "method": "POST",
        "route": "/api/v1/reconciliation/run",
        "p50": 1200,
        "p95": 3500,
        "p99": 5000,
        "requestCount": 50
      }
    ],
    "failedIngestions": [
      {
        "ingestionId": "abc-123",
        "sourceId": "source-456",
        "tenantId": "tenant-789",
        "errorMessage": "Connection timeout",
        "failedAt": "2026-01-31T10:30:00Z",
        "traceId": "trace-xyz"
      }
    ],
    "billingAnomalies": [
      {
        "tenantId": "tenant-789",
        "billingAccountId": "billing-123",
        "anomalyType": "usage_spike",
        "currentValue": 10000,
        "expectedValue": 3000,
        "percentageChange": 233.33,
        "detectedAt": "2026-01-31T12:00:00Z"
      }
    ]
  }
}
```

### Alerting

Threshold-based alerting system with configurable rules and multiple notification channels.

**Create Alert Rule**:
```bash
POST /api/v1/operator/alerts/thresholds
{
  "name": "High Error Rate",
  "metric": "error_rate",
  "threshold": 0.05,
  "operator": "gt",
  "severity": "high",
  "channels": ["email", "slack"],
  "enabled": true
}
```

**Check Thresholds**:
```bash
POST /api/v1/operator/alerts/check
```

**Supported Metrics**:
- `error_rate`: Overall error rate (0.0 - 1.0)
- `slow_endpoint`: P95 latency in milliseconds
- `failed_ingestion`: Count of failed ingestions
- `billing_anomaly`: Count of billing anomalies
- `usage_limit`: Usage ceiling exceeded

**Operators**: `gt`, `gte`, `lt`, `lte`, `eq`, `neq`

**Channels**: `email`, `slack`, `webhook`

**Configuration**:
- Set `SLACK_WEBHOOK_URL` environment variable for Slack alerts
- Set `ALERT_WEBHOOK_URL` for custom webhook alerts
- Email alerts sent to `operator@settler.dev` by default (configure via alert rules)

### Cost Controls

#### Usage Ceilings Per Tenant

Set monthly usage limits per tenant to prevent cost overruns:

```bash
POST /api/v1/operator/cost-controls/usage-ceilings
{
  "tenantId": "tenant-123",
  "billingAccountId": "billing-456",
  "usageType": "ingestions",
  "monthlyLimit": 10000
}
```

**Usage Types**:
- `ingestions`: Number of ingestion jobs
- `reconciliations`: Number of reconciliation runs
- `api_requests`: Number of API requests
- `storage`: Storage usage (bytes)

**Check Usage**:
```bash
GET /api/v1/operator/cost-controls/usage-ceilings/:tenantId/:usageType
```

#### Background Job Limits

Limit concurrent background jobs to prevent resource exhaustion:

```bash
POST /api/v1/operator/cost-controls/job-limits
{
  "jobType": "ingestion",
  "maxConcurrent": 20,
  "maxPerTenant": 10
}
```

**Job Types**: `ingestion`, `reconciliation`, `webhook`, `export`

### Kill Switches

Disable connectors or pause background jobs without redeploying:

**Disable Connector**:
```bash
POST /api/v1/operator/kill-switches/connectors/stripe/disable
{
  "reason": "API rate limit exceeded"
}
```

**Enable Connector**:
```bash
POST /api/v1/operator/kill-switches/connectors/stripe/enable
```

**Pause Background Job**:
```bash
POST /api/v1/operator/kill-switches/jobs/ingestion/pause
{
  "reason": "Database maintenance"
}
```

**Resume Background Job**:
```bash
POST /api/v1/operator/kill-switches/jobs/ingestion/resume
```

**List All Kill Switches**:
```bash
GET /api/v1/operator/kill-switches
```

Kill switches are checked automatically:
- Before creating ingestion sources (connector kill switches)
- Before running ingestion jobs (background job kill switches)
- Before running reconciliation jobs
- Before processing webhook deliveries

### Backups

Automated database backups with restore verification:

**Create Backup**:
```bash
POST /api/v1/operator/backups/create
```

**Verify Backup**:
```bash
POST /api/v1/operator/backups/:backupId/verify
```

**List Backups**:
```bash
GET /api/v1/operator/backups?limit=10
```

**Daily Backup Schedule**:
The `runOperatorModeDaily` job automatically creates and verifies backups daily. Configure via cron:

```bash
# Run daily at 2 AM UTC
0 2 * * * /path/to/node /path/to/jobs/operator-mode-daily.js
```

**Backup Storage**:
- Backups stored in `BACKUP_DIR` environment variable (default: `/tmp/backups`)
- Old backups automatically cleaned up after 30 days
- Backup files named: `settler-backup-YYYY-MM-DDTHH-MM-SS.sql`

**Restore Verification**:
Backups are verified by:
1. Creating a test database
2. Restoring the backup to the test database
3. Verifying tables exist
4. Cleaning up the test database

## Daily Job

The operator mode daily job runs automatically and performs:

1. **Generate Daily Intelligence**: Aggregates metrics for the previous day
2. **Check Alert Thresholds**: Evaluates all enabled alert rules and triggers notifications
3. **Schedule Daily Backup**: Creates and verifies database backup

**Run Manually**:
```typescript
import { runOperatorModeDaily } from './jobs/operator-mode-daily';

await runOperatorModeDaily();
```

## Verification

### Simulated Failure Test

1. **Trigger a failure** (e.g., invalid ingestion):
   ```bash
   POST /api/v1/ingestion/upload
   # With invalid CSV data
   ```

2. **Check alert**:
   ```bash
   POST /api/v1/operator/alerts/check
   ```

3. **Verify trace ID**:
   - Check failed ingestions: `GET /api/v1/operator/failed-ingestions`
   - Each failed ingestion includes a `traceId` for debugging

### Kill Switch Test

1. **Disable connector**:
   ```bash
   POST /api/v1/operator/kill-switches/connectors/stripe/disable
   ```

2. **Attempt to use connector**:
   ```bash
   POST /api/v1/ingestion/sources
   {
     "name": "Stripe Source",
     "type": "connector",
     "connectorType": "stripe"
   }
   ```

3. **Verify rejection**:
   - Should return `503 Service Unavailable`
   - Message: "Connector stripe is currently disabled"

4. **Enable connector**:
   ```bash
   POST /api/v1/operator/kill-switches/connectors/stripe/enable
   ```

5. **Verify connector works**:
   - Same request should succeed

## Database Schema

Operator mode uses the following tables:

- `alert_rules`: Alert threshold configurations
- `alert_history`: Triggered alerts
- `tenant_usage_ceilings`: Usage limits per tenant
- `background_job_limits`: Concurrent job limits
- `kill_switches`: Kill switch configurations
- `backup_records`: Backup metadata
- `daily_intelligence`: Cached daily intelligence reports

See migration: `supabase/migrations/20260131000001_operator_mode.sql`

## Permissions

All operator mode endpoints require `ADMIN_READ` or `ADMIN_WRITE` permissions.

## Environment Variables

- `SLACK_WEBHOOK_URL`: Slack webhook URL for alerts
- `ALERT_WEBHOOK_URL`: Custom webhook URL for alerts
- `BACKUP_DIR`: Directory for backup files (default: `/tmp/backups`)

## Monitoring

Operator mode metrics are exposed via Prometheus:

- `operator_daily_intelligence_generated`: Counter of daily intelligence reports
- `operator_alerts_triggered`: Counter of triggered alerts
- `operator_backups_created`: Counter of backups created
- `operator_backups_verified`: Counter of verified backups

## Troubleshooting

### Alerts Not Triggering

1. Check alert rules are enabled: `GET /api/v1/operator/alerts/thresholds`
2. Verify thresholds are appropriate for current metrics
3. Check notification channels are configured (Slack webhook, etc.)

### Kill Switches Not Working

1. Verify kill switch is enabled: `GET /api/v1/operator/kill-switches`
2. Check kill switch type and target match exactly
3. Verify code checks kill switches before operations

### Backups Failing

1. Check `BACKUP_DIR` exists and is writable
2. Verify `pg_dump` is installed and in PATH
3. Check database credentials are correct
4. Review backup records: `GET /api/v1/operator/backups`

## Best Practices

1. **Set Alert Thresholds Early**: Configure alerts before issues occur
2. **Monitor Daily Intelligence**: Review daily reports to catch trends
3. **Use Kill Switches Proactively**: Disable problematic connectors before they cause issues
4. **Test Backups Regularly**: Verify backups can be restored
5. **Set Usage Ceilings**: Prevent cost overruns with usage limits
6. **Limit Background Jobs**: Prevent resource exhaustion with job limits

## Future Enhancements

- [ ] Grafana dashboards for daily intelligence
- [ ] Automated incident response based on alerts
- [ ] Multi-region backup replication
- [ ] Predictive alerting based on trends
- [ ] Cost forecasting and recommendations
