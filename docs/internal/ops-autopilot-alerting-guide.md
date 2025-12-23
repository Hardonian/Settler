# Alerting Setup Guide

**Purpose:** Set up alerts for high error rates and dead-letter jobs

## Alert Types

### 1. High Error Rate Alerts

**Trigger:** Success rate < 95% for any operation  
**Severity:** High  
**Action:** Investigate failures immediately

### 2. Dead-Letter Job Alerts

**Trigger:** Dead-letter count > 0  
**Severity:** Medium  
**Action:** Review dead-letter jobs and fix root cause

### 3. Adapter Error Rate Alerts

**Trigger:** Adapter error rate > 10%  
**Severity:** High  
**Action:** Check external API status and credentials

### 4. Stuck Job Alerts

**Trigger:** Jobs running > 10 minutes  
**Severity:** High  
**Action:** Check worker health and restart if needed

### 5. Quota Exhaustion Alerts

**Trigger:** Quota hit rate > 5%  
**Severity:** Low  
**Action:** Review quota settings and usage patterns

---

## Implementation Options

### Option 1: Built-in Health Check Endpoint

Create a dedicated alerting endpoint:

```typescript
// packages/web/src/app/api/admin/monitoring/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getReliabilityMetrics } from '@/lib/monitoring/reliability-metrics';
import { performHealthCheck } from '@/lib/monitoring/health-check';

export async function GET(request: NextRequest) {
  const health = await performHealthCheck();
  const reliability = await getReliabilityMetrics();
  
  const alerts: Alert[] = [];
  
  // Check error rates
  for (const stats of reliability.operationStats) {
    if (stats.successRate < 0.95) {
      alerts.push({
        severity: 'high',
        type: 'high_error_rate',
        operation: stats.operation,
        successRate: stats.successRate,
        message: `${stats.operation} has success rate ${(stats.successRate * 100).toFixed(1)}%`,
      });
    }
  }
  
  // Check dead-letter jobs
  if (reliability.deadLetterCount > 0) {
    alerts.push({
      severity: 'medium',
      type: 'dead_letter_jobs',
      count: reliability.deadLetterCount,
      message: `${reliability.deadLetterCount} dead-letter jobs require attention`,
    });
  }
  
  // Check adapter error rates
  for (const adapter of reliability.adapterErrorRates) {
    if (adapter.errorRate > 0.10) {
      alerts.push({
        severity: 'high',
        type: 'adapter_error_rate',
        adapter: adapter.adapterType,
        errorRate: adapter.errorRate,
        message: `${adapter.adapterType} has error rate ${(adapter.errorRate * 100).toFixed(1)}%`,
      });
    }
  }
  
  // Check stuck jobs
  const stuckJobs = await checkStuckJobs();
  if (stuckJobs.length > 5) {
    alerts.push({
      severity: 'high',
      type: 'stuck_jobs',
      count: stuckJobs.length,
      message: `${stuckJobs.length} jobs are stuck (>10 minutes)`,
    });
  }
  
  return NextResponse.json({
    alerts,
    criticalCount: alerts.filter(a => a.severity === 'high').length,
    timestamp: new Date().toISOString(),
  });
}
```

### Option 2: Scheduled Alert Check (Cron)

Set up a cron job to check alerts periodically:

```typescript
// packages/web/src/app/api/cron/check-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendSlackAlert, sendEmailAlert, sendPagerDutyAlert } from '@/lib/alerts';

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const alertsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/monitoring/alerts`);
  const { alerts, criticalCount } = await alertsResponse.json();
  
  if (criticalCount > 0) {
    // Send critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'high');
    
    for (const alert of criticalAlerts) {
      await sendPagerDutyAlert({
        severity: 'critical',
        summary: alert.message,
        details: alert,
      });
      
      await sendSlackAlert({
        channel: '#alerts',
        message: `🚨 ${alert.message}`,
        details: alert,
      });
    }
  }
  
  // Send medium severity alerts to Slack
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  if (mediumAlerts.length > 0) {
    await sendSlackAlert({
      channel: '#alerts',
      message: `⚠️ ${mediumAlerts.length} medium severity alerts`,
      details: mediumAlerts,
    });
  }
  
  return NextResponse.json({
    checked: true,
    alertsFound: alerts.length,
    alertsSent: criticalCount + mediumAlerts.length,
  });
}
```

### Option 3: Real-time Alert Webhook

Create a webhook that external services can call:

```typescript
// packages/web/src/app/api/webhooks/reliability-alert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendAlert } from '@/lib/alerts';

export async function POST(request: NextRequest) {
  const { event, data } = await request.json();
  
  // Handle different event types
  switch (event) {
    case 'dead_letter_job':
      await sendAlert({
        severity: 'medium',
        type: 'dead_letter_job',
        message: `Dead-letter job: ${data.jobId}`,
        details: data,
      });
      break;
      
    case 'high_error_rate':
      await sendAlert({
        severity: 'high',
        type: 'high_error_rate',
        message: `High error rate in ${data.operation}`,
        details: data,
      });
      break;
      
    case 'stuck_job':
      await sendAlert({
        severity: 'high',
        type: 'stuck_job',
        message: `Stuck job detected: ${data.jobId}`,
        details: data,
      });
      break;
  }
  
  return NextResponse.json({ received: true });
}
```

---

## Alert Channels

### Slack Integration

```typescript
// packages/web/src/lib/alerts/slack.ts
export async function sendSlackAlert(options: {
  channel: string;
  message: string;
  details?: unknown;
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: options.channel,
      text: options.message,
      attachments: [
        {
          color: 'danger',
          fields: [
            {
              title: 'Details',
              value: JSON.stringify(options.details, null, 2),
              short: false,
            },
          ],
        },
      ],
    }),
  });
}
```

### Email Integration

```typescript
// packages/web/src/lib/alerts/email.ts
import { sendEmail } from '@/lib/email';

