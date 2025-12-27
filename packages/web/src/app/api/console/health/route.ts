/**
 * Console Health Check API Route
 * 
 * GET - Check health of console services and API logging
 */

import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/monitoring/health-check';
import { getActiveAlerts, runAllAlertChecks } from '@/lib/monitoring/alerts';
import { publicRoute } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = publicRoute(async function GET() {
  try {
    const health = await performHealthCheck();
    const alerts = await runAllAlertChecks();
    
    return NextResponse.json({
      health,
      alerts: alerts.filter(a => !a.resolved),
      activeAlerts: getActiveAlerts(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[health] Error:', error);
    // Never return 500 - return degraded health status
    return NextResponse.json(
      {
        health: {
          overall: 'degraded',
          checks: [],
          timestamp: new Date().toISOString(),
        },
        alerts: [],
        activeAlerts: [],
        error: 'Unable to complete full health check',
        message: 'Health check services are temporarily unavailable. Basic functionality may be affected.',
        retryable: true,
      },
      { status: 200 }
    );
  }
});;
