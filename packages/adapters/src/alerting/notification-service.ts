/**
 * Notification Service
 *
 * Multi-channel notification delivery for alerts
 * Supports: Email (Resend), Slack (webhook), PagerDuty (events API)
 */

export type NotificationChannel = "email" | "slack" | "pagerduty" | "webhook";

export interface NotificationPayload {
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  connectorId: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface NotificationConfig {
  channel: NotificationChannel;
  enabled: boolean;
  config: Record<string, string>;
}

export interface EmailConfig {
  to: string[];
  from: string;
  resendApiKey: string;
}

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
}

export interface PagerDutyConfig {
  integrationKey: string;
  severity: "critical" | "error" | "warning" | "info";
}

export class NotificationService {
  private configs: Map<string, NotificationConfig> = new Map();

  constructor() {
    this.loadConfigsFromEnv();
  }

  /**
   * Load notification configurations from environment variables
   */
  private loadConfigsFromEnv(): void {
    // Email via Resend
    if (process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
      this.configs.set("email", {
        channel: "email",
        enabled: true,
        config: {
          resendApiKey: process.env.RESEND_API_KEY,
          from: process.env.ALERT_EMAIL_FROM || "alerts@kilocode.ai",
          to: process.env.ALERT_EMAIL_TO,
        },
      });
    }

    // Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      this.configs.set("slack", {
        channel: "slack",
        enabled: true,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || "#alerts",
          username: process.env.SLACK_USERNAME || "Settler Alerts",
        },
      });
    }

    // PagerDuty
    if (process.env.PAGERDUTY_INTEGRATION_KEY) {
      this.configs.set("pagerduty", {
        channel: "pagerduty",
        enabled: true,
        config: {
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
        },
      });
    }

    // Generic webhook
    if (process.env.ALERT_WEBHOOK_URL) {
      this.configs.set("webhook", {
        channel: "webhook",
        enabled: true,
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
        },
      });
    }
  }

  /**
   * Send notification to all configured channels
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [name, config] of this.configs) {
      if (!config.enabled) continue;

      promises.push(
        this.sendToChannel(config.channel, payload, config.config).catch((error) => {
          console.error(`Failed to send ${name} notification:`, error);
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload,
    config: Record<string, string>
  ): Promise<void> {
    switch (channel) {
      case "email":
        await this.sendEmail(payload, config as unknown as EmailConfig);
        break;
      case "slack":
        await this.sendSlack(payload, config as unknown as SlackConfig);
        break;
      case "pagerduty":
        await this.sendPagerDuty(payload, config as unknown as PagerDutyConfig);
        break;
      case "webhook":
        await this.sendWebhook(payload, config);
        break;
    }
  }

  /**
   * Send email notification via Resend
   */
  private async sendEmail(payload: NotificationPayload, config: EmailConfig): Promise<void> {
    if (!config.resendApiKey) {
      console.warn("Resend API key not configured");
      return;
    }

    const severityEmoji = {
      critical: "🔴",
      warning: "🟡",
      info: "🔵",
    };

    const htmlContent = `
      <h2>${severityEmoji[payload.severity]} ${payload.title}</h2>
      <p><strong>Severity:</strong> ${payload.severity.toUpperCase()}</p>
      <p><strong>Connector:</strong> ${payload.connectorId}</p>
      <p><strong>Tenant:</strong> ${payload.tenantId}</p>
      <p><strong>Time:</strong> ${payload.timestamp.toISOString()}</p>
      <hr/>
      <p>${payload.message}</p>
      ${payload.metadata ? `<pre>${JSON.stringify(payload.metadata, null, 2)}</pre>` : ""}
    `;

    const textContent = `
${severityEmoji[payload.severity]} ${payload.title}

Severity: ${payload.severity.toUpperCase()}
Connector: ${payload.connectorId}
Tenant: ${payload.tenantId}
Time: ${payload.timestamp.toISOString()}

${payload.message}

${payload.metadata ? JSON.stringify(payload.metadata, null, 2) : ""}
    `.trim();

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: config.to,
        subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      throw new Error(`Resend API error: ${resendResponse.status} ${resendError}`);
    }

    const resendBody = (await resendResponse.json()) as { id?: string };
    console.info(`Email notification sent: ${resendBody.id || "unknown"}`);
  }

  /**
   * Send Slack notification via webhook
   */
  private async sendSlack(payload: NotificationPayload, config: SlackConfig): Promise<void> {
    if (!config.webhookUrl) {
      console.warn("Slack webhook URL not configured");
      return;
    }

    const severityColor = {
      critical: "#FF0000",
      warning: "#FFA500",
      info: "#0000FF",
    };

    const slackPayload = {
      channel: config.channel,
      username: config.username,
      attachments: [
        {
          color: severityColor[payload.severity],
          title: payload.title,
          text: payload.message,
          fields: [
            {
              title: "Severity",
              value: payload.severity.toUpperCase(),
              short: true,
            },
            {
              title: "Connector",
              value: payload.connectorId,
              short: true,
            },
            {
              title: "Tenant",
              value: payload.tenantId,
              short: true,
            },
            {
              title: "Time",
              value: payload.timestamp.toISOString(),
              short: true,
            },
          ],
          footer: "Settler Alert System",
          ts: Math.floor(payload.timestamp.getTime() / 1000),
        },
      ],
    };

    if (payload.metadata) {
      const primaryAttachment = slackPayload.attachments[0];
      if (primaryAttachment) {
        primaryAttachment.fields.push({
          title: "Metadata",
          value: "```json\n" + JSON.stringify(payload.metadata, null, 2) + "\n```",
          short: false,
        });
      }
    }

    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.status} ${response.statusText}`);
    }

    console.info("Slack notification sent");
  }

  /**
   * Send PagerDuty notification via Events API
   */
  private async sendPagerDuty(
    payload: NotificationPayload,
    config: PagerDutyConfig
  ): Promise<void> {
    if (!config.integrationKey) {
      console.warn("PagerDuty integration key not configured");
      return;
    }

    // Only send critical and warning to PagerDuty
    if (payload.severity === "info") {
      return;
    }

    const pagerDutySeverity = {
      critical: "critical",
      warning: "warning",
      info: "info",
    };

    const event = {
      routing_key: config.integrationKey,
      event_action: "trigger",
      dedup_key: `${payload.connectorId}:${payload.title}`,
      payload: {
        summary: payload.title,
        severity: pagerDutySeverity[payload.severity],
        source: payload.connectorId,
        component: "settler-sync",
        group: payload.tenantId,
        class: payload.metadata?.error_type || "sync_failure",
        custom_details: {
          message: payload.message,
          connector_id: payload.connectorId,
          tenant_id: payload.tenantId,
          ...payload.metadata,
        },
      },
    };

    const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PagerDuty API error: ${response.status} ${error}`);
    }

    console.info("PagerDuty notification sent");
  }

  /**
   * Send generic webhook notification
   */
  private async sendWebhook(
    payload: NotificationPayload,
    config: Record<string, string>
  ): Promise<void> {
    if (!config.url) {
      console.warn("Webhook URL not configured");
      return;
    }

    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        severity: payload.severity,
        title: payload.title,
        message: payload.message,
        connector_id: payload.connectorId,
        tenant_id: payload.tenantId,
        metadata: payload.metadata,
        timestamp: payload.timestamp.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }

    console.info("Webhook notification sent");
  }

  /**
   * Get enabled channels
   */
  getEnabledChannels(): string[] {
    return Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled)
      .map(([name]) => name);
  }

  /**
   * Check if any notifications are configured
   */
  hasAnyConfiguration(): boolean {
    return this.configs.size > 0;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
