/**
 * Performance Metrics API Route
 * 
 * Returns API performance metrics and monitoring data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserPerformanceMetrics } from '@/lib/performance/monitor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const metrics = await getCurrentUserPerformanceMetrics(days);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('[Performance API] Error:', error);
    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  }
}
