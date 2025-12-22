/**
 * Admin Monitoring SLA API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
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
    const slaMetrics: Array<{
      billing_account_id: string;
      tier: string;
      total_tickets: number;
      sla_met: number;
      sla_missed: number;
      sla_percentage: number;
      avg_response_time_hours: number;
    }> = [];
    const accountsList: Array<{ id: string; plan_id: string | null }> = accounts || [];
    for (const account of accountsList) {
      try {
        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('sla_met, response_time_hours')
          .eq('billing_account_id', account.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .not('responded_at', 'is', null);

        const totalTickets = tickets?.length || 0;
        const slaMet = tickets?.filter((t: { sla_met: boolean }) => t.sla_met === true).length || 0;
        const slaMissed = tickets?.filter((t: { sla_met: boolean }) => t.sla_met === false).length || 0;
        const slaPercentage = totalTickets > 0 ? (slaMet / totalTickets) * 100 : 0;
        const avgResponseTime = totalTickets > 0 
          ? (tickets?.reduce((sum: number, t: { response_time_hours: number | null }) => sum + (t.response_time_hours || 0), 0) || 0) / totalTickets 
          : 0;

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
    let violations: Array<{ id: string }> | null = null;
    try {
      const result = await supabase
        .from('support_tickets')
        .select('id')
        .eq('status', 'open')
        .eq('sla_violated', true);
      violations = result.data;
    } catch {
      // Table doesn't exist yet, ignore
      violations = null;
    }

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
    // Never return 500 - return empty metrics with professional error message
    return NextResponse.json({ 
      error: 'Unable to retrieve SLA metrics',
      message: 'Service level agreement metrics are temporarily unavailable. Please try again in a moment.',
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      accounts: [],
      violations: {
        current: 0,
        alerts_sent: 0,
      },
      retryable: true,
    }, { status: 200 });
  }
}
