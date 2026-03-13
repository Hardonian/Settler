"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeAlertPayload = sanitizeAlertPayload;
exports.buildNotifierCapabilities = buildNotifierCapabilities;
exports.buildAlertRouter = buildAlertRouter;
exports.createNotifierProviders = createNotifierProviders;
exports.dispatchAlert = dispatchAlert;
const redaction_1 = require("../../utils/redaction");
function sanitizeAlertPayload(payload) {
    const safeSummary = payload.summary.replace(/\s+/g, " ").trim().slice(0, 280);
    let safeOperatorUrl = payload.operatorUrl;
    if (safeOperatorUrl) {
        try {
            const parsed = new URL(safeOperatorUrl);
            parsed.search = "";
            parsed.hash = "";
            safeOperatorUrl = parsed.toString();
        }
        catch {
            safeOperatorUrl = undefined;
        }
    }
    return {
        ...payload,
        summary: safeSummary,
        operatorUrl: safeOperatorUrl,
        metadata: payload.metadata ? (0, redaction_1.redact)(payload.metadata) : undefined,
    };
}
function buildNotifierCapabilities(config) {
    return [
        {
            channel: "slack",
            status: config.slackWebhookUrl ? "configured" : "unavailable",
            reason: config.slackWebhookUrl ? undefined : "SLACK_ALERT_WEBHOOK_URL is not set",
        },
        {
            channel: "teams",
            status: config.teamsWebhookUrl ? "configured" : "unavailable",
            reason: config.teamsWebhookUrl ? undefined : "TEAMS_ALERT_WEBHOOK_URL is not set",
        },
        {
            channel: "telegram",
            status: config.telegramBotToken && config.telegramChatId
                ? "configured"
                : config.telegramBotToken || config.telegramChatId
                    ? "degraded"
                    : "unavailable",
            reason: config.telegramBotToken && config.telegramChatId
                ? undefined
                : "Both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required",
        },
    ];
}
function buildAlertRouter(configuredChannels) {
    return {
        resolveChannels(input) {
            if (input.severity === "critical") {
                return configuredChannels;
            }
            if (input.severity === "warning") {
                return configuredChannels.filter((channel) => channel !== "telegram");
            }
            return configuredChannels.filter((channel) => channel === "slack");
        },
    };
}
function createNotifierProviders(config, fetchImpl = fetch) {
    const providers = [];
    if (config.slackWebhookUrl) {
        providers.push({
            channel: "slack",
            async send(payload) {
                if (config.dryRun)
                    return;
                const safe = sanitizeAlertPayload(payload);
                await fetchImpl(config.slackWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: `🚨 [${safe.severity.toUpperCase()}] ${safe.summary}`,
                        blocks: [
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: `*Alert:* ${safe.alertType}\n` +
                                        `*Alert ID:* ${safe.alertId}\n` +
                                        `*Severity:* ${safe.severity}\n` +
                                        `*Tenant:* ${safe.tenantId ?? "n/a"}\n` +
                                        `*Run:* ${safe.runId ?? "n/a"}\n` +
                                        `*Summary:* ${safe.summary}` +
                                        `${safe.operatorUrl ? `\n*Operator:* ${safe.operatorUrl}` : ""}`,
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
            channel: "teams",
            async send(payload) {
                if (config.dryRun)
                    return;
                const safe = sanitizeAlertPayload(payload);
                await fetchImpl(config.teamsWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        "@type": "MessageCard",
                        "@context": "http://schema.org/extensions",
                        summary: safe.summary,
                        themeColor: safe.severity === "critical"
                            ? "FF0000"
                            : safe.severity === "warning"
                                ? "FFA500"
                                : "0076D7",
                        sections: [
                            {
                                activityTitle: `Settler Alert: ${safe.alertType}`,
                                facts: [
                                    { name: "Alert ID", value: safe.alertId },
                                    { name: "Severity", value: safe.severity },
                                    { name: "Tenant", value: safe.tenantId ?? "n/a" },
                                    { name: "Run", value: safe.runId ?? "n/a" },
                                    { name: "Timestamp", value: safe.timestamp },
                                    ...(safe.operatorUrl ? [{ name: "Operator", value: safe.operatorUrl }] : []),
                                ],
                                text: safe.summary,
                            },
                        ],
                    }),
                });
            },
        });
    }
    if (config.telegramBotToken && config.telegramChatId) {
        providers.push({
            channel: "telegram",
            async send(payload) {
                if (config.dryRun)
                    return;
                const safe = sanitizeAlertPayload(payload);
                const endpoint = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
                await fetchImpl(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: config.telegramChatId,
                        text: [
                            `🚨 Settler Alert`,
                            `Type: ${safe.alertType}`,
                            `Alert ID: ${safe.alertId}`,
                            `Severity: ${safe.severity}`,
                            `Tenant: ${safe.tenantId ?? "n/a"}`,
                            `Run: ${safe.runId ?? "n/a"}`,
                            `Summary: ${safe.summary}`,
                            ...(safe.operatorUrl ? [`Operator: ${safe.operatorUrl}`] : []),
                        ].join("\n"),
                    }),
                });
            },
        });
    }
    return providers;
}
async function dispatchAlert(payload, providers, router) {
    const channelSet = new Set(router.resolveChannels({ severity: payload.severity, alertType: payload.alertType }));
    const results = [];
    for (const provider of providers) {
        if (!channelSet.has(provider.channel)) {
            continue;
        }
        await provider.send(payload);
        results.push({ channel: provider.channel, delivered: true });
    }
    return results;
}
//# sourceMappingURL=notifier-provider.js.map