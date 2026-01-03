import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@settler/adapters/src/metrics/prometheus';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/metrics/prometheus
 * 
 * Exports Prometheus metrics endpoint
 */
export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
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
    appLogger.error('Error exporting metrics', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export metrics',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
