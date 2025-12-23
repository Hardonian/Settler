/**
 * SLA Monitoring Service
 * Handles SLA tracking, metrics, and violations
 */
export type SLAMetricType = "uptime" | "latency_p95" | "latency_p99" | "error_rate" | "support_response";
export interface SLAAgreement {
    id: string;
    tenantId: string;
    slaType: string;
    targetValue: number;
    measurementPeriod: string;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
}
export interface SLAMetric {
    id: string;
    tenantId: string;
    slaAgreementId: string;
    metricType: SLAMetricType;
    measuredValue: number;
    targetValue: number;
    measurementDate: Date;
    measurementPeriod: string;
}
export interface SLAViolation {
    id: string;
    tenantId: string;
    slaAgreementId: string;
    metricType: SLAMetricType;
    measuredValue: number;
    targetValue: number;
    violationDate: Date;
    severity: string;
    acknowledged: boolean;
    resolved: boolean;
}
/**
 * Create SLA agreement
 */
export declare function createSLAAgreement(tenantId: string, slaType: string, targetValue: number, options?: {
    measurementPeriod?: string;
    startDate?: Date;
    endDate?: Date;
}): Promise<string>;
/**
 * Record SLA metric
 */
export declare function recordSLAMetric(tenantId: string, slaAgreementId: string, metricType: SLAMetricType, measuredValue: number, measurementDate: Date, measurementPeriod: string): Promise<string>;
/**
 * Get SLA violations
 */
export declare function getSLAViolations(tenantId: string, filters?: {
    resolved?: boolean;
    acknowledged?: boolean;
    severity?: string;
    limit?: number;
    offset?: number;
}): Promise<SLAViolation[]>;
/**
 * Acknowledge SLA violation
 */
export declare function acknowledgeSLAViolation(tenantId: string, violationId: string, acknowledgedBy: string): Promise<void>;
//# sourceMappingURL=sla-monitoring.d.ts.map