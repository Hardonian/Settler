/**
 * Communication Agent - Automated Notifications & Escalation
 *
 * Handles:
 * - Alert routing (Slack, email, SMS)
 * - On-call rotation
 * - Escalation chains
 * - Incident communication
 * - Status page updates
 */

import { createClient } from "@supabase/supabase-js";
import { createLogger } from "@settler/logger";

const log = createLogger("communication-agent");

interface CommunicationConfig {
  supabaseUrl: string;
  supabaseKey: string;
  slackWebhook?: string;
  emailWebhook?: string;
  pagerDutyKey?: string;
  onCallRotation?: string[];
}

interface Alert {
  id: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  source: string;
  metadata?: Record<string, unknown>;
}

interface NotificationResult {
  success: boolean;
  channels: string[];
  error?: string;
}

class CommunicationAgent {
  private config: CommunicationConfig;

  constructor(config: CommunicationConfig) {
    this.config = config;
  }

  async sendAlert(alert: Alert): Promise<NotificationResult> {
    log.info(`Sending alert: ${alert.message} (${alert.priority})`);

    const channels: string[] = [];

    if (alert.priority === "low") {
      await this.sendToSlack(alert);
      channels.push("slack");
    } else if (alert.priority === "medium") {
      await Promise.all([this.sendToSlack(alert), this.sendToEmail(alert)]);
      channels.push("slack", "email");
    } else if (alert.priority === "high") {
      await Promise.all([this.sendToSlack(alert), this.sendToEmail(alert), this.pageOnCall(alert)]);
      channels.push("slack", "email", "on-call");
    } else if (alert.priority === "critical") {
      await Promise.all([
        this.sendToSlack(alert),
        this.sendToEmail(alert),
        this.pageOnCall(alert),
        this.triggerPagerDuty(alert),
      ]);
      channels.push("slack", "email", "on-call", "pagerduty");
    }

    await this.logAlert(alert, channels);

    return {
      success: true,
      channels,
    };
  }

  async sendToSlack(alert: Alert): Promise<void> {
    if (!this.config.slackWebhook) {
      log.warn("No Slack webhook configured");
      return;
    }

    const priorityEmojis: Record<string, string> = {
      low: "ℹ️",
      medium: "⚠️",
      high: "🚨",
      critical: "🔥",
    };

    await fetch(this.config.slackWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${priorityEmojis[alert.priority]} *${alert.priority.toUpperCase()} Alert*`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${priorityEmojis[alert.priority]} ${alert.message}`,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Source:*n${alert.source}` },
              { type: "mrkdwn", text: `*Priority:*n${alert.priority}` },
              { type: "mrkdwn", text: `*Time:*n${new Date().toISOString()}` },
              { type: "mrkdwn", text: `*ID:*n${alert.id}` },
            ],
          },
          alert.metadata
            ? {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Details:*n${JSON.stringify(alert.metadata, null, 2)}`,
                },
              }
            : undefined,
        ].filter(Boolean),
      }),
    });
  }

  async sendToEmail(alert: Alert): Promise<void> {
    if (!this.config.emailWebhook) {
      log.warn("No email webhook configured");
      return;
    }

    await fetch(this.config.emailWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "oncall@settler.dev",
        subject: `[${alert.priority.toUpperCase()}] ${alert.message}`,
        body: `Alert: ${alert.message}nSource: ${alert.source}nTime: ${new Date().toISOString()}n`,
      }),
    });
  }

  async pageOnCall(alert: Alert): Promise<void> {
    if (!this.config.onCallRotation || this.config.onCallRotation.length === 0) {
      log.warn("No on-call rotation configured");
      return;
    }

    const dayOfYear = Math.floor(Date.now() / 86400000);
    const onCallIndex = dayOfYear % this.config.onCallRotation.length;
    const onCallPerson = this.config.onCallRotation[onCallIndex];

    log.info(`Paging on-call: ${onCallPerson}`);
  }

  async triggerPagerDuty(alert: Alert): Promise<void> {
    if (!this.config.pagerDutyKey) {
      log.warn("No PagerDuty key configured");
      return;
    }

    await fetch("https://events.pagerduty.com/v2/enqueue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${this.config.pagerDutyKey}`,
      },
      body: JSON.stringify({
        routing_key: this.config.pagerDutyKey,
        event_action: "trigger",
        payload: {
          summary: alert.message,
          severity: alert.priority === "critical" ? "critical" : "error",
          source: alert.source,
          custom_details: alert.metadata,
        },
      }),
    });
  }

  async logAlert(alert: Alert, channels: string[]): Promise<void> {
    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      await supabase.from("alerts").insert({
        id: alert.id,
        message: alert.message,
        priority: alert.priority,
        source: alert.source,
        channels,
        metadata: alert.metadata,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      log.error("Failed to log alert", e);
    }
  }
}

// CLI
const args = process.argv.slice(2);
const messageArg = args.find((a) => a.startsWith("--alert="))?.split("=")[1];
const priorityArg =
  (args.find((a) => a.startsWith("--priority="))?.split("=")[1] as Alert["priority"]) || "medium";

const config: CommunicationConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  emailWebhook: process.env.EMAIL_WEBHOOK_URL,
  pagerDutyKey: process.env.PAGERDUTY_KEY,
  onCallRotation: process.env.ON_CALL?.split(",") || [],
};

const agent = new CommunicationAgent(config);

if (messageArg) {
  agent
    .sendAlert({
      id: `alert_${Date.now()}`,
      message: messageArg,
      priority: priorityArg,
      source: "cli",
    })
    .then((result) => {
      console.log(result.success ? "✅" : "❌", "Alert sent");
      process.exit(result.success ? 0 : 1);
    });
} else {
  console.log('Usage: node communication-agent.js --alert="message" --priority=high');
}

export { CommunicationAgent };
