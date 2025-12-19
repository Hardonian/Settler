/**
 * Reality Dashboard API Route
 * 
 * GET /api/console/reality - Get all reality metrics for the Reality Dashboard
 * Admin-only endpoint that reads from canonical reality_metrics table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCorrelationId, addCorrelationHeaders, createLogger } from '@/lib/monitoring/correlation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/console/reality
 */
export async function GET(_request: NextRequest) {
  const correlationId = await getCorrelationId();
  const logger = await createLogger({ route: '/api/console/reality', method: 'GET' });
  
  try {
    logger.info('Reality dashboard request started', { correlationId });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (simplified - would use proper role check)
    const isAdmin = user.user_metadata?.role === 'admin' || user.email?.endsWith('@settler.dev');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get all reality metrics grouped by category
    const { data: metrics, error: metricsError } = await supabase
      .from('reality_metrics')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (metricsError) {
      throw metricsError;
    }

    // Get recent reality events
    const { data: recentEvents, error: eventsError } = await supabase
      .from('reality_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) {
      logger.warn('Failed to fetch recent events', { error: eventsError });
    }

    // Get latest weekly snapshot
    const { data: latestSnapshot, error: snapshotError } = await supabase
      .from('weekly_snapshots')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError && snapshotError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.warn('Failed to fetch latest snapshot', { error: snapshotError });
    }

    // Group metrics by category
    const metricsByCategory: Record<string, any[]> = {};
    if (metrics && Array.isArray(metrics)) {
      metrics.forEach((metric: any) => {
        if (!metricsByCategory[metric.category]) {
          metricsByCategory[metric.category] = [];
        }
        metricsByCategory[metric.category].push(metric);
      });
    }

    // Calculate summary statistics
    const summary = {
      total_metrics: metrics?.length || 0,
      proven_metrics: metrics?.filter((m: any) => m.status === 'proven').length || 0,
      assumed_metrics: metrics?.filter((m: any) => m.status === 'assumed').length || 0,
      broken_metrics: metrics?.filter((m: any) => m.status === 'broken').length || 0,
      proven_percentage: metrics && metrics.length > 0
        ? ((metrics.filter((m: any) => m.status === 'proven').length / metrics.length) * 100).toFixed(1)
        : '0',
    };

    const response = {
      summary,
      metrics_by_category: metricsByCategory,
      recent_events: recentEvents || [],
      latest_snapshot: latestSnapshot || null,
      timestamp: new Date().toISOString(),
    };

    logger.info('Reality metrics fetched successfully', { 
      correlationId,
      metrics_count: metrics?.length || 0,
    });
    
    const httpResponse = NextResponse.json(response);
    return addCorrelationHeaders(httpResponse, correlationId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching reality metrics', {
      correlationId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch reality metrics',
        details: errorMessage,
        data: null,
      },
      { status: 500 }
    );
    return addCorrelationHeaders(response, correlationId);
  }
}
