export type AlertSeverityLevel = 'info' | 'warning' | 'critical';

export type AlertChannel = 'slack' | 'teams' | 'telegram' | 'email' | 'webhook';

export type CapabilityStatus = 'installed' | 'configured' | 'unavailable' | 'degraded' | 'unsupported';

export interface AlertPayload {
  alertId: string;
  alertType: string;
  severity: AlertSeverityLevel;
  summary: string;
  tenantId?: string;
  runId?: string;
  timestamp: string;
  operatorUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotifierCapability {
  channel: AlertChannel;
  status: CapabilityStatus;
  reason?: string;
}

export interface NotifierProvider {
  channel: AlertChannel;
  send(payload: AlertPayload): Promise<void>;
}

export interface AlertRouter {
  resolveChannels(input: { severity: AlertSeverityLevel; alertType: string }): AlertChannel[];
}

export interface NotifierConfig {
  slackWebhookUrl?: string;
  teamsWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  dryRun?: boolean;
}

export function buildNotifierCapabilities(config: NotifierConfig): NotifierCapability[] {
  return [
    {
      channel: 'slack',
      status: config.slackWebhookUrl ? 'configured' : 'unavailable',
      reason: config.slackWebhookUrl ? undefined : 'SLACK_ALERT_WEBHOOK_URL is not set',
    },
    {
      channel: 'teams',
      status: config.teamsWebhookUrl ? 'configured' : 'unavailable',
      reason: config.teamsWebhookUrl ? undefined : 'TEAMS_ALERT_WEBHOOK_URL is not set',
    },
    {
      channel: 'telegram',
      status:
        config.telegramBotToken && config.telegramChatId
          ? 'configured'
          : config.telegramBotToken || config.telegramChatId
            ? 'degraded'
            : 'unavailable',
      reason:
        config.telegramBotToken && config.telegramChatId
          ? undefined
          : 'Both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required',
    },
  ];
}

export function buildAlertRouter(configuredChannels: AlertChannel[]): AlertRouter {
  return {
    resolveChannels(input) {
      if (input.severity === 'critical') {
        return configuredChannels;
      }

      if (input.severity === 'warning') {
        return configuredChannels.filter((channel) => channel !== 'telegram');
      }

      return configuredChannels.filter((channel) => channel === 'slack');
    },
  };
}

export function createNotifierProviders(
  config: NotifierConfig,
  fetchImpl: typeof fetch = fetch
): NotifierProvider[] {
  const providers: NotifierProvider[] = [];

  if (config.slackWebhookUrl) {
    providers.push({
      channel: 'slack',
      async send(payload) {
        if (config.dryRun) return;

        await fetchImpl(config.slackWebhookUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 [${payload.severity.toUpperCase()}] ${payload.summary}`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text:
                    `*Alert:* ${payload.alertType}\n` +
                    `*Alert ID:* ${payload.alertId}\n` +
                    `*Severity:* ${payload.severity}\n` +
                    `*Tenant:* ${payload.tenantId ?? 'n/a'}\n` +
                    `*Run:* ${payload.runId ?? 'n/a'}\n` +
                    `*Summary:* ${payload.summary}`,
                },
              },
            ],
          }),
        });
      },
    });
  }

  if (config.teamsWebhookUrl) {
    providers.push({
      channel: 'teams',
      async send(payload) {
        if (config.dryRun) return;

        await fetchImpl(config.teamsWebhookUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            summary: payload.summary,
            themeColor: payload.severity === 'critical' ? 'FF0000' : payload.severity === 'warning' ? 'FFA500' : '0076D7',
            sections: [
              {
                activityTitle: `Settler Alert: ${payload.alertType}`,
                facts: [
                  { name: 'Alert ID', value: payload.alertId },
                  { name: 'Severity', value: payload.severity },
                  { name: 'Tenant', value: payload.tenantId ?? 'n/a' },
                  { name: 'Run', value: payload.runId ?? 'n/a' },
                  { name: 'Timestamp', value: payload.timestamp },
                ],
                text: payload.summary,
              },
            ],
          }),
        });
      },
    });
  }

  if (config.telegramBotToken && config.telegramChatId) {
    providers.push({
      channel: 'telegram',
      async send(payload) {
        if (config.dryRun) return;

        const endpoint = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
        await fetchImpl(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.telegramChatId,
            text: [
              `🚨 Settler Alert`,
              `Type: ${payload.alertType}`,
              `Alert ID: ${payload.alertId}`,
              `Severity: ${payload.severity}`,
              `Tenant: ${payload.tenantId ?? 'n/a'}`,
              `Run: ${payload.runId ?? 'n/a'}`,
              `Summary: ${payload.summary}`,
            ].join('\n'),
          }),
        });
      },
    });
  }

  return providers;
}

export async function dispatchAlert(
  payload: AlertPayload,
  providers: NotifierProvider[],
  router: AlertRouter
): Promise<Array<{ channel: AlertChannel; delivered: boolean }>> {
  const channelSet = new Set(router.resolveChannels({ severity: payload.severity, alertType: payload.alertType }));
  const results: Array<{ channel: AlertChannel; delivered: boolean }> = [];

  for (const provider of providers) {
    if (!channelSet.has(provider.channel)) {
      continue;
    }

    await provider.send(payload);
    results.push({ channel: provider.channel, delivered: true });
  }

  return results;
}
