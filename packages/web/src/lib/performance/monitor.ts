/**
 * Performance Monitoring
 * 
 * Tracks API performance metrics:
 * - Response times
 * - Latency percentiles
 * - Throughput
 * - Error rates by endpoint
 */

import { prisma } from '@/shared/db/prismaClient';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  p50: number; // Median latency (ms)
  p95: number; // 95th percentile latency (ms)
  p99: number; // 99th percentile latency (ms)
  avg: number; // Average latency (ms)
  requests: number; // Total requests
  errors: number; // Total errors
  errorRate: number; // Error rate (0-1)
  throughput: number; // Requests per second
}

export interface PerformanceSummary {
  overall: {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    totalRequests: number;
    errorRate: number;
    throughput: number;
  };
  byEndpoint: PerformanceMetrics[];
  trends: {
    hourly: Array<{ hour: string; latency: number; requests: number }>;
    daily: Array<{ date: string; latency: number; requests: number }>;
  };
}

/**
 * Calculate performance metrics from usage events
 */
export async function calculatePerformanceMetrics(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<PerformanceSummary> {
  try {
    const events = await prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: { gte: startDate, lte: endDate },
      },
      select: {
        eventType: true,
        timestamp: true,
        metadata: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group by endpoint
    const endpointMetrics: Record<string, {
      latencies: number[];
      requests: number;
      errors: number;
    }> = {};

    for (const event of events) {
      const endpoint = event.eventType;
      if (!endpointMetrics[endpoint]) {
        endpointMetrics[endpoint] = {
          latencies: [],
          requests: 0,
          errors: 0,
        };
      }

      endpointMetrics[endpoint].requests++;

      // Extract latency from metadata
      if (event.metadata && typeof event.metadata === 'object') {
        const latency = (event.metadata as { latency?: number }).latency;
        if (latency) {
          endpointMetrics[endpoint].latencies.push(latency);
        }

        if ('error' in event.metadata) {
          endpointMetrics[endpoint].errors++;
        }
      }
    }

    // Calculate percentiles
    const calculatePercentile = (values: number[], percentile: number): number => {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
<<<<<<< HEAD
      const safeIndex = Math.max(0, Math.min(index, sorted.length - 1));
      return sorted[safeIndex] ?? 0;
=======
      return sorted[Math.max(0, index)] ?? 0;
>>>>>>> origin/main
    };

    const byEndpoint: PerformanceMetrics[] = Object.entries(endpointMetrics).map(
      ([endpoint, data]) => {
        const [method, path] = endpoint.split('-');
        const latencies = data.latencies.length > 0 ? data.latencies : [0];
        const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

        return {
          endpoint: path || endpoint,
          method: method || 'GET',
          p50: calculatePercentile(latencies, 50),
          p95: calculatePercentile(latencies, 95),
          p99: calculatePercentile(latencies, 99),
          avg,
          requests: data.requests,
          errors: data.errors,
          errorRate: data.requests > 0 ? data.errors / data.requests : 0,
          throughput: data.requests / ((endDate.getTime() - startDate.getTime()) / 1000),
        };
      }
    );

    // Calculate overall metrics
    const allLatencies = byEndpoint.flatMap((m) => {
      const endpointData = endpointMetrics[`${m.method}-${m.endpoint}`];
      return endpointData?.latencies || [];
    });

    const totalRequests = byEndpoint.reduce((sum, m) => sum + m.requests, 0);
    const totalErrors = byEndpoint.reduce((sum, m) => sum + m.errors, 0);
    const overallAvgLatency =
      allLatencies.length > 0
        ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length
        : 0;

    // Calculate trends (simplified - would need more data)
    const hourly: Array<{ hour: string; latency: number; requests: number }> = [];
    const daily: Array<{ date: string; latency: number; requests: number }> = [];

    return {
      overall: {
        avgLatency: overallAvgLatency,
        p95Latency: calculatePercentile(allLatencies, 95),
        p99Latency: calculatePercentile(allLatencies, 99),
        totalRequests,
        errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
        throughput: totalRequests / ((endDate.getTime() - startDate.getTime()) / 1000),
      },
      byEndpoint: byEndpoint.sort((a, b) => b.requests - a.requests),
      trends: { hourly, daily },
    };
  } catch (error) {
    console.error('[Performance Monitor] Error:', error);
    return {
      overall: {
        avgLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        totalRequests: 0,
        errorRate: 0,
        throughput: 0,
      },
      byEndpoint: [],
      trends: { hourly: [], daily: [] },
    };
  }
}

/**
 * Get performance metrics for current user
 */
export async function getCurrentUserPerformanceMetrics(
  days: number = 7
): Promise<PerformanceSummary> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) {
      throw new Error('Billing account not found');
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await calculatePerformanceMetrics(
      billingAccount.id,
      startDate,
      endDate
    );
  } catch (error) {
    console.error('[Performance Monitor] Error:', error);
    throw error;
  }
}

import { createClient } from '@/lib/supabase/server';
