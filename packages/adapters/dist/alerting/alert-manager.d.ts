/**
 * Alert Manager
 *
 * Manages alerts for sync failures and other critical events
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';
export interface Alert {
    id: string;
    connectorId: string;
    tenantId: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    errorType?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface AlertRule {
    id: string;
    connectorId?: string;
    condition: 'consecutive_failures' | 'error_rate' | 'sync_delay' | 'rate_limit';
    threshold: number;
    severity: AlertSeverity;
    enabled: boolean;
}
export declare class AlertManager {
    private supabase;
    private rules;
    constructor(supabaseUrl: string, supabaseServiceKey: string);
    /**
     * Load default alert rules
     */
    private loadDefaultRules;
    /**
     * Check alerts after sync failure
     */
    checkSyncFailure(connectorId: string, tenantId: string, consecutiveFailures: number, errorType: string, errorMessage: string): Promise<Alert[]>;
    /**
     * Check error rate alerts
     */
    checkErrorRate(connectorId: string, tenantId: string, errorRate: number): Promise<Alert[]>;
    /**
     * Check sync delay alerts
     */
    checkSyncDelay(connectorId: string, tenantId: string, lastSyncAt: Date | null): Promise<Alert[]>;
    /**
     * Create alert
     */
    private createAlert;
    /**
     * Send notification
     */
    private sendNotification;
    /**
     * Resolve alert
     */
    resolveAlert(alertId: string, resolvedBy: string): Promise<void>;
    /**
     * Get active alerts for connector
     */
    getActiveAlerts(connectorId: string, tenantId: string): Promise<Alert[]>;
}
//# sourceMappingURL=alert-manager.d.ts.map