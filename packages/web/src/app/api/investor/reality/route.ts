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
    const { data: revenueMetricsData } = await supabase
      .from('reality_metrics')
      .select('name, value, status')
      .eq('category', 'revenue');
    const revenueMetrics = (revenueMetricsData || []) as Array<{ name: string; value: any; status: string }>;

    // Get usage metrics
    const { data: userMetricsData } = await supabase
      .from('reality_metrics')
      .select('name, value, status')
      .eq('category', 'user');
    const userMetrics = (userMetricsData || []) as Array<{ name: string; value: any; status: string }>;

    // Get reliability metrics
    const { data: failureMetricsData } = await supabase
      .from('reality_metrics')
      .select('name, value, status')
      .eq('category', 'failure');
    const failureMetrics = (failureMetricsData || []) as Array<{ name: string; value: any; status: string }>;

    // Get latest weekly snapshot for trends
    const { data: latestSnapshotData } = await supabase
      .from('weekly_snapshots')
      .select('week_start, summary, delta_summary, risks')
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    const latestSnapshot = latestSnapshotData as {
      week_start?: string;
      summary?: any;
      delta_summary?: Record<string, any>;
      risks?: Array<{ severity: string }>;
    } | null;

    // Calculate risk index
    const brokenMetrics = revenueMetrics.filter((m) => m.status === 'broken').length;
    const snapshotRisks = latestSnapshot?.risks || [];
    const criticalRisks = snapshotRisks.filter((r) => r.severity === 'critical').length;
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
    const mrrMetric = revenueMetrics.find((m) => m.name === 'mrr');
    const mrr = mrrMetric?.value ?? 0;
    
    const activeSubsMetric = revenueMetrics.find((m) => m.name === 'active_subscriptions');
    const activeSubscriptions = activeSubsMetric?.value ?? 0;
    
    const churnMetric = revenueMetrics.find((m) => m.name === 'churn');
    const churn = churnMetric?.value ?? 0;
    
    const dauMetric = userMetrics.find((m) => m.name === 'dau');
    const dau = dauMetric?.value ?? 0;
    
    const wauMetric = userMetrics.find((m) => m.name === 'wau');
    const wau = wauMetric?.value ?? 0;
    
    const hard500Metric = failureMetrics.find((m) => m.name === 'hard_500_count');
    const hard500Count = hard500Metric?.value ?? 0;

    // Calculate growth (from delta summary if available)
    let mrrGrowth: string | null = null;
    if (latestSnapshot?.delta_summary) {
      const deltaSummary = latestSnapshot.delta_summary;
      const mrrDelta = deltaSummary['revenue:mrr'];
      if (mrrDelta?.delta?.percent !== undefined) {
        mrrGrowth = String(mrrDelta.delta.percent.toFixed(1));
      }
    }

    const response = {
      revenue: {
        mrr: typeof mrr === 'number' ? mrr : 0,
        mrr_growth: mrrGrowth,
        active_subscriptions: typeof activeSubscriptions === 'number' ? activeSubscriptions : 0,
        churn: typeof churn === 'number' ? churn : 0,
        status: mrrMetric?.status ?? 'assumed',
      },
      usage: {
        dau: typeof dau === 'number' ? dau : 0,
        wau: typeof wau === 'number' ? wau : 0,
        active_tenants: 0, // Would come from tenants table
        status: dauMetric?.status ?? 'assumed',
      },
      reliability: {
        uptime_proxy: hard500Count === 0 ? 99.9 : null,
        failure_events: criticalRisks,
        status: hard500Metric?.status ?? 'assumed',
      },
      risk_index: riskIndex,
      evidence_index: evidenceIndex,
      retention: {
        // Placeholder - would come from cohort analysis
        status: 'assumed',
      },
      last_updated: new Date().toISOString(),
      week_start: latestSnapshot?.week_start ?? null,
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
      { status: 200 }
    );
    return addCorrelationHeaders(response, correlationId);
  }
}
