/**
 * Health Check Endpoint
 * 
 * Provides system health status including:
 * - Supabase connectivity
 * - Required environment variables
 * - Database connectivity (if available)
 * - RPC healthcheck (if authenticated)
 * 
 * NON-NEGOTIABLE: Never crashes, always returns JSON
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getTraceId } from '@/lib/observability/trace';
import { logger } from '@/lib/observability/logger';
import { validateSupabaseEnv } from '@/lib/env/validator';
import { publicRoute } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withSecurity(
  publicRoute(async function GET(request: NextRequest) {
  const traceId = await getTraceId(request);
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check environment variables using validator
  const envValidation = validateSupabaseEnv();
  if (!envValidation.isValid) {
    checks.env = {
      status: 'error',
      message: `Missing: ${envValidation.missing.join(', ')}`,
    };
    overallStatus = 'unhealthy';
  } else {
    checks.env = { status: 'ok' };
  }

  // Check Supabase client initialization
  let supabaseClientInit = false;
  let rpcAttempted = false;
  let rpcResult: { success: boolean; error?: string } | null = null;
  
  try {
    const supabase = await createClient();
    
    // Verify client is initialized (not empty mock)
    if (supabase && typeof supabase.from === 'function') {
      supabaseClientInit = true;
      checks.supabaseClientInit = { status: 'ok' };
      
      // Try a simple query to verify connectivity
      // Use Promise.race with timeout to prevent hanging
      try {
        const queryResult = await Promise.race([
          supabase.from('profiles').select('id').limit(1),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Supabase query timeout')), 5000)
          ),
        ]);
        
        // Check if result has error property
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = (queryResult as any)?.error;
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" which is fine for health check
          throw error;
        }
        
        checks.supabase = { status: 'ok' };
      } catch (queryError) {
        checks.supabase = {
          status: 'error',
          message: queryError instanceof Error ? queryError.message : 'Query failed',
        };
        overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
      }
      
      // Try RPC healthcheck (may fail for anon users due to RLS - that's OK)
      rpcAttempted = true;
      try {
        const rpcResult_race = await Promise.race([
          supabase.rpc('healthcheck'),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout')), 3000)
          ),
        ]);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rpcError = (rpcResult_race as any)?.error;
        if (rpcError) {
          // RPC might be blocked by RLS for anon users - this is expected
          rpcResult = {
            success: false,
            error: rpcError.message || 'RPC call failed (may be RLS blocked)',
          };
          checks.rpc = {
            status: 'error',
            message: 'RPC blocked or unavailable (expected for anon users)',
          };
        } else {
          rpcResult = { success: true };
          checks.rpc = { status: 'ok' };
        }
      } catch (rpcError) {
        rpcResult = {
          success: false,
          error: rpcError instanceof Error ? rpcError.message : 'RPC call failed',
        };
        checks.rpc = {
          status: 'error',
          message: 'RPC unavailable (may be RLS blocked for anon)',
        };
        // RPC failure doesn't affect overall health - it's expected for anon
      }
    } else {
      checks.supabaseClientInit = {
        status: 'error',
        message: 'Supabase client initialization failed',
      };
      checks.supabase = {
        status: 'error',
        message: 'Client not initialized',
      };
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    checks.supabaseClientInit = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Initialization failed',
    };
    checks.supabase = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    overallStatus = 'unhealthy';
  }

  // Check database connectivity (Prisma) if available - optional
  try {
    const { prisma } = await import('@/shared/db/prismaClient');
    if (prisma && typeof prisma.$queryRaw !== 'undefined') {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        ),
      ]);
      checks.database = { status: 'ok' };
    } else {
      checks.database = {
        status: 'error',
        message: 'Prisma client not available',
      };
      // Database is optional, don't mark as unhealthy
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    // Database is optional, so don't mark as unhealthy if it fails
  }

  // Backend contract verification (server-only, using service role)
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const serviceClient = await createAdminClient();

      // Quick checks for critical tables
      const criticalTables = ['tenants', 'billing_accounts', 'subscriptions'];
      const tableChecks: Record<string, boolean> = {};

      for (const table of criticalTables) {
        try {
          const { error } = await Promise.race([
            serviceClient.from(table).select('id').limit(0),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Table check timeout')), 3000)
            ),
          ]);

          tableChecks[table] = !error || error.code === 'PGRST116'; // PGRST116 = no rows, which is fine
        } catch (error) {
          tableChecks[table] = false;
        }
      }

      const allTablesOk = Object.values(tableChecks).every(v => v);
      checks.backendContract = {
        status: allTablesOk ? 'ok' : 'error',
        message: allTablesOk 
          ? 'Critical tables accessible' 
          : `Missing tables: ${Object.entries(tableChecks).filter(([_, ok]) => !ok).map(([t]) => t).join(', ')}`,
      };

      if (!allTablesOk) {
        overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
      }
    } else {
      checks.backendContract = {
        status: 'error',
        message: 'Service role key not available for backend verification',
      };
    }
  } catch (error) {
    checks.backendContract = {
      status: 'error',
      message: `Backend verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
    // Don't mark as unhealthy - this is diagnostic only
  }

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  // Log health check (non-blocking)
  try {
    await logger.info('Health check', {
      trace_id: traceId,
      status: overallStatus,
      checks: Object.keys(checks),
    });
  } catch (logError) {
    // Don't fail health check if logging fails
    // Use dynamic import to avoid circular dependencies
    import('@/lib/utils/logger').then(({ appLogger }) => {
      appLogger.warn('[Health] Failed to log health check', { error: logError });
    }).catch(() => {
      // Silent fail if logger unavailable
    });
  }

  const response = NextResponse.json(
    {
      ok: overallStatus === 'healthy',
      status: overallStatus,
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
      },
      supabaseClientInit,
      rpc: {
        attempted: rpcAttempted,
        result: rpcResult,
      },
      checks,
    },
    { status: statusCode }
  );

  response.headers.set('x-trace-id', traceId);
  return response;
}),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
