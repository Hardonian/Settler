/**
 * Admin Monitoring Health API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (simplified - would use proper role check)
    const isAdmin = user.user_metadata?.role === 'admin' || user.email?.endsWith('@settler.dev');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    return NextResponse.json({ error: 'Failed to fetch system health' }, { status: 500 });
  }
}
