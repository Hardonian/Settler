/**
 * Admin Monitoring Business API Route
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

    const { data: customers } = await supabase
      .from('billing_accounts')
      .select('id, created_at, status')
      .is('deleted_at', null);

    const totalCustomers = customers?.length || 0;
    const activeCustomers = customers?.filter((c: { status: string }) => c.status === 'active').length || 0;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let churnedCustomers = null;
    try {
      const result = await supabase
        .from('billing_accounts')
        .select('id')
        .not('deleted_at', 'is', null)
        .gte('deleted_at', thirtyDaysAgo.toISOString());
      churnedCustomers = result.data;
    } catch {
      // Ignore errors
      churnedCustomers = null;
    }

    const churnRate = totalCustomers > 0
      ? ((churnedCustomers?.length || 0) / totalCustomers) * 100
      : 0;

    return NextResponse.json({
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        churned_30d: churnedCustomers?.length || 0,
        churn_rate: churnRate,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching business metrics', error);
    // Never return 500 - return empty metrics with error message
    return NextResponse.json({ 
      error: 'Failed to fetch business metrics',
      message: 'Unable to retrieve business metrics. Please try again.',
      customers: {
        total: 0,
        active: 0,
        churned_30d: 0,
        churn_rate: 0,
      },
      timestamp: new Date().toISOString(),
      retryable: true,
    }, { status: 200 });
  }
}
