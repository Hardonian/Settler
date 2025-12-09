/**
 * Usage Tracking Middleware
 *
 * Tracks API usage for billing, analytics, and rate limiting
 * Records:
 * - Request counts per tenant
 * - Data processing volumes
 * - Feature usage
 * - Cost attribution
 */
import { Request, Response, NextFunction } from 'express';
export interface UsageMetrics {
    tenantId: string;
    endpoint: string;
    method: string;
    timestamp: Date;
    requestSize?: number;
    responseSize?: number;
    processingTime?: number;
    cost?: number;
    metadata?: Record<string, unknown>;
}
export interface UsageTrackingRequest extends Request {
    usageMetrics?: UsageMetrics;
}
/**
 * Usage tracking service interface
 */
export interface UsageTrackingService {
    recordUsage(metrics: UsageMetrics): Promise<void>;
    getUsage(tenantId: string, startDate: Date, endDate: Date): Promise<UsageMetrics[]>;
    getUsageSummary(tenantId: string, period: 'day' | 'week' | 'month'): Promise<{
        totalRequests: number;
        totalCost: number;
        byEndpoint: Record<string, number>;
    }>;
}
/**
 * Set usage tracking service
 */
export declare function setUsageTrackingService(service: UsageTrackingService): void;
/**
 * Usage tracking middleware
 */
export declare function usageTrackingMiddleware(): (req: UsageTrackingRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get usage for current tenant
 */
export declare function getCurrentUsage(req: UsageTrackingRequest, period?: 'day' | 'week' | 'month'): Promise<{
    totalRequests: number;
    totalCost: number;
    byEndpoint: Record<string, number>;
} | null>;
//# sourceMappingURL=usage-tracking.d.ts.map