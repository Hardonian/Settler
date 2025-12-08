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
import { logInfo } from '../utils/logger';

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
 * In-memory usage tracking service (for development)
 */
class InMemoryUsageTrackingService implements UsageTrackingService {
  private metrics: UsageMetrics[] = [];

  async recordUsage(metrics: UsageMetrics): Promise<void> {
    this.metrics.push(metrics);
    // In production, this would write to database/analytics service
  }

  async getUsage(tenantId: string, startDate: Date, endDate: Date): Promise<UsageMetrics[]> {
    return this.metrics.filter(
      m => m.tenantId === tenantId &&
           m.timestamp >= startDate &&
           m.timestamp <= endDate
    );
  }

  async getUsageSummary(tenantId: string, period: 'day' | 'week' | 'month'): Promise<{
    totalRequests: number;
    totalCost: number;
    byEndpoint: Record<string, number>;
  }> {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const usage = await this.getUsage(tenantId, startDate, now);
    
    const byEndpoint: Record<string, number> = {};
    let totalCost = 0;

    for (const metric of usage) {
      byEndpoint[metric.endpoint] = (byEndpoint[metric.endpoint] || 0) + 1;
      totalCost += metric.cost || 0;
    }

    return {
      totalRequests: usage.length,
      totalCost,
      byEndpoint,
    };
  }
}

let usageTrackingService: UsageTrackingService = new InMemoryUsageTrackingService();

/**
 * Set usage tracking service
 */
export function setUsageTrackingService(service: UsageTrackingService): void {
  usageTrackingService = service;
}

/**
 * Usage tracking middleware
 */
export function usageTrackingMiddleware() {
  return async (req: UsageTrackingRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'anonymous';

    // Capture response
    const originalSend = res.send;
    res.send = function(body) {
      const processingTime = Date.now() - startTime;
      const requestSize = req.headers['content-length'] 
        ? parseInt(req.headers['content-length'], 10) 
        : JSON.stringify(req.body).length;
      const responseSize = typeof body === 'string' 
        ? Buffer.byteLength(body, 'utf8') 
        : JSON.stringify(body).length;

      // Calculate cost (example: $0.001 per 1000 requests + $0.01 per GB processed)
      const cost = (1 / 1000) + ((requestSize + responseSize) / (1024 * 1024 * 1024)) * 0.01;

      const metrics: UsageMetrics = {
        tenantId,
        endpoint: req.path,
        method: req.method,
        timestamp: new Date(),
        requestSize,
        responseSize,
        processingTime,
        cost,
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        },
      };

      req.usageMetrics = metrics;

      // Record asynchronously (don't block response)
      usageTrackingService.recordUsage(metrics).catch(error => {
        logInfo('Failed to record usage metrics', { error });
      });

      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Get usage for current tenant
 */
export async function getCurrentUsage(req: UsageTrackingRequest, period: 'day' | 'week' | 'month' = 'day') {
  const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
  if (!tenantId) {
    return null;
  }
  return usageTrackingService.getUsageSummary(tenantId, period);
}
