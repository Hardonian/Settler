"use strict";
/**
 * Alert Manager
 *
 * Manages alerts for sync failures and other critical events
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertManager = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class AlertManager {
    supabase;
    rules = [];
    constructor(supabaseUrl, supabaseServiceKey) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        this.loadDefaultRules();
    }
    /**
     * Load default alert rules
     */
    loadDefaultRules() {
        this.rules = [
            {
                id: "consecutive_failures_5",
                condition: "consecutive_failures",
                threshold: 5,
                severity: "warning",
                enabled: true,
            },
            {
                id: "consecutive_failures_10",
                condition: "consecutive_failures",
                threshold: 10,
                severity: "critical",
                enabled: true,
            },
            {
                id: "error_rate_10",
                condition: "error_rate",
                threshold: 10, // 10% error rate
                severity: "warning",
                enabled: true,
            },
            {
                id: "sync_delay_24h",
                condition: "sync_delay",
                threshold: 24 * 60 * 60 * 1000, // 24 hours in ms
                severity: "warning",
                enabled: true,
            },
            {
                id: "rate_limit_hit",
                condition: "rate_limit",
                threshold: 1,
                severity: "info",
                enabled: true,
            },
        ];
    }
    /**
     * Check alerts after sync failure
     */
    async checkSyncFailure(connectorId, tenantId, consecutiveFailures, errorType, errorMessage) {
        const alerts = [];
        // Check consecutive failures rule
        const consecutiveRule = this.rules.find((r) => r.condition === "consecutive_failures" && consecutiveFailures >= r.threshold);
        if (consecutiveRule) {
            const alert = await this.createAlert({
                connectorId,
                tenantId,
                severity: consecutiveRule.severity,
                title: `Sync Failed ${consecutiveFailures} Times`,
                message: `Connector ${connectorId} has failed ${consecutiveFailures} consecutive syncs. Last error: ${errorMessage}`,
                errorType,
                metadata: {
                    consecutive_failures: consecutiveFailures,
                    threshold: consecutiveRule.threshold,
                },
            });
            if (alert)
                alerts.push(alert);
        }
        return alerts;
    }
    /**
     * Check error rate alerts
     */
    async checkErrorRate(connectorId, tenantId, errorRate) {
        const alerts = [];
        const errorRateRule = this.rules.find((r) => r.condition === "error_rate" && errorRate >= r.threshold);
        if (errorRateRule) {
            const alert = await this.createAlert({
                connectorId,
                tenantId,
                severity: errorRateRule.severity,
                title: `High Error Rate: ${errorRate}%`,
                message: `Connector ${connectorId} has an error rate of ${errorRate}%`,
                metadata: {
                    error_rate: errorRate,
                    threshold: errorRateRule.threshold,
                },
            });
            if (alert)
                alerts.push(alert);
        }
        return alerts;
    }
    /**
     * Check sync delay alerts
     */
    async checkSyncDelay(connectorId, tenantId, lastSyncAt) {
        const alerts = [];
        if (!lastSyncAt) {
            return alerts;
        }
        const delay = Date.now() - lastSyncAt.getTime();
        const delayRule = this.rules.find((r) => r.condition === "sync_delay" && delay >= r.threshold);
        if (delayRule) {
            const hoursDelayed = Math.round(delay / (60 * 60 * 1000));
            const alert = await this.createAlert({
                connectorId,
                tenantId,
                severity: delayRule.severity,
                title: `Sync Delayed: ${hoursDelayed} Hours`,
                message: `Connector ${connectorId} last synced ${hoursDelayed} hours ago`,
                metadata: {
                    delay_ms: delay,
                    delay_hours: hoursDelayed,
                    threshold: delayRule.threshold,
                },
            });
            if (alert)
                alerts.push(alert);
        }
        return alerts;
    }
    /**
     * Create alert
     */
    async createAlert(data) {
        try {
            // Check if alert already exists (deduplication)
            const { data: existing } = await this.supabase
                .from("connector_alerts")
                .select("id")
                .eq("connector_id", data.connectorId)
                .eq("tenant_id", data.tenantId)
                .eq("severity", data.severity)
                .is("resolved_at", null)
                .eq("title", data.title)
                .limit(1);
            if (existing && existing.length > 0) {
                return null; // Alert already exists
            }
            // Get connector record
            const { data: connector } = await this.supabase
                .from("connectors")
                .select("id")
                .eq("provider_id", data.connectorId)
                .eq("tenant_id", data.tenantId)
                .single();
            if (!connector) {
                return null;
            }
            // Create alert
            const { data: alert, error } = await this.supabase
                .from("connector_alerts")
                .insert({
                connector_id: connector.id,
                tenant_id: data.tenantId,
                severity: data.severity,
                title: data.title,
                message: data.message,
                error_type: data.errorType,
                metadata: data.metadata || {},
            })
                .select()
                .single();
            if (error || !alert) {
                console.error("Failed to create alert:", error);
                return null;
            }
            // Send notification (email, Slack, etc.)
            await this.sendNotification(alert);
            return alert;
        }
        catch (error) {
            console.error("Error creating alert:", error);
            return null;
        }
    }
    /**
     * Send notification
     * Integrates with Email (Resend), Slack, PagerDuty, and generic webhooks
     */
    async sendNotification(alert) {
        // Log to console
        console.warn(`Alert: [${alert.severity.toUpperCase()}] ${alert.title} - ${alert.message}`);
        // Send to configured notification channels
        const { notificationService } = await Promise.resolve().then(() => __importStar(require("./notification-service.js")));
        if (notificationService.hasAnyConfiguration()) {
            try {
                await notificationService.sendNotification({
                    severity: alert.severity,
                    title: alert.title,
                    message: alert.message,
                    connectorId: alert.connectorId,
                    tenantId: alert.tenantId,
                    metadata: alert.metadata,
                    timestamp: new Date(),
                });
            }
            catch (error) {
                console.error("Failed to send notification:", error);
            }
        }
        // Fallback: Send to generic webhook
        const webhookUrl = process.env.ALERT_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        severity: alert.severity,
                        title: alert.title,
                        message: alert.message,
                        connector_id: alert.connectorId,
                        tenant_id: alert.tenantId,
                        metadata: alert.metadata,
                    }),
                });
            }
            catch (error) {
                console.error("Failed to send webhook notification:", error);
            }
        }
    }
    /**
     * Resolve alert
     */
    async resolveAlert(alertId, resolvedBy) {
        await this.supabase
            .from("connector_alerts")
            .update({
            resolved_at: new Date().toISOString(),
            resolved_by: resolvedBy,
        })
            .eq("id", alertId);
    }
    /**
     * Get active alerts for connector
     */
    async getActiveAlerts(connectorId, tenantId) {
        const { data: connector } = await this.supabase
            .from("connectors")
            .select("id")
            .eq("provider_id", connectorId)
            .eq("tenant_id", tenantId)
            .single();
        if (!connector) {
            return [];
        }
        const { data: alerts } = await this.supabase
            .from("connector_alerts")
            .select("*")
            .eq("connector_id", connector.id)
            .is("resolved_at", null)
            .order("created_at", { ascending: false });
        return (alerts || []);
    }
}
exports.AlertManager = AlertManager;
//# sourceMappingURL=alert-manager.js.map