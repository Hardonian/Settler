/**
 * API Call Logs API Route
 * 
 * GET - Retrieve API call logs for current tenant (or all tenants if super admin)
 * 
 * Features:
 * - Rate limiting
 * - Response caching
 * - Request validation
 * - Automatic API logging (excluded from self-logging)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiCallLogs, getApiCallStats } from '@/domain/console/api-logs';
import { requireConsoleApiAccess } from '@/lib/api/console-auth';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { withCache, CACHE_CONFIGS } from '@/lib/cache/api-cache';
import { validatePagination } from '@/lib/security/request-validator';
import { withApiLogging } from '@/middleware/api-logger';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handleGet(request: NextRequest) {
  // Require console access (auth + subscription)
  const accessCheck = await requireConsoleApiAccess(request);
  if (accessCheck) {
    return accessCheck;
  }
  
  const { searchParams } = new URL(request.url);
  
  // Validate pagination
  const pagination = validatePagination({
    limit: searchParams.get('limit') || undefined,
    offset: searchParams.get('offset') || undefined,
  });
  
  if (pagination.errors) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters', errors: pagination.errors },
      { status: 400 }
    );
  }
  
  // Parse filters
  const filters = {
    tenantId: searchParams.get('tenantId') || undefined,
    userId: searchParams.get('userId') || undefined,
    method: searchParams.get('method') || undefined,
    path: searchParams.get('path') || undefined,
    statusCode: searchParams.get('statusCode') ? parseInt(searchParams.get('statusCode')!, 10) : undefined,
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    limit: pagination.limit,
    offset: pagination.offset,
  };
  
  // Validate date range
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    return NextResponse.json(
      { error: 'Invalid date range: startDate must be before endDate' },
      { status: 400 }
    );
  }
  
  // Check if stats requested
  const statsOnly = searchParams.get('stats') === 'true';
  
  try {
    if (statsOnly) {
      const stats = await getApiCallStats(filters);
      return NextResponse.json({ stats });
    }
    
    const logs = await getApiCallLogs(filters);
    return NextResponse.json({ 
      logs, 
      count: logs.length,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error) {
    console.error('[api-logs] Error:', error);
    // Never return 500 - return actionable error message with empty logs
    return NextResponse.json(
      { 
        error: 'Failed to fetch API logs', 
        message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.',
        logs: [],
        count: 0,
        limit: filters.limit,
        offset: filters.offset,
        retryable: true,
      },
      { status: 200 }
    );
  }
}

// Apply middleware: rate limiting -> caching -> handler
export const GET = withRateLimit(
  RATE_LIMIT_CONFIGS.logs,
  withCache(
    CACHE_CONFIGS.logs,
    withApiLogging(handleGet)
  )
);
