/**
 * Health Check Endpoint
 * 
 * Provides system health status including:
 * - Supabase connectivity
 * - Required environment variables
 * - Database connectivity (if available)
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getTraceId } from '@/lib/observability/trace';
import { logger } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const traceId = await getTraceId(request);
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key] && !process.env[key.replace('NEXT_PUBLIC_', '')]
  );
  
  if (missingEnvVars.length > 0) {
    checks.env = {
      status: 'error',
      message: `Missing: ${missingEnvVars.join(', ')}`,
    };
    overallStatus = 'unhealthy';
  } else {
    checks.env = { status: 'ok' };
  }

  // Check Supabase connectivity
  try {
    const supabase = await createClient();
    const { error } = await Promise.race([
      supabase.from('profiles').select('id').limit(1),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000)
      ),
    ]) as any;
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine for health check
      throw error;
    }
    
    checks.supabase = { status: 'ok' };
  } catch (error) {
    checks.supabase = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
  }

  // Check database connectivity (Prisma) if available
  try {
    const { prisma } = await import('@/shared/db/prismaClient');
    if (prisma && typeof prisma.$queryRaw !== 'undefined') {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        ),
      ]);
      checks.database = { status: 'ok' };
    } else {
      checks.database = {
        status: 'error',
        message: 'Prisma client not available',
      };
      overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    // Database is optional, so don't mark as unhealthy if it fails
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  }

  const statusCode = overallStatus === 'unhealthy' ? 503 : overallStatus === 'degraded' ? 200 : 200;

  // Log health check
  await logger.info('Health check', {
    trace_id: traceId,
    status: overallStatus,
    checks: Object.keys(checks),
  });

  const response = NextResponse.json(
    {
      status: overallStatus,
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );

  response.headers.set('x-trace-id', traceId);
  return response;
}
