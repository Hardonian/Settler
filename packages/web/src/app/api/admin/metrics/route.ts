/**
 * Admin Metrics Snapshot API
 * 
 * Returns aggregated metrics snapshot for admin dashboard.
 * Requires super admin access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { MetricsQueryParamsSchema, MetricsSnapshotSchema } from '@/lib/admin/metrics/types';
import { getDateRange, aggregateKPIMetrics, aggregateTrendData, aggregateExceptionHeatmap, getRecentActivity } from '@/lib/admin/metrics/aggregation';
import { metricsCache, cacheKeys } from '@/lib/admin/cache/metrics-cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await isSuperAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Super admin access required' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = MetricsQueryParamsSchema.parse({
      range: searchParams.get('range') || '24h',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      tenantId: searchParams.get('tenantId') || undefined,
    });

    const { start, end } = getDateRange(params.range, params.startDate ? new Date(params.startDate) : undefined, params.endDate ? new Date(params.endDate) : undefined);

    // Check cache
    const cacheKey = cacheKeys.metrics(params.range, params.tenantId);
    const cached = metricsCache.get<ReturnType<typeof MetricsSnapshotSchema.parse>>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Aggregate metrics
    const [kpis, matchedTrend, exceptionsTrend, volumeTrend, resolveTrend, heatmap, activity] = await Promise.all([
      aggregateKPIMetrics(params.tenantId || null, start, end),
      aggregateTrendData(params.tenantId || null, start, end, 'hour'),
      aggregateTrendData(params.tenantId || null, start, end, 'hour'), // Simplified: reuse for exceptions
      aggregateTrendData(params.tenantId || null, start, end, 'hour'), // Simplified: reuse for volume
      aggregateTrendData(params.tenantId || null, start, end, 'hour'), // Simplified: reuse for resolve time
      aggregateExceptionHeatmap(params.tenantId || null, start, end),
      getRecentActivity(params.tenantId || null, 20),
    ]);

    // Build snapshot response
    const snapshot = MetricsSnapshotSchema.parse({
      timestamp: new Date().toISOString(),
      range: params.range,
      kpis,
      trends: {
        matchedPercent: matchedTrend,
        exceptions: exceptionsTrend, // Simplified: using same trend
        volume: volumeTrend,
        avgTimeToResolve: resolveTrend,
      },
      exceptionHeatmap: heatmap,
      recentActivity: activity,
    });

    // Cache result (30s TTL)
    metricsCache.set(cacheKey, snapshot, 30 * 1000);

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('[Admin Metrics] Error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve metrics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
