/**
 * Board/Investor Reality API Route
 * 
 * GET /api/investor/reality - Get board-level KPI metrics
 * Read-only, privileged access. Powered ONLY by reality_metrics + weekly_snapshots.
 * High signal, low noise - suitable for investor presentations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCorrelationId, addCorrelationHeaders, createLogger } from '@/lib/monitoring/correlation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investor/reality
 */
export async function GET(_request: NextRequest) {
  const correlationId = await getCorrelationId();
  const logger = await createLogger({ route: '/api/investor/reality', method: 'GET' });
  
  try {
    logger.info('Investor reality request started', { correlationId });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has investor/board access
    const isInvestor = user.user_metadata?.role === 'investor' || 
                       user.user_metadata?.role === 'board' ||
                       user.user_metadata?.role === 'admin' ||
                       user.email?.endsWith('@settler.dev');
    
    if (!isInvestor) {
      return NextResponse.json(
        { error: 'Forbidden - Investor/Board access required' },
        { status: 403 }
      );
    }

    // Get revenue metrics
    const { data: revenueMetrics } = await supabase
      .from('reality_metrics')
      .select('name, value, status')
      .eq('category', 'revenue');

    // Get usage metrics
    const { data: userMetrics } = await supabase
      .from('reality_metrics')
      .select('name, value, status')
      .eq('category', 'user');

    // Get reliability metrics
    const { data: failureMetrics } = await supabase
      .from('reality_metrics')
      .select('name, value, status')
      .eq('category', 'failure');

    // Get latest weekly snapshot for trends
    const { data: latestSnapshot } = await supabase
      .from('weekly_snapshots')
      .select('week_start, summary, delta_summary, risks')
      .order('week_start', { ascending: false })
      .limit(1)
      .single();

    // Calculate risk index
    const brokenMetrics = revenueMetrics?.filter((m: any) => m.status === 'broken').length || 0;
    const snapshotRisks = latestSnapshot && typeof latestSnapshot === 'object' && 'risks' in latestSnapshot
      ? (latestSnapshot.risks as any[]) || []
      : [];
    const criticalRisks = snapshotRisks.filter((r: any) => r.severity === 'critical').length || 0;
    const riskIndex = brokenMetrics + criticalRisks;

    // Calculate evidence index (% proven vs assumed)
    const allMetrics = [
      ...(revenueMetrics || []),
      ...(userMetrics || []),
      ...(failureMetrics || []),
    ];
    const provenCount = allMetrics.filter((m: any) => m.status === 'proven').length;
    const evidenceIndex = allMetrics.length > 0 
      ? ((provenCount / allMetrics.length) * 100).toFixed(1)
      : '0';

    // Extract key metrics
    const mrrMetric = revenueMetrics?.find((m: any) => m.name === 'mrr');
    const mrr = mrrMetric && typeof mrrMetric === 'object' && 'value' in mrrMetric ? mrrMetric.value : 0;
    
    const activeSubsMetric = revenueMetrics?.find((m: any) => m.name === 'active_subscriptions');
    const activeSubscriptions = activeSubsMetric && typeof activeSubsMetric === 'object' && 'value' in activeSubsMetric ? activeSubsMetric.value : 0;
    
    const churnMetric = revenueMetrics?.find((m: any) => m.name === 'churn');
    const churn = churnMetric && typeof churnMetric === 'object' && 'value' in churnMetric ? churnMetric.value : 0;
    
    const dauMetric = userMetrics?.find((m: any) => m.name === 'dau');
    const dau = dauMetric && typeof dauMetric === 'object' && 'value' in dauMetric ? dauMetric.value : 0;
    
    const wauMetric = userMetrics?.find((m: any) => m.name === 'wau');
    const wau = wauMetric && typeof wauMetric === 'object' && 'value' in wauMetric ? wauMetric.value : 0;
    
    const hard500Metric = failureMetrics?.find((m: any) => m.name === 'hard_500_count');
    const hard500Count = hard500Metric && typeof hard500Metric === 'object' && 'value' in hard500Metric ? hard500Metric.value : 0;

    // Calculate growth (from delta summary if available)
    let mrrGrowth = null;
    if (latestSnapshot && typeof latestSnapshot === 'object' && 'delta_summary' in latestSnapshot) {
      const deltaSummary = latestSnapshot.delta_summary as Record<string, any>;
      const mrrDelta = deltaSummary['revenue:mrr'];
      if (mrrDelta && typeof mrrDelta === 'object' && 'delta' in mrrDelta) {
        const delta = mrrDelta.delta as { percent?: number };
        if (typeof delta.percent === 'number') {
          mrrGrowth = delta.percent.toFixed(1);
        }
      }
    }

    const response = {
      revenue: {
        mrr: typeof mrr === 'number' ? mrr : 0,
        mrr_growth: mrrGrowth,
        active_subscriptions: typeof activeSubscriptions === 'number' ? activeSubscriptions : 0,
        churn: typeof churn === 'number' ? churn : 0,
        status: mrrMetric && typeof mrrMetric === 'object' && 'status' in mrrMetric ? mrrMetric.status : 'assumed',
      },
      usage: {
        dau: typeof dau === 'number' ? dau : 0,
        wau: typeof wau === 'number' ? wau : 0,
        active_tenants: 0, // Would come from tenants table
        status: dauMetric && typeof dauMetric === 'object' && 'status' in dauMetric ? dauMetric.status : 'assumed',
      },
      reliability: {
        uptime_proxy: hard500Count === 0 ? 99.9 : null,
        failure_events: criticalRisks,
        status: hard500Metric && typeof hard500Metric === 'object' && 'status' in hard500Metric ? hard500Metric.status : 'assumed',
      },
      risk_index: riskIndex,
      evidence_index: evidenceIndex,
      retention: {
        // Placeholder - would come from cohort analysis
        status: 'assumed',
      },
      last_updated: new Date().toISOString(),
      week_start: latestSnapshot && typeof latestSnapshot === 'object' && 'week_start' in latestSnapshot 
        ? (latestSnapshot.week_start as string | null) 
        : null,
    };

    logger.info('Investor metrics fetched successfully', { correlationId });
    
    const httpResponse = NextResponse.json(response);
    return addCorrelationHeaders(httpResponse, correlationId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching investor reality metrics', {
      correlationId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch investor metrics',
        details: errorMessage,
        data: null,
      },
      { status: 500 }
    );
    return addCorrelationHeaders(response, correlationId);
  }
}
