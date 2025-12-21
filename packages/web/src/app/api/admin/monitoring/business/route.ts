/**
 * Admin Monitoring Business API Route
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

    const { data: customers } = await supabase
      .from('billing_accounts')
      .select('id, created_at, status')
      .is('deleted_at', null);

    const totalCustomers = customers?.length || 0;
    const activeCustomers = customers?.filter(c => c.status === 'active').length || 0;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: churnedCustomers } = await supabase
      .from('billing_accounts')
      .select('id')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', thirtyDaysAgo.toISOString())
      .catch(() => ({ data: null }));

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
    return NextResponse.json({ error: 'Failed to fetch business metrics' }, { status: 500 });
  }
}
