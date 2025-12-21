/**
 * SLA Tracking Service
 *
 * Tracks support response times and SLA compliance.
 * Enforces SLA commitments for paid tiers.
 */
interface SLAPolicy {
    tier: string;
    response_time_hours: number;
    resolution_time_hours?: number;
    uptime_percentage?: number;
}
/**
 * Get SLA policy for tier
 */
export declare function getSLAPolicy(tierId: string): SLAPolicy;
/**
 * Check if tier has SLA
 */
export declare function hasSLA(tierId: string): boolean;
/**
 * Record support ticket creation
 */
export declare function recordSupportTicket(billingAccountId: string, ticketId: string, tierId: string, priority?: 'low' | 'medium' | 'high' | 'critical'): Promise<{
    sla_applies: boolean;
    sla_hours: number;
}>;
/**
 * Record support ticket response
 */
export declare function recordSupportResponse(ticketId: string, respondedAt: Date): Promise<{
    sla_met: boolean;
    response_time_hours: number;
    sla_hours: number;
}>;
/**
 * Get SLA compliance metrics for billing account
 */
export declare function getSLAComplianceMetrics(billingAccountId: string, startDate: Date, endDate: Date): Promise<{
    total_tickets: number;
    sla_met: number;
    sla_missed: number;
    sla_percentage: number;
    avg_response_time_hours: number;
}>;
/**
 * Check for SLA violations and alert
 */
export declare function checkSLAViolations(): Promise<{
    violations: number;
    alerts_sent: number;
}>;
export {};
//# sourceMappingURL=tracker.d.ts.map