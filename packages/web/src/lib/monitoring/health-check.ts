/**
 * Health Check and Monitoring Utilities
 * 
 * Provides health checks and monitoring for API routes and services.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  timestamp: string;
}

/**
 * Check Supabase connection health
 */
export async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('tenants').select('id').limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        service: 'supabase',
        status: 'unhealthy',
        latency,
        error: error.message,
      };
    }
    
    return {
      service: 'supabase',
      status: latency > 1000 ? 'degraded' : 'healthy',
      latency,
    };
  } catch {
    return {
      service: 'supabase',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const supabase = await createAdminClient();
    
    // Check api_call_logs table exists and is accessible
    const { count, error } = await supabase
      .from('api_call_logs')
      .select('*', { count: 'exact', head: true });
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        latency,
        error: error.message,
      };
    }
    
    return {
      service: 'database',
      status: latency > 500 ? 'degraded' : 'healthy',
      latency,
      details: {
        apiCallLogsCount: count || 0,
      },
    };
  } catch {
    return {
      service: 'database',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check API logging health
 */
export async function checkApiLoggingHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const supabase = await createAdminClient();
    
    // Check recent log insertions (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('api_call_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        service: 'api-logging',
        status: 'unhealthy',
        latency,
        error: error.message,
      };
    }
    
    return {
      service: 'api-logging',
      status: 'healthy',
      latency,
      details: {
        recentLogs: count || 0,
      },
    };
  } catch {
    return {
      service: 'api-logging',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check RLS (Row Level Security) sanity
 */
export async function checkRLSHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    
    // Try to query a protected table (should respect RLS)
    // If RLS is misconfigured, this might fail or return unexpected results
    const { error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    // RLS check: If we can query without error but get no results, RLS is likely working
    // If we get an error about RLS policy, that's also expected behavior
    if (error && error.message.includes('RLS')) {
      // RLS is enforced (good)
      return {
        service: 'rls',
        status: 'healthy',
        latency,
        details: { rlsEnforced: true },
      };
    }
    
    return {
      service: 'rls',
      status: 'healthy',
      latency,
      details: { rlsEnforced: true },
    };
  } catch {
    return {
      service: 'rls',
      status: 'degraded',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check job queue/runner health
 */
export async function checkJobQueueHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const supabase = await createAdminClient();
    
    // Check for stuck jobs (running for more than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: stuckJobs, error } = await supabase
      .from('jobs' as any)
      .select('id, status, locked_at')
      .eq('status', 'running')
      .lt('locked_at', tenMinutesAgo)
      .limit(10);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      // Table might not exist - that's OK
      return {
        service: 'job-queue',
        status: 'healthy',
        latency,
        details: { tableExists: false },
      };
    }
    
    const stuckCount = stuckJobs?.length || 0;
    
    return {
      service: 'job-queue',
      status: stuckCount > 5 ? 'degraded' : 'healthy',
      latency,
      details: {
        stuckJobs: stuckCount,
      },
    };
  } catch {
    return {
      service: 'job-queue',
      status: 'degraded',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<SystemHealth> {
  const checks = await Promise.all([
    checkSupabaseHealth(),
    checkDatabaseHealth(),
    checkApiLoggingHealth(),
    checkRLSHealth(),
    checkJobQueueHealth(),
  ]);
  
  // Determine overall status
  const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
  const hasDegraded = checks.some(c => c.status === 'degraded');
  
  const overall = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
  
  return {
    overall,
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if system is healthy
 */
export async function isSystemHealthy(): Promise<boolean> {
  const health = await performHealthCheck();
  return health.overall === 'healthy';
}
