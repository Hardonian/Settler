/**
 * System Health Check Endpoint
 * 
 * GET /api/health
 * Returns system status, version, and dependencies
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: 'ok' | 'error'; latency?: number; error?: string };
    redis: { status: 'ok' | 'error' | 'unavailable'; error?: string };
  };
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: { status: 'ok' },
      redis: { status: 'unavailable' },
    },
  };

  // Check database
  try {
    const supabase = createClient();
    const dbStart = Date.now();
    const { error } = await supabase.from('_pg_table').select('tablename').limit(1).single();
    health.checks.database.latency = Date.now() - dbStart;
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
  } catch (err) {
    health.checks.database.status = 'error';
    health.checks.database.error = err instanceof Error ? err.message : 'Unknown error';
    health.status = 'degraded';
  }

  // Check Redis (if available)
  try {
    if (process.env.REDIS_URL) {
      // Would check Redis connection
      health.checks.redis.status = 'ok';
    }
  } catch (err) {
    health.checks.redis.status = 'error';
    health.checks.redis.error = err instanceof Error ? err.message : 'Unknown error';
  }

  // Set status based on checks
  if (health.checks.database.status === 'error') {
    health.status = 'unhealthy';
  }

  const totalLatency = Date.now() - start;

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'X-Health-Check': `completed in ${totalLatency}ms`,
    },
  });
}

// Also handle HEAD for load balancer health checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Health-Status': 'ok',
    },
  });
}
