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
export async function GET(request: NextRequest) {
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
    const criticalRisks = latestSnapshot?.risks?.filter((r: any) => r.severity === 'critical').length || 0;
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
    const mrr = revenueMetrics?.find((m: any) => m.name === 'mrr')?.value || 0;
    const activeSubscriptions = revenueMetrics?.find((m: any) => m.name === 'active_subscriptions')?.value || 0;
    const churn = revenueMetrics?.find((m: any) => m.name === 'churn')?.value || 0;
    const dau = userMetrics?.find((m: any) => m.name === 'dau')?.value || 0;
    const wau = userMetrics?.find((m: any) => m.name === 'wau')?.value || 0;
    const hard500Count = failureMetrics?.find((m: any) => m.name === 'hard_500_count')?.value || 0;

    // Calculate growth (from delta summary if available)
    let mrrGrowth = null;
    if (latestSnapshot?.delta_summary) {
      const mrrDelta = latestSnapshot.delta_summary['revenue:mrr'];
      if (mrrDelta?.delta?.percent) {
        mrrGrowth = mrrDelta.delta.percent.toFixed(1);
      }
    }

    const response = {
      revenue: {
        mrr: typeof mrr === 'number' ? mrr : 0,
        mrr_growth: mrrGrowth,
        active_subscriptions: typeof activeSubscriptions === 'number' ? activeSubscriptions : 0,
        churn: typeof churn === 'number' ? churn : 0,
        status: revenueMetrics?.find((m: any) => m.name === 'mrr')?.status || 'assumed',
      },
      usage: {
        dau: typeof dau === 'number' ? dau : 0,
        wau: typeof wau === 'number' ? wau : 0,
        active_tenants: 0, // Would come from tenants table
        status: userMetrics?.find((m: any) => m.name === 'dau')?.status || 'assumed',
      },
      reliability: {
        uptime_proxy: hard500Count === 0 ? 99.9 : null,
        failure_events: criticalRisks,
        status: failureMetrics?.find((m: any) => m.name === 'hard_500_count')?.status || 'assumed',
      },
      risk_index: riskIndex,
      evidence_index: evidenceIndex,
      retention: {
        // Placeholder - would come from cohort analysis
        status: 'assumed',
      },
      last_updated: new Date().toISOString(),
      week_start: latestSnapshot?.week_start || null,
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
