/**
 * Enterprise Alerting & Observability Dispatcher
 * Connects application boundaries to Ops channels (Slack, PagerDuty, Teams)
 */
export class AlertNotifier {
  /**
   * Dispatches an alert to the configured operations channel.
   * Fails gracefully to prevent crashing the critical path.
   */
  static async dispatch(alert: {
    severity: "INFO" | "WARNING" | "CRITICAL";
    category: "INGESTION_DLQ" | "SYSTEM_RECOVERY" | "RATE_LIMIT_BREACH";
    message: string;
    context?: Record<string, any>;
  }): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.OPS_ALERT_WEBHOOK_URL;

    // For OpenTelemetry / Structured Logging ("Open Claw" / ELK stack)
    const logPayload = JSON.stringify({
      timestamp: new Date().toISOString(),
      event_type: "ops_alert",
      ...alert,
    });

    if (alert.severity === "CRITICAL") {
      console.error(`[ALERT][${alert.severity}][${alert.category}] ${logPayload}`);
    } else {
      console.warn(`[ALERT][${alert.severity}][${alert.category}] ${logPayload}`);
    }

    // Dispatch to external channel (e.g., Slack)
    if (!webhookUrl) return;

    try {
      const slackPayload = {
        text: `*🚨 [${alert.severity}] ${alert.category}*\n${alert.message}\n\`\`\`${JSON.stringify(alert.context, null, 2)}\`\`\``,
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload),
      });
    } catch (e) {
      // Swallow errors to ensure the primary business transaction still completes
      console.error("Failed to dispatch external alert payload", e);
    }
  }
}
