/**
 * Admin Monitoring Unit Economics API Route
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

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id, billing_account_id, plan_id, status, current_period_start, current_period_end')
      .in('status', ['active', 'trialing']);

    let totalMRR = 0;
    const planPricing: Record<string, number> = {
      free: 0,
      starter: 99,
      growth: 599,
      scale: 4999,
      enterprise: 0,
    };

    const planCounts: Record<string, number> = {};
    for (const sub of subscriptions || []) {
      const planId = sub.plan_id || 'free';
      planCounts[planId] = (planCounts[planId] || 0) + 1;
      totalMRR += planPricing[planId] || 0;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let usage = null;
    try {
      const result = await supabase
        .from('usage_aggregate_daily')
        .select('event_type, total_quantity')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
      usage = result.data;
    } catch {
      // Table might not exist, ignore
      usage = null;
    }

    const totalReconciliations = usage?.reduce((sum, u) => {
      if (u.event_type === 'reconciliation_job') {
        return sum + Number(u.total_quantity || 0);
      }
      return sum;
    }, 0) || 0;

    return NextResponse.json({
      mrr: totalMRR,
      active_subscriptions: subscriptions?.length || 0,
      plan_distribution: planCounts,
      usage: {
        total_reconciliations_30d: totalReconciliations,
      },
      calculated_metrics: {
        arpu: subscriptions?.length ? totalMRR / subscriptions.length : 0,
        cost_per_reconciliation: 0.0006,
      },
    });
  } catch (error) {
    console.error('Error fetching unit economics', error);
    return NextResponse.json({ error: 'Failed to fetch unit economics' }, { status: 500 });
  }
}
