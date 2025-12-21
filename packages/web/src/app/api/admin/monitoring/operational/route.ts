/**
 * Admin Monitoring Operational API Route
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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('status, priority, sla_met, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .catch(() => ({ data: null }));

    const ticketMetrics = {
      total: tickets?.length || 0,
      open: tickets?.filter(t => t.status === 'open').length || 0,
      resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
      sla_met: tickets?.filter(t => t.sla_met === true).length || 0,
      sla_missed: tickets?.filter(t => t.sla_met === false).length || 0,
      by_priority: {
        critical: tickets?.filter(t => t.priority === 'critical').length || 0,
        high: tickets?.filter(t => t.priority === 'high').length || 0,
        medium: tickets?.filter(t => t.priority === 'medium').length || 0,
        low: tickets?.filter(t => t.priority === 'low').length || 0,
      },
    };

    return NextResponse.json({
      support: ticketMetrics,
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching operational metrics', error);
    return NextResponse.json({ error: 'Failed to fetch operational metrics' }, { status: 500 });
  }
}
