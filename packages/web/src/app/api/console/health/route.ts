/**
 * Console Health Check API Route
 * 
 * GET - Check health of console services and API logging
 */

import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/monitoring/health-check';
import { getActiveAlerts, runAllAlertChecks } from '@/lib/monitoring/alerts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
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
    return NextResponse.json(
      {
        health: {
          overall: 'unhealthy',
          checks: [],
          timestamp: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
