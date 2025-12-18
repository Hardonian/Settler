"use strict";
/**
 * Enhanced Alerting Service
 * Threshold-based alerting with email/Slack support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertAlertThreshold = upsertAlertThreshold;
exports.checkAlertThresholds = checkAlertThresholds;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const daily_intelligence_1 = require("./daily-intelligence");
/**
 * Create or update alert threshold
 */
async function upsertAlertThreshold(userId, threshold) {
    try {
        if (threshold.id) {
            // Update existing
            await (0, db_1.query)(`UPDATE alert_rules
         SET name = $1, metric = $2, threshold = $3, operator = $4, 
             channels = $5, enabled = $6, updated_at = NOW()
         WHERE id = $7 AND user_id = $8`, [
                threshold.name,
                threshold.metric,
                threshold.threshold,
                threshold.operator,
                JSON.stringify(threshold.channels),
                threshold.enabled,
                threshold.id,
                userId,
            ]);
            return threshold.id;
        }
        else {
            // Create new
            const result = await (0, db_1.query)(`INSERT INTO alert_rules (user_id, name, metric, threshold, operator, channels, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`, [
                userId,
                threshold.name,
                threshold.metric,
                threshold.threshold,
                threshold.operator,
                JSON.stringify(threshold.channels || []),
                threshold.enabled ?? true,
            ]);
            const newId = result[0]?.id;
            if (!newId) {
                throw new Error('Failed to create alert rule: no ID returned');
            }
            return newId;
        }
    }
    catch (error) {
        (0, logger_1.logError)('Failed to upsert alert threshold', error);
        throw error;
    }
}
/**
 * Check thresholds against current metrics and trigger alerts
 */
async function checkAlertThresholds() {
    const triggeredAlerts = [];
    try {
        // Get all enabled alert rules
        const rules = await (0, db_1.query)(`SELECT id, name, metric, threshold, operator, channels, severity, user_id
       FROM alert_rules
       WHERE enabled = true`);
        if (!rules || rules.length === 0) {
            return triggeredAlerts;
        }
        // Generate daily intelligence to check against
        let intelligence;
        try {
            intelligence = await (0, daily_intelligence_1.generateDailyIntelligence)();
        }
        catch (error) {
            (0, logger_1.logError)('Failed to generate daily intelligence for alert checking', error);
            return triggeredAlerts;
        }
        for (const rule of rules) {
            if (!rule || !rule.id || !rule.metric) {
                (0, logger_1.logWarn)('Invalid alert rule skipped', { rule });
                continue;
            }
            let value = null;
            let shouldAlert = false;
            try {
                // Evaluate threshold based on metric type
                switch (rule.metric) {
                    case 'error_rate':
                        value = intelligence?.errorRate?.overall ?? 0;
                        shouldAlert = evaluateThreshold(value, rule.threshold, rule.operator);
                        break;
                    case 'slow_endpoint':
                        // Check if any endpoint exceeds threshold (using P95)
                        const slowestEndpoint = intelligence?.slowEndpoints?.[0];
                        if (slowestEndpoint && typeof slowestEndpoint.p95 === 'number') {
                            value = slowestEndpoint.p95;
                            shouldAlert = evaluateThreshold(value, rule.threshold, rule.operator);
                        }
                        break;
                    case 'failed_ingestion':
                        value = intelligence?.failedIngestions?.length ?? 0;
                        shouldAlert = evaluateThreshold(value, rule.threshold, rule.operator);
                        break;
                    case 'billing_anomaly':
                        value = intelligence?.billingAnomalies?.length ?? 0;
                        shouldAlert = evaluateThreshold(value, rule.threshold, rule.operator);
                        break;
                    default:
                        (0, logger_1.logWarn)('Unknown alert metric', { metric: rule.metric });
                        continue;
                }
            }
            catch (error) {
                (0, logger_1.logError)('Error evaluating alert rule', error, { ruleId: rule.id, metric: rule.metric });
                continue;
            }
            if (shouldAlert && value !== null && typeof value === 'number' && !isNaN(value)) {
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
    }
    catch (error) {
        (0, logger_1.logError)('Failed to check alert thresholds', error);
        return triggeredAlerts;
    }
}
/**
 * Evaluate threshold condition
 */
function evaluateThreshold(value, threshold, operator) {
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
async function createAlert(alert) {
    try {
        const result = await (0, db_1.query)(`INSERT INTO alert_history (rule_id, metric, value, threshold, triggered_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`, [alert.thresholdId, alert.metric, alert.value, alert.threshold]);
        const alertId = result[0]?.id;
        if (!alertId) {
            throw new Error('Failed to create alert: no ID returned');
        }
        return alertId;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to create alert record', error, { alert });
        throw error;
    }
}
/**
 * Send alert notifications via configured channels
 */
async function sendAlertNotifications(alertId, channels, alertData) {
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
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to send ${channel} alert`, error, { alertId });
        }
    }
}
/**
 * Send email alert (placeholder - integrate with email service)
 */
async function sendEmailAlert(alertId, alertData) {
    // TODO: Integrate with email service (SendGrid, SES, etc.)
    (0, logger_1.logInfo)('Email alert sent', { alertId, ...alertData });
    // Record notification
    await (0, db_1.query)(`INSERT INTO alert_notifications (alert_id, notification_type, recipient, status, sent_at)
     VALUES ($1, 'email', $2, 'sent', NOW())`, [alertId, 'operator@settler.dev'] // Default recipient
    );
}
/**
 * Send Slack alert (placeholder - integrate with Slack API)
 */
async function sendSlackAlert(alertId, alertData) {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhookUrl) {
        (0, logger_1.logWarn)('Slack webhook URL not configured', { alertId });
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
        (0, logger_1.logInfo)('Slack alert sent', { alertId, ...alertData });
        await (0, db_1.query)(`INSERT INTO alert_notifications (alert_id, notification_type, recipient, status, sent_at)
       VALUES ($1, 'webhook', $2, 'sent', NOW())`, [alertId, slackWebhookUrl]);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to send Slack alert', error, { alertId });
        throw error;
    }
}
/**
 * Send webhook alert
 */
async function sendWebhookAlert(alertId, alertData) {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
        (0, logger_1.logWarn)('Alert webhook URL not configured', { alertId });
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
        (0, logger_1.logInfo)('Webhook alert sent', { alertId, ...alertData });
        await (0, db_1.query)(`INSERT INTO alert_notifications (alert_id, notification_type, recipient, status, sent_at)
       VALUES ($1, 'webhook', $2, 'sent', NOW())`, [alertId, webhookUrl]);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to send webhook alert', error, { alertId });
        throw error;
    }
}
//# sourceMappingURL=alerting.js.map