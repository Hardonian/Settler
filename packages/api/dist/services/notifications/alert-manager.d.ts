/**
 * Alert Manager
 *
 * Centralized service for managing and dispatching system alerts.
 * Supports multiple channels (Email, Slack, Webhook) and severity levels.
 */
import { PrismaClient } from '@prisma/client';
export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical"
}
export interface AlertParams {
    tenantId: string;
    type: string;
    message: string;
    severity: AlertSeverity;
    metadata?: Record<string, unknown>;
}
export declare class AlertManager {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Dispatch an alert
     */
    sendAlert(params: AlertParams): Promise<void>;
}
//# sourceMappingURL=alert-manager.d.ts.map