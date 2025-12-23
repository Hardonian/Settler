/**
 * Admin Monitoring Health API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';

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

    return NextResponse.json({
      status: 'healthy',
      metrics: {
        active_customers: activeCustomers,
        active_subscriptions: activeSubscriptions,
        open_support_tickets: openTickets,
        sla_violations: slaViolations,
        timestamp: new Date().toISOString(),
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
      retryable: true,
    }, { status: 200 });
  }
}
