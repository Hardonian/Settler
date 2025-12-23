/**
 * Reliability Alert Utilities
 * 
 * Functions for sending reliability alerts via various channels.
 */

export interface AlertOptions {
  severity: 'high' | 'medium' | 'low';
  type: string;
  message: string;
  details?: unknown;
}

/**
 * Send alert to Slack
 */
export async function sendSlackAlert(options: AlertOptions): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[Alerts] SLACK_WEBHOOK_URL not configured, skipping Slack alert');
    return;
  }

  try {
    const color = options.severity === 'high' ? 'danger' : options.severity === 'medium' ? 'warning' : 'good';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Reliability Alert: ${options.message}`,
        attachments: [
          {
            color,
            fields: [
              {
                title: 'Severity',
                value: options.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Type',
                value: options.type,
                short: true,
              },
              {
                title: 'Details',
                value: options.details ? JSON.stringify(options.details, null, 2) : 'No additional details',
                short: false,
              },
            ],
            footer: 'Settler Reliability Monitoring',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });
  } catch (error) {
    console.error('[Alerts] Failed to send Slack alert:', error);
  }
}

/**
 * Send alert via email
 */
export async function sendEmailAlert(options: AlertOptions): Promise<void> {
  const alertEmail = process.env.ALERT_EMAIL_TO;
  if (!alertEmail) {
    console.warn('[Alerts] ALERT_EMAIL_TO not configured, skipping email alert');
    return;
  }

  // If you have an email service configured, use it here
  // For now, just log the alert
  console.log('[Email Alert]', {
    to: alertEmail,
    subject: `[${options.severity.toUpperCase()}] Reliability Alert: ${options.type}`,
    message: options.message,
    details: options.details,
  });
}

/**
 * Send alert to PagerDuty
 */
export async function sendPagerDutyAlert(options: AlertOptions): Promise<void> {
  const integrationKey = process.env.PAGERDUTY_INTEGRATION_KEY;
  if (!integrationKey) {
    console.warn('[Alerts] PAGERDUTY_INTEGRATION_KEY not configured, skipping PagerDuty alert');
    return;
  }

  // Only send high severity alerts to PagerDuty
  if (options.severity !== 'high') {
    return;
  }

  try {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        routing_key: integrationKey,
        event_action: 'trigger',
        payload: {
          summary: options.message,
          severity: 'critical',
          source: 'settler-reliability',
          custom_details: options.details || {},
        },
      }),
    });
  } catch (error) {
    console.error('[Alerts] Failed to send PagerDuty alert:', error);
  }
}

/**
 * Send alert to all configured channels
 */
export async function sendAlert(options: AlertOptions): Promise<void> {
  const promises = [
    sendSlackAlert(options),
    sendEmailAlert(options),
    sendPagerDutyAlert(options),
  ];

  await Promise.allSettled(promises);
}

/**
 * Alert deduplication - prevent alert spam
 */
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
