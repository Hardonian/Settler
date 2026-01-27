/**
 * Console Health Check Endpoint
 * 
 * Verifies Console module configuration and connectivity.
 * Returns 200 with status details, never throws 500.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publicRoute } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    env: {
      status: 'ok' | 'missing';
      supabaseUrl: boolean;
      supabaseAnonKey: boolean;
    };
    supabase: {
      status: 'ok' | 'error';
      canConnect: boolean;
      canQuery: boolean;
      error?: string;
    };
    auth: {
      status: 'ok' | 'error' | 'no_session';
      hasSession: boolean;
      error?: string;
    };
    migrations: {
      status: 'ok' | 'warning' | 'error';
      criticalTablesExist: boolean;
      missingTables?: string[];
      error?: string;
    };
  };
  timestamp: string;
}

export const GET = withSecurity(
  publicRoute(async function GET() {
  const health: HealthStatus = {
    status: 'healthy',
    checks: {
      env: {
        status: 'ok',
        supabaseUrl: false,
        supabaseAnonKey: false,
      },
      supabase: {
        status: 'ok',
        canConnect: false,
        canQuery: false,
      },
    auth: {
      status: 'ok',
      hasSession: false,
    },
    migrations: {
      status: 'ok',
      criticalTablesExist: false,
    },
    },
    timestamp: new Date().toISOString(),
  };

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  health.checks.env.supabaseUrl = !!supabaseUrl;
  health.checks.env.supabaseAnonKey = !!supabaseAnonKey;

  if (!supabaseUrl || !supabaseAnonKey) {
    health.checks.env.status = 'missing';
    health.status = 'unhealthy';
    return NextResponse.json(health, { status: 200 }); // Return 200 even if unhealthy
  }

  // Test Supabase connection
  try {
    const supabase = await createClient();
    
    if (!supabase || typeof supabase.from !== 'function') {
      health.checks.supabase.status = 'error';
      health.checks.supabase.error = 'Supabase client not properly initialized';
      health.status = 'degraded';
      return NextResponse.json(health, { status: 200 });
    }

    health.checks.supabase.canConnect = true;

    // Try a simple query to verify connectivity
    try {
      const { error: queryError } = await supabase
        .from('api_keys')
        .select('id')
        .limit(1);

      if (queryError) {
        // If table doesn't exist, that's ok for health check
        if (queryError.code === '42P01' || queryError.message.includes('does not exist')) {
          health.checks.supabase.canQuery = false;
          health.checks.supabase.error = 'api_keys table does not exist (migration may be needed)';
          health.status = 'degraded';
        } else {
          health.checks.supabase.status = 'error';
          health.checks.supabase.error = queryError.message;
          health.status = 'degraded';
        }
      } else {
        health.checks.supabase.canQuery = true;
      }
    } catch (queryErr) {
      health.checks.supabase.status = 'error';
      health.checks.supabase.error = queryErr instanceof Error ? queryErr.message : 'Unknown query error';
      health.status = 'degraded';
    }

    // Check auth session
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        health.checks.auth.status = 'error';
        health.checks.auth.error = authError.message;
        health.status = 'degraded';
      } else if (user) {
        health.checks.auth.hasSession = true;
        health.checks.auth.status = 'ok';
      } else {
        health.checks.auth.status = 'no_session';
        // No session is ok for health check, just informational
      }
    } catch (authErr) {
      health.checks.auth.status = 'error';
      health.checks.auth.error = authErr instanceof Error ? authErr.message : 'Unknown auth error';
      health.status = 'degraded';
    }

    // Check critical tables exist (migration status)
    const criticalTables = ['billing_accounts', 'api_keys', 'tenants', 'usage_events'];
    const missingTables: string[] = [];
    
    for (const table of criticalTables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(0);
        if (tableError && (tableError.code === '42P01' || tableError.message.includes('does not exist'))) {
          missingTables.push(table);
        }
      } catch {
        // Table check failed - might be RLS blocking, that's ok
      }
    }

    if (missingTables.length > 0) {
      health.checks.migrations.status = 'error';
      health.checks.migrations.missingTables = missingTables;
      health.checks.migrations.error = `Missing critical tables: ${missingTables.join(', ')}`;
      health.status = 'degraded';
    } else {
      health.checks.migrations.criticalTablesExist = true;
      health.checks.migrations.status = 'ok';
    }
  } catch {
    health.checks.supabase.status = 'error';
    health.checks.supabase.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'unhealthy';
  }

  // Always return 200, even if unhealthy, to prevent 500 errors
  return NextResponse.json(health, { status: 200 });
}),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
