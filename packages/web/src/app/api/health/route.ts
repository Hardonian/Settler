/**
 * Global Health Check Endpoint
 * 
 * Comprehensive health check for all critical dependencies.
 * Returns 200 with status details, never throws 500.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      canConnect: boolean;
      error?: string;
    };
    supabase: {
      status: 'ok' | 'error';
      canConnect: boolean;
      canQuery: boolean;
      error?: string;
    };
    environment: {
      status: 'ok' | 'warning';
      missingVars: string[];
    };
  };
}

export async function GET() {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    checks: {
      database: {
        status: 'ok',
        canConnect: false,
      },
      supabase: {
        status: 'ok',
        canConnect: false,
        canQuery: false,
      },
      environment: {
        status: 'ok',
        missingVars: [],
      },
    },
  };

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
  ];
  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
  
  if (missingVars.length > 0) {
    health.checks.environment.status = 'warning';
    health.checks.environment.missingVars = missingVars;
    health.status = 'degraded';
  }

  // Check Prisma/Database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database.canConnect = true;
  } catch (error) {
    health.checks.database.status = 'error';
    health.checks.database.error = error instanceof Error ? error.message : 'Unknown database error';
    health.status = 'degraded';
  }

  // Check Supabase connection
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      health.checks.supabase.status = 'error';
      health.checks.supabase.error = 'Missing Supabase configuration';
      health.status = 'degraded';
    } else {
      const supabase = await createClient();
      
      if (supabase && typeof supabase.from === 'function') {
        health.checks.supabase.canConnect = true;
        
        // Try a simple query
        try {
          const { error: queryError } = await supabase.from('profiles').select('id').limit(1);
          if (!queryError) {
            health.checks.supabase.canQuery = true;
          } else {
            health.checks.supabase.error = queryError.message;
            health.status = 'degraded';
          }
        } catch (queryErr) {
          health.checks.supabase.error = queryErr instanceof Error ? queryErr.message : 'Query failed';
          health.status = 'degraded';
        }
      } else {
        health.checks.supabase.status = 'error';
        health.checks.supabase.error = 'Supabase client not properly initialized';
        health.status = 'degraded';
      }
    }
  } catch (error) {
    health.checks.supabase.status = 'error';
    health.checks.supabase.error = error instanceof Error ? error.message : 'Unknown Supabase error';
    health.status = 'degraded';
  }

  // Determine overall status
  const hasErrors = health.checks.database.status === 'error' || health.checks.supabase.status === 'error';
  if (hasErrors) {
    health.status = 'unhealthy';
  }

  // Always return 200, even if unhealthy, to prevent 500 errors
  return NextResponse.json(health, { status: 200 });
}
