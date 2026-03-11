/**
 * Admin Monitoring Health API Route
 * 
 * Enhanced with reliability metrics:
 * - Latest failures
 * - Dead-letter jobs
 * - Adapter status
 * - Latency spikes
 * - Per-tenant throttling events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { getOperationStats, getAdapterErrorRates } from '@/lib/monitoring/reliability-metrics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    // CRITICAL: Require super admin access
    const adminCheck = await isSuperAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();

    // Get basic system metrics
    const { data: customers } = await supabase
      .from('billing_accounts')
      .select('id, status')
      .eq('status', 'active')
      .is('deleted_at', null);

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id, status')
      .in('status', ['active', 'trialing']);

    // Table might not exist yet, so handle gracefully
    let tickets: Array<{ id: string; status: string; sla_violated: boolean }> | null = null;
    try {
      const result = await supabase
        .from('support_tickets')
        .select('id, status, sla_violated')
        .eq('status', 'open');
      tickets = result.data;
    } catch {
      // Table doesn't exist yet, ignore
      tickets = null;
    }

    const activeCustomers = customers?.length || 0;
    const activeSubscriptions = subscriptions?.length || 0;
    const openTickets = tickets?.length || 0;
    const slaViolations = tickets?.filter((t: { sla_violated: boolean }) => t.sla_violated).length || 0;

    // Get reliability metrics (last 24 hours)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get stats for critical operations
    const criticalOperations = [
      'sync:stripe',
      'sync:shopify',
      'receipt:parse',
      'reconciliation:run',
      'export:generate',
    ];

    const operationStats = await Promise.all(
      criticalOperations.map((op) => getOperationStats(op, since))
    );

    // Get adapter error rates
    const adapterErrorRates = await getAdapterErrorRates(since);

    // Get dead-letter jobs count
    let deadLetterCount = 0;
    try {
      const { count } = await supabase
        .from('dead_letters' as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since.toISOString());
      deadLetterCount = count || 0;
    } catch {
      // Table might not exist
    }

    // Get latest failures (last 10)
    let latestFailures: Array<{ operation: string; error: string; timestamp: string }> = [];
    try {
      const { data: failures } = await supabase
        .from('ops_events' as any)
        .select('operation, error_message, created_at')
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(10);
      latestFailures = (failures || []).map((f: any) => ({
        operation: f.operation || 'unknown',
        error: f.error_message || 'Unknown error',
        timestamp: f.created_at,
      }));
    } catch {
      // Table might not exist
    }

    // Determine overall health status
    const hasHighErrorRate = operationStats.some(
      (stats) => stats && stats.successRate < 0.95
    );
    const hasDeadLetters = deadLetterCount > 0;
    const hasAdapterIssues = adapterErrorRates.some((rate) => rate.errorRate > 0.1);

    const overallStatus =
      hasHighErrorRate || hasDeadLetters || hasAdapterIssues ? 'degraded' : 'healthy';

    return NextResponse.json({
      status: overallStatus,
      metrics: {
        active_customers: activeCustomers,
        active_subscriptions: activeSubscriptions,
        open_support_tickets: openTickets,
        sla_violations: slaViolations,
        timestamp: new Date().toISOString(),
      },
      reliability: {
        operationStats: operationStats.filter((s) => s !== null),
        adapterErrorRates,
        deadLetterCount,
        latestFailures: latestFailures.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching system health', error);
    // Never return 500 - return degraded health status
    return NextResponse.json({ 
      status: 'degraded',
      error: 'Failed to fetch system health',
      message: 'Unable to retrieve full health metrics. Some data may be unavailable.',
      metrics: {
        active_customers: 0,
        active_subscriptions: 0,
        open_support_tickets: 0,
        sla_violations: 0,
        timestamp: new Date().toISOString(),
      },
      reliability: {
        operationStats: [],
        adapterErrorRates: [],
        deadLetterCount: 0,
        latestFailures: [],
      },
      retryable: true,
    }, { status: 200 });
  }
}
