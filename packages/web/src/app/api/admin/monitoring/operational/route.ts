/**
 * Admin Monitoring Operational API Route
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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let tickets: Array<{ status: string; priority: string; sla_met: boolean; created_at: string }> | null = null;
    try {
      const result = await supabase
        .from('support_tickets')
        .select('status, priority, sla_met, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());
      tickets = result.data;
    } catch {
      // Table doesn't exist yet, ignore
      tickets = null;
    }

    const ticketMetrics = {
      total: tickets?.length || 0,
      open: tickets?.filter((t: { status: string }) => t.status === 'open').length || 0,
      resolved: tickets?.filter((t: { status: string }) => t.status === 'resolved').length || 0,
      sla_met: tickets?.filter((t: { sla_met: boolean }) => t.sla_met === true).length || 0,
      sla_missed: tickets?.filter((t: { sla_met: boolean }) => t.sla_met === false).length || 0,
      by_priority: {
        critical: tickets?.filter((t: { priority: string }) => t.priority === 'critical').length || 0,
        high: tickets?.filter((t: { priority: string }) => t.priority === 'high').length || 0,
        medium: tickets?.filter((t: { priority: string }) => t.priority === 'medium').length || 0,
        low: tickets?.filter((t: { priority: string }) => t.priority === 'low').length || 0,
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
    // Never return 500 - return empty metrics with professional error message
    return NextResponse.json({ 
      error: 'Unable to retrieve operational metrics',
      message: 'Operational metrics are temporarily unavailable. Please try again in a moment.',
      support: {
        total: 0,
        open: 0,
        resolved: 0,
        sla_met: 0,
        sla_missed: 0,
        by_priority: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      },
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      retryable: true,
    }, { status: 200 });
  }
}
