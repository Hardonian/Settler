/**
 * Admin Monitoring SLA API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.user_metadata?.role === 'admin' || user.email?.endsWith('@settler.dev');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const { data: accounts } = await supabase
      .from('billing_accounts')
      .select('id, plan_id')
      .eq('status', 'active')
      .is('deleted_at', null);

    // Get SLA metrics from support_tickets table
    const slaMetrics = [];
    for (const account of accounts || []) {
      try {
        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('sla_met, response_time_hours')
          .eq('billing_account_id', account.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .not('responded_at', 'is', null)
          .catch(() => ({ data: null }));

        const totalTickets = tickets?.length || 0;
        const slaMet = tickets?.filter(t => t.sla_met === true).length || 0;
        const slaMissed = tickets?.filter(t => t.sla_met === false).length || 0;
        const slaPercentage = totalTickets > 0 ? (slaMet / totalTickets) * 100 : 0;
        const avgResponseTime = tickets?.reduce((sum, t) => sum + (t.response_time_hours || 0), 0) / totalTickets || 0;

        slaMetrics.push({
          billing_account_id: account.id,
          tier: account.plan_id || 'free',
          total_tickets: totalTickets,
          sla_met: slaMet,
          sla_missed: slaMissed,
          sla_percentage: slaPercentage,
          avg_response_time_hours: avgResponseTime,
        });
      } catch (error) {
        console.error(`Error fetching SLA metrics for account ${account.id}`, error);
      }
    }

    // Get current violations
    const { data: violations } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('status', 'open')
      .eq('sla_violated', true)
      .catch(() => ({ data: null }));

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      accounts: slaMetrics,
      violations: {
        current: violations?.length || 0,
        alerts_sent: violations?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching SLA metrics', error);
    return NextResponse.json({ error: 'Failed to fetch SLA metrics' }, { status: 500 });
  }
}
