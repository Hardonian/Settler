"use strict";
/**
 * Alert Manager
 *
 * Centralized service for managing and dispatching system alerts.
 * Supports multiple channels (Email, Slack, Webhook) and severity levels.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertManager = exports.AlertSeverity = void 0;
const email_1 = require("../../lib/email");
const logger_1 = require("../../utils/logger");
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
class AlertManager {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Dispatch an alert
     */
    async sendAlert(params) {
        const { tenantId, type, message, severity, metadata } = params;
        try {
            // 1. Log to Database
            await this.prisma.$executeRaw `
        INSERT INTO alerts (
          id, tenant_id, type, message, severity, metadata, created_at
        ) VALUES (
          gen_random_uuid(), ${tenantId}::uuid, ${type}, ${message}, ${severity}, ${metadata ? JSON.stringify(metadata) : '{}'}::jsonb, NOW()
        )
      `.catch((err) => {
                // Fallback if table doesn't exist or other DB error
                (0, logger_1.logError)('Failed to persist alert to DB', err);
            });
            // 2. Fetch Notification Settings
            // In a real system, we'd check user preferences here
            const billingAccount = await this.prisma.billingAccount.findFirst({
                where: { tenantId },
                select: { email: true },
            });
            if (!billingAccount?.email) {
                (0, logger_1.logInfo)(`No email found for tenant ${tenantId}, skipping email alert`);
                return;
            }
            // 3. Send Email (for Warning/Critical)
            if (severity !== AlertSeverity.INFO) {
                await (0, email_1.sendEmail)({
                    to: billingAccount.email,
                    subject: `[${severity.toUpperCase()}] ${type}: ${message}`,
                    text: `An alert was triggered in your Settler account.\n\nType: ${type}\nSeverity: ${severity}\nMessage: ${message}\n\nMetadata: ${JSON.stringify(metadata, null, 2)}`,
                    html: `
            <h2>System Alert</h2>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Severity:</strong> <span style="color: ${severity === 'critical' ? 'red' : 'orange'}">${severity.toUpperCase()}</span></p>
            <p><strong>Message:</strong> ${message}</p>
            <pre>${JSON.stringify(metadata, null, 2)}</pre>
          `,
                });
            }
            // 4. Send Slack/Webhook (Placeholder)
            // await this.sendSlackAlert(...)
            (0, logger_1.logInfo)(`Alert dispatched: ${type} (${severity}) for tenant ${tenantId}`);
        }
        catch (error) {
            (0, logger_1.logError)('Failed to dispatch alert', error);
        }
    }
}
exports.AlertManager = AlertManager;
//# sourceMappingURL=alert-manager.js.map