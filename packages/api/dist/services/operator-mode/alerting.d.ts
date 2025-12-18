/**
 * Enhanced Alerting Service
 * Threshold-based alerting with email/Slack support
 */
export interface AlertThreshold {
    id?: string;
    name: string;
    metric: 'error_rate' | 'slow_endpoint' | 'failed_ingestion' | 'billing_anomaly' | 'usage_limit';
    threshold: number;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
    severity: 'low' | 'medium' | 'high' | 'critical';
    channels: Array<'email' | 'slack' | 'webhook'>;
    enabled: boolean;
    emailRecipients?: string[];
    slackWebhookUrl?: string;
    webhookUrl?: string;
}
export interface Alert {
    id: string;
    thresholdId: string;
    metric: string;
    value: number;
    threshold: number;
    severity: string;
    message: string;
    traceId?: string;
    metadata?: Record<string, unknown>;
    triggeredAt: Date;
    resolvedAt?: Date;
}
/**
 * Create or update alert threshold
 */
export declare function upsertAlertThreshold(userId: string, threshold: AlertThreshold): Promise<string>;
/**
 * Check thresholds against current metrics and trigger alerts
 */
export declare function checkAlertThresholds(): Promise<Alert[]>;
//# sourceMappingURL=alerting.d.ts.map