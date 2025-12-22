import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@settler/adapters/src/metrics/prometheus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/metrics/prometheus
 * 
 * Exports Prometheus metrics endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication for production
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.PROMETHEUS_METRICS_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metricsOutput = metrics.export();
    
    return new NextResponse(metricsOutput, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  } catch (error) {
    console.error('Error exporting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}
