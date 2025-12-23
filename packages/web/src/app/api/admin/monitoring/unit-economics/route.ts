/**
 * Admin Monitoring Unit Economics API Route
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
      const planId = (sub as { plan_id: string | null }).plan_id || 'free';
      planCounts[planId] = (planCounts[planId] || 0) + 1;
      totalMRR += planPricing[planId] || 0;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let usage: Array<{ event_type: string; total_quantity: number | null }> | null = null;
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

    const totalReconciliations = usage?.reduce((sum: number, u: { event_type: string; total_quantity: number | null }) => {
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
    // Never return 500 - return empty metrics with professional error message
    return NextResponse.json({ 
      error: 'Unable to retrieve unit economics',
      message: 'Financial metrics are temporarily unavailable. Please try again in a moment.',
      mrr: 0,
      active_subscriptions: 0,
      plan_distribution: {},
      usage: {
        total_reconciliations_30d: 0,
      },
      calculated_metrics: {
        arpu: 0,
        cost_per_reconciliation: 0.0006,
      },
      retryable: true,
    }, { status: 200 });
  }
}
