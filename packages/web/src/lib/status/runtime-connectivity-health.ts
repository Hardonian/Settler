/**
 * Canonical runtime connectivity probes for public status surfaces.
 * Reports current reachability only — no historical uptime, SLA, or incident fiction.
 */

import { validateSupabaseEnv } from '@/lib/env/validator';

export type ConnectivityCheckName = 'database' | 'supabase' | 'runtime_env';

export type ConnectivityCheckResult = {
  ok: boolean;
  status: 'healthy' | 'degraded';
  /** Machine-visible reason when not ok (safe for operators, no secrets). */
  reason?: string;
};

export type RuntimeConnectivityHealth = {
  overall: 'healthy' | 'degraded';
  checks: Record<ConnectivityCheckName, ConnectivityCheckResult>;
  degraded_reasons: string[];
  timestamp: string;
};

async function checkDatabaseHealth(): Promise<ConnectivityCheckResult> {
  try {
    const { prisma } = await import('@/shared/db/prismaClient');
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, status: 'healthy' };
  } catch {
    return {
      ok: false,
      status: 'degraded',
      reason: 'database_query_failed',
    };
  }
}

async function checkSupabaseHealth(): Promise<ConnectivityCheckResult> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      return {
        ok: false,
        status: 'degraded',
        reason: 'supabase_users_probe_failed',
      };
    }
    return { ok: true, status: 'healthy' };
  } catch {
    return {
      ok: false,
      status: 'degraded',
      reason: 'supabase_client_unavailable',
    };
  }
}

function checkApplicationRuntimeHealth(): ConnectivityCheckResult {
  try {
    const envValidation = validateSupabaseEnv();
    if (!envValidation.isValid) {
      return {
        ok: false,
        status: 'degraded',
        reason: 'supabase_env_invalid_or_incomplete',
      };
    }
    return { ok: true, status: 'healthy' };
  } catch {
    return {
      ok: false,
      status: 'degraded',
      reason: 'runtime_env_validation_threw',
    };
  }
}

function mergeConnectivityResults(
  database: ConnectivityCheckResult,
  supabase: ConnectivityCheckResult,
  runtimeEnv: ConnectivityCheckResult
): RuntimeConnectivityHealth {
  const checks: Record<ConnectivityCheckName, ConnectivityCheckResult> = {
    database,
    supabase,
    runtime_env: runtimeEnv,
  };

  const degraded_reasons = Object.entries(checks)
    .filter(([, c]) => !c.ok && c.reason)
    .map(([name, c]) => `${name}:${c.reason}`);

  const anyFailed = Object.values(checks).some((c) => !c.ok);
  const overall = anyFailed ? 'degraded' : 'healthy';

  return {
    overall,
    checks,
    degraded_reasons,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Full async probe: database + Supabase + required env for Supabase.
 */
export async function probeRuntimeConnectivityHealth(): Promise<RuntimeConnectivityHealth> {
  const [database, supabase] = await Promise.all([
    checkDatabaseHealth(),
    checkSupabaseHealth(),
  ]);
  const runtimeEnv = checkApplicationRuntimeHealth();
  return mergeConnectivityResults(database, supabase, runtimeEnv);
}

/**
 * Degraded envelope when the probe itself throws (never fabricate "healthy").
 */
export function connectivityHealthProbeFailed(timestamp: string): RuntimeConnectivityHealth {
  const degraded: ConnectivityCheckResult = {
    ok: false,
    status: 'degraded',
    reason: 'health_probe_exception',
  };
  return {
    overall: 'degraded',
    checks: {
      database: degraded,
      supabase: degraded,
      runtime_env: degraded,
    },
    degraded_reasons: [
      'database:health_probe_exception',
      'supabase:health_probe_exception',
      'runtime_env:health_probe_exception',
    ],
    timestamp,
  };
}
