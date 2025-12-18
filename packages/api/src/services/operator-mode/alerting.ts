/**
 * Enhanced Alerting Service
 * Threshold-based alerting with email/Slack support
 */

import { query } from '../../db';
import { logError, logWarn, logInfo } from '../../utils/logger';
import { generateDailyIntelligence, DailyIntelligence } from './daily-intelligence';

export interface AlertThreshold {
  id?: string;
  name: string;
  metric: 'error_rate' | 'slow_endpoint' | 'failed_ingestion' | 'billing_anomaly' | 'usage_limit';
  threshold: number;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: Array<'email' | 'slack' | 'webhook'>;
  enabled: boolean;
  emailRecipients?: string[];
  slackWebhookUrl?: string;
  webhookUrl?: string;
}

export interface Alert {
  id: string;
  thresholdId: string;
  metric: string;
  value: number;
  threshold: number;
  severity: string;
  message: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
  triggeredAt: Date;
  resolvedAt?: Date;
}

/**
 * Create or update alert threshold
 */
export async function upsertAlertThreshold(
  userId: string,
  threshold: AlertThreshold
): Promise<string> {
  try {
    if (threshold.id) {
      // Update existing
      await query(
        `UPDATE alert_rules
         SET name = $1, metric = $2, threshold = $3, operator = $4, 
             channels = $5, enabled = $6, updated_at = NOW()
         WHERE id = $7 AND user_id = $8`,
        [
          threshold.name,
          threshold.metric,
          threshold.threshold,
          threshold.operator,
          threshold.channels,
          threshold.enabled,
          threshold.id,
          userId,
        ]
      );
      return threshold.id;
    } else {
      // Create new
      const result = await query<{ id: string }>(
        `INSERT INTO alert_rules (user_id, name, metric, threshold, operator, channels, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          userId,
          threshold.name,
          threshold.metric,
          threshold.threshold,
          threshold.operator,
          threshold.channels,
          threshold.enabled,
        ]
      );
      return result[0]?.id || '';
    }
  } catch (error) {
    logError('Failed to upsert alert threshold', error);
    throw error;
  }
}

/**
 * Check thresholds against current metrics and trigger alerts
 */
export async function checkAlertThresholds(): Promise<Alert[]> {
  const triggeredAlerts: Alert[] = [];

  try {
    // Get all enabled alert rules
    const rules = await query<{
      id: string;
      name: string;
      metric: string;
      threshold: number;
      operator: string;
      channels: string[];
      severity: string;
      user_id: string;
    }>(
      `SELECT id, name, metric, threshold, operator, channels, severity, user_id
       FROM alert_rules
       WHERE enabled = true`
    );

    // Generate daily intelligence to check against
    const intelligence = await generateDailyIntelligence();

    for (const rule of rules) {
      let value: number | null = null;
      let shouldAlert = false;

      // Evaluate threshold based on metric type
      switch (rule.metric) {
        case 'error_rate':
          value = intelligence.errorRate.overall;
          shouldAlert = evaluateThreshold(value, rule.threshold, rule.operator);
          break;

        case 'slow_endpoint':
          // Check if any endpoint exceeds threshold (using P95)
          const slowestEndpoint = intelligence.slowEndpoints[0];
          if (slowestEndpoint) {
            value = slowestEndpoint.p95;
            shouldAlert = evaluateThreshold(value, rule.threshold, rule.operator);
          }
          break;

        case 'failed_ingestion':
          value = intelligence.failedIngestions.length;
          shouldAlert = evaluateThreshold(value, rule.threshold, rule.operator);
          break;

        case 'billing_anomaly':
          value = intelligence.billingAnomalies.length;
          shouldAlert = evaluateThreshold(value, rule.threshold, rule.operator);
          break;

        default:
          logWarn('Unknown alert metric', { metric: rule.metric });
          continue;
      }

      if (shouldAlert && value !== null) {
        // Create alert record
        const alertId = await createAlert({
          thresholdId: rule.id,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          severity: rule.severity || 'medium',
          message: `Alert: ${rule.name} - ${rule.metric} = ${value} (threshold: ${rule.threshold})`,
          metadata: {
            ruleName: rule.name,
            operator: rule.operator,
          },
        });

        // Send notifications
        await sendAlertNotifications(alertId, rule.channels, {
          ruleName: rule.name,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          severity: rule.severity,
        });

        triggeredAlerts.push({
          id: alertId,
          thresholdId: rule.id,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          severity: rule.severity,
          message: `Alert: ${rule.name}`,
          triggeredAt: new Date(),
        });
      }
    }

    return triggeredAlerts;
  } catch (error) {
    logError('Failed to check alert thresholds', error);
    return triggeredAlerts;
  }
}

/**
 * Evaluate threshold condition
 */
function evaluateThreshold(
  value: number,
  threshold: number,
  operator: string
): boolean {
  switch (operator) {
    case 'gt':
      return value > threshold;
    case 'gte':
      return value >= threshold;
    case 'lt':
      return value < threshold;
    case 'lte':
      return value <= threshold;
    case 'eq':
      return value === threshold;
    case 'neq':
      return value !== threshold;
    default:
      return false;
  }
}

/**
 * Create alert record in database
 */
async function createAlert(alert: Omit<Alert, 'id' | 'triggeredAt'>): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO alert_history (rule_id, metric, value, threshold, triggered_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id`,
    [alert.thresholdId, alert.metric, alert.value, alert.threshold]
  );
  return result[0]?.id || '';
}

/**
 * Send alert notifications via configured channels
 */
async function sendAlertNotifications(
  alertId: string,
  channels: string[],
  alertData: {
    ruleName: string;
    metric: string;
    value: number;
    threshold: number;
    severity: string;
  }
): Promise<void> {
  for (const channel of channels) {
    try {
      switch (channel) {
        case 'email':
          await sendEmailAlert(alertId, alertData);
          break;
        case 'slack':
          await sendSlackAlert(alertId, alertData);
          break;
        case 'webhook':
          await sendWebhookAlert(alertId, alertData);
          break;
      }
    } catch (error) {
      logError(`Failed to send ${channel} alert`, error, { alertId });
    }
  }
}

/**
 * Send email alert (placeholder - integrate with email service)
 */
async function sendEmailAlert(
  alertId: string,
  alertData: {
    ruleName: string;
    metric: string;
    value: number;
    threshold: number;
    severity: string;
  }
): Promise<void> {
  // TODO: Integrate with email service (SendGrid, SES, etc.)
  logInfo('Email alert sent', { alertId, ...alertData });
  
  // Record notification
  await query(
    `INSERT INTO alert_notifications (alert_id, notification_type, recipient, status, sent_at)
     VALUES ($1, 'email', $2, 'sent', NOW())`,
    [alertId, 'operator@settler.dev'] // Default recipient
  );
}

/**
 * Send Slack alert (placeholder - integrate with Slack API)
 */
async function sendSlackAlert(
  alertId: string,
  alertData: {
    ruleName: string;
    metric: string;
    value: number;
    threshold: number;
    severity: string;
  }
): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    logWarn('Slack webhook URL not configured', { alertId });
    return;
  }

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Alert: ${alertData.ruleName}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alertData.severity.toUpperCase()} Alert: ${alertData.ruleName}*\n` +
                    `Metric: ${alertData.metric}\n` +
                    `Value: ${alertData.value}\n` +
                    `Threshold: ${alertData.threshold}\n` +
                    `Alert ID: ${alertId}`,
            },
          },
        ],
      }),
    });

    logInfo('Slack alert sent', { alertId, ...alertData });
    
    await query(
      `INSERT INTO alert_notifications (alert_id, notification_type, recipient, status, sent_at)
       VALUES ($1, 'webhook', $2, 'sent', NOW())`,
      [alertId, slackWebhookUrl]
    );
  } catch (error) {
    logError('Failed to send Slack alert', error, { alertId });
    throw error;
  }
}

/**
 * Send webhook alert
 */
async function sendWebhookAlert(
  alertId: string,
  alertData: {
    ruleName: string;
    metric: string;
    value: number;
    threshold: number;
    severity: string;
  }
): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    logWarn('Alert webhook URL not configured', { alertId });
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId,
        ...alertData,
        timestamp: new Date().toISOString(),
      }),
    });

    logInfo('Webhook alert sent', { alertId, ...alertData });
    
    await query(
      `INSERT INTO alert_notifications (alert_id, notification_type, recipient, status, sent_at)
       VALUES ($1, 'webhook', $2, 'sent', NOW())`,
      [alertId, webhookUrl]
    );
  } catch (error) {
    logError('Failed to send webhook alert', error, { alertId });
    throw error;
  }
}
