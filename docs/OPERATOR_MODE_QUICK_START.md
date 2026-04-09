# Operator Mode Quick Start

Quick reference guide for using Operator Mode features.

## Daily Intelligence

View today's operational metrics:

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/daily-intelligence
```

## Set Up Alerts

1. **Create alert rule**:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Error Rate",
    "metric": "error_rate",
    "threshold": 0.05,
    "operator": "gt",
    "severity": "high",
    "channels": ["slack"],
    "enabled": true
  }' \
  https://api.settler.dev/api/v1/operator/alerts/thresholds
```

2. **Configure Slack** (optional):

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

3. **Check alerts manually**:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/alerts/check
```

## Set Usage Ceilings

Limit tenant usage to prevent cost overruns:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-123",
    "billingAccountId": "billing-456",
    "usageType": "ingestions",
    "monthlyLimit": 10000
  }' \
  https://api.settler.dev/api/v1/operator/cost-controls/usage-ceilings
```

## Use Kill Switches

**Disable a connector** (e.g., during incident):

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"reason": "API rate limit exceeded"}' \
  https://api.settler.dev/api/v1/operator/kill-switches/connectors/stripe/disable
```

**Pause background jobs**:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Database maintenance"}' \
  https://api.settler.dev/api/v1/operator/kill-switches/jobs/ingestion/pause
```

**Re-enable**:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/kill-switches/connectors/stripe/enable
```

## Create Backup

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/backups/create
```

## Verify Implementation

### Test 1: Simulated Failure → Alert + Trace ID

1. Create a failed ingestion (or let one fail naturally)
2. Check failed ingestions:

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/failed-ingestions
```

3. Each failed ingestion includes a `traceId` for debugging
4. Check alerts:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/alerts/check
```

### Test 2: Kill Switch Without Redeploy

1. Disable Stripe connector:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -d '{"reason": "Test"}' \
  https://api.settler.dev/api/v1/operator/kill-switches/connectors/stripe/disable
```

2. Attempt to create Stripe source:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stripe Source",
    "type": "connector",
    "connectorType": "stripe"
  }' \
  https://api.settler.dev/api/v1/ingestion/sources
```

3. Should return `503 Service Unavailable` with message: "Connector stripe is currently disabled"

4. Re-enable:

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/kill-switches/connectors/stripe/enable
```

5. Same request should now succeed

## Daily Job Setup

Add to cron (runs daily at 2 AM UTC):

```bash
0 2 * * * cd /path/to/settler && npm run operator-mode-daily
```

Or use a job scheduler (e.g., GitHub Actions, AWS EventBridge).

## Common Tasks

**View all kill switches**:

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/kill-switches
```

**View usage ceilings**:

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/cost-controls/usage-ceilings
```

**View recent backups**:

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/backups?limit=10
```

**View slow endpoints**:

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://api.settler.dev/api/v1/operator/slow-endpoints
```

## Troubleshooting

**Alerts not triggering?**

- Check alert rules are enabled: `GET /api/v1/operator/alerts/thresholds`
- Verify thresholds are appropriate
- Check Slack webhook URL is set

**Kill switch not working?**

- Verify kill switch is enabled: `GET /api/v1/operator/kill-switches`
- Check type and target match exactly
- Ensure code checks kill switches before operations

**Backups failing?**

- Check `BACKUP_DIR` exists and is writable
- Verify `pg_dump` is installed
- Check database credentials

For more details, see [OPERATOR_MODE.md](./OPERATOR_MODE.md).
