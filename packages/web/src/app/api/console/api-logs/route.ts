/**
 * API Call Logs API Route
 * 
 * GET - Retrieve API call logs for current tenant (or all tenants if super admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiCallLogs, getApiCallStats } from '@/domain/console/api-logs';
import { requireConsoleApiAccess } from '@/lib/api/console-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Require console access (auth + subscription)
    const accessCheck = await requireConsoleApiAccess(request);
    if (accessCheck) {
      return accessCheck;
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters = {
      tenantId: searchParams.get('tenantId') || undefined,
      userId: searchParams.get('userId') || undefined,
      method: searchParams.get('method') || undefined,
      path: searchParams.get('path') || undefined,
      statusCode: searchParams.get('statusCode') ? parseInt(searchParams.get('statusCode')!) : undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };
    
    // Check if stats requested
    const statsOnly = searchParams.get('stats') === 'true';
    
    if (statsOnly) {
      const stats = await getApiCallStats(filters);
      return NextResponse.json({ stats });
    }
    
    const logs = await getApiCallLogs(filters);
    return NextResponse.json({ logs, count: logs.length });
  } catch (error) {
    console.error('[api-logs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API logs', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
