interface AlertThresholds {
    errorRate: number;
    errorCount: number;
    latencyP95: number;
    databaseConnections: number;
}
interface Alert {
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
}
export declare class AlertManager {
    private thresholds;
    private alertHistory;
    private maxHistory;
    constructor(thresholds?: Partial<AlertThresholds>);
    send(alert: Alert): Promise<void>;
    checkErrorRate(errorCount: number, totalRequests: number, windowMs: number): Promise<void>;
    checkLatency(p95Latency: number): Promise<void>;
    checkDatabaseConnections(utilization: number): Promise<void>;
    getRecentAlerts(limit?: number): Alert[];
}
export declare const alertManager: AlertManager;
export {};
//# sourceMappingURL=alerting.d.ts.map