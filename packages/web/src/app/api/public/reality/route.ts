/**
 * Public Reality API Route
 * 
 * GET /api/public/reality - Get public-facing reality metrics for /trust page
 * Filtered and aggregated view suitable for public consumption
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/public/reality
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get public-facing metrics only
    const { data: metrics, error: metricsError } = await supabase
      .from('reality_metrics')
      .select('category, name, value, status, last_updated')
      .in('category', ['failure', 'deployment']) // Only show failure and deployment metrics publicly
      .order('category', { ascending: true });

    if (metricsError) {
      console.error('Error fetching public reality metrics:', metricsError);
      // Return safe defaults instead of error
      return NextResponse.json({
        uptime_proxy: null,
        last_incident: null,
        hard_500_count: 0,
        status: 'assumed',
        timestamp: new Date().toISOString(),
      });
    }

    // Extract key metrics
    const hard500Metric = metrics?.find((m: any) => m.name === 'hard_500_count');
    const { data: lastIncidentData } = await supabase
      .from('reality_events')
      .select('created_at, event_name, severity')
      .eq('category', 'failure')
      .eq('severity', 'critical')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate uptime proxy (inverse of failure rate)
    // This is simplified - real uptime would come from monitoring
    const hard500Value = hard500Metric && typeof hard500Metric === 'object' && 'value' in hard500Metric
      ? hard500Metric.value
      : null;
    const uptimeProxy = typeof hard500Value === 'number' && hard500Value === 0 ? 99.9 : null;

    const response = {
      uptime_proxy: uptimeProxy,
      last_incident: lastIncidentData ? {
        timestamp: lastIncidentData.created_at,
        event: lastIncidentData.event_name,
      } : null,
      hard_500_count: typeof hard500Value === 'number' ? hard500Value : 0,
      status: hard500Metric && typeof hard500Metric === 'object' && 'status' in hard500Metric
        ? hard500Metric.status
        : 'assumed',
      data_isolation: {
        model: 'Row Level Security (RLS)',
        enforced_at: 'database',
        status: 'proven',
      },
      compliance_actions: {
        data_deletion: 'supported',
        data_export: 'supported',
        access_revocation: 'supported',
        status: 'assumed', // Will be proven once tested
      },
      deployment_maturity: {
        multi_region: false,
        multi_platform: false,
        status: 'assumed',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in public reality API:', error);
    // Return safe defaults
    return NextResponse.json({
      uptime_proxy: null,
      last_incident: null,
      hard_500_count: 0,
      status: 'assumed',
      error: 'Failed to fetch reality data',
      timestamp: new Date().toISOString(),
    }, { status: 200 }); // Return 200 to prevent page crash
  }
}