export async function sendEmailAlert(options: {
  to: string[];
  subject: string;
  message: string;
  details?: unknown;
}) {
  await sendEmail({
    to: options.to,
    subject: `[Alert] ${options.subject}`,
    html: `
      <h2>${options.subject}</h2>
      <p>${options.message}</p>
      <pre>${JSON.stringify(options.details, null, 2)}</pre>
    `,
  });
}
```

### PagerDuty Integration

```typescript
// packages/web/src/lib/alerts/pagerduty.ts
export async function sendPagerDutyAlert(options: {
  severity: 'critical' | 'error' | 'warning' | 'info';
  summary: string;
  details?: unknown;
}) {
  const integrationKey = process.env.PAGERDUTY_INTEGRATION_KEY;
  if (!integrationKey) return;
  
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      routing_key: integrationKey,
      event_action: 'trigger',
      payload: {
        summary: options.summary,
        severity: options.severity,
        source: 'settler-reliability',
        custom_details: options.details,
      },
    }),
  });
}
```

---

## Alert Thresholds Configuration

Create a configuration file for alert thresholds:

```typescript
// packages/web/src/lib/alerts/thresholds.ts
export const ALERT_THRESHOLDS = {
  errorRate: {
    warning: 0.98,  // 98% success rate
    critical: 0.95, // 95% success rate
  },
  deadLetterJobs: {
    warning: 1,     // 1 dead-letter job
    critical: 10,   // 10 dead-letter jobs
  },
  adapterErrorRate: {
    warning: 0.05,  // 5% error rate
    critical: 0.10, // 10% error rate
  },
  stuckJobs: {
    warning: 3,     // 3 stuck jobs
    critical: 5,    // 5 stuck jobs
  },
  quotaHitRate: {
    warning: 0.01,  // 1% quota hits
    critical: 0.05, // 5% quota hits
  },
};
```

---

## Alert Deduplication

Prevent alert spam by deduplicating alerts:

```typescript
// packages/web/src/lib/alerts/dedupe.ts
const recentAlerts = new Map<string, number>();

export function shouldSendAlert(alertKey: string, cooldownMinutes = 15): boolean {
  const lastSent = recentAlerts.get(alertKey);
  const now = Date.now();
  
  if (!lastSent || now - lastSent > cooldownMinutes * 60 * 1000) {
    recentAlerts.set(alertKey, now);
    return true;
  }
  
  return false;
}

// Usage
const alertKey = `error_rate:${operation}`;
if (shouldSendAlert(alertKey)) {
  await sendAlert({ ... });
}
```

---

## Monitoring Alert Health

Track alert delivery success:

```typescript
// packages/web/src/lib/alerts/metrics.ts
export async function recordAlertSent(alert: {
  type: string;
  severity: string;
  channel: string;
  success: boolean;
}) {
  await prisma.opsEvent.create({
    data: {
      event_type: 'alert_sent',
      metadata: {
        type: alert.type,
        severity: alert.severity,
        channel: alert.channel,
        success: alert.success,
      },
    },
  });
}
```

---

## Setup Steps

1. **Create alert utilities** (`packages/web/src/lib/alerts/`)
   - Slack integration
   - Email integration
   - PagerDuty integration (optional)

2. **Set up environment variables:**
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   PAGERDUTY_INTEGRATION_KEY=...
   ALERT_EMAIL_TO=ops@yourcompany.com
   ```

3. **Create alert endpoint** (`/api/admin/monitoring/alerts`)

4. **Set up cron job** (`/api/cron/check-alerts`)
   - Schedule: Every 5 minutes
   - Verify with `CRON_SECRET`

5. **Test alerts:**
   ```bash
   # Trigger test alert
   curl -X POST https://your-domain.com/api/admin/monitoring/alerts/test
   ```

6. **Monitor alert delivery:**
   - Check Slack channel for alerts
   - Verify email delivery
   - Test PagerDuty integration

---

## Alert Response Playbook

### High Error Rate

1. Check `/api/admin/monitoring/health` for details
2. Review `latestFailures` for error patterns
3. Check external API status (Stripe, Shopify, etc.)
4. Review logs with correlation IDs
5. Fix root cause or implement retry logic

### Dead-Letter Jobs

1. Query dead-letter jobs:
   ```sql
   SELECT * FROM dead_letters ORDER BY created_at DESC LIMIT 10;
   ```
2. Review error messages and stack traces
3. Fix root cause
4. Retry jobs manually if needed

### Stuck Jobs

1. Check worker health
2. Review job logs
3. Kill stuck jobs if needed
4. Restart workers if necessary

---

## Next Steps

1. Implement alert utilities (Slack, Email, PagerDuty)
2. Create alert endpoint
3. Set up cron job for periodic checks
4. Configure alert thresholds
5. Test alert delivery
6. Set up alert response playbook
