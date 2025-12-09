/**
 * Alert Manager
 * Basic alerting system for operational issues
 */
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface Alert {
    id: string;
    type: string;
    severity: AlertSeverity;
    message: string;
    details?: Record<string, unknown>;
    resolved: boolean;
    createdAt: Date;
    resolvedAt?: Date;
}
/**
 * Create an alert
 */
export declare function createAlert(type: string, severity: AlertSeverity, message: string, details?: Record<string, unknown>): Promise<string>;
/**
 * Resolve an alert
 */
export declare function resolveAlert(alertId: string): Promise<void>;
/**
 * Get unresolved alerts
 */
export declare function getUnresolvedAlerts(severity?: AlertSeverity): Promise<Alert[]>;
/**
 * Check system health and create alerts
 */
export declare function checkSystemHealth(): Promise<void>;
//# sourceMappingURL=manager.d.ts.map