/**
 * Cost & Usage Rollup API
 * 
 * Trigger daily rollup jobs for cost and usage intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import {
  deriveCostInputsFromEvents,
  calculateDailyCostRollup,
  storeCostInputs,
  storeCostRollup,
} from '@/lib/services/cost-signal-engine';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const date = body.date || new Date().toISOString().split('T')[0]; // Default to today

    // Derive cost inputs from events
    const costInputs = await deriveCostInputsFromEvents(date);
    await storeCostInputs(costInputs);

    // Calculate daily cost rollup
    const costRollup = await calculateDailyCostRollup(date);
    await storeCostRollup(costRollup);

    // Calculate usage rollup
    const supabase = await createClient();
    const { data: events } = await supabase
      .from('ops_events')
      .select('*')
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    type EventRow = {
      organization_id?: string | null;
      user_id?: string | null;
      event_type?: string;
      duration_ms?: number;
    };

    const eventRows = (events || []) as EventRow[];
    const activeOrgs = new Set(eventRows.map((e) => e.organization_id).filter(Boolean) || []);
    const activeUsers = new Set(eventRows.map((e) => e.user_id).filter(Boolean) || []);
    const requests = eventRows.filter((e) => e.event_type === 'api_request').length || 0;
    const jobs = eventRows.filter((e) => e.event_type === 'job_execution').length || 0;
    const webhooks = eventRows.filter((e) => e.event_type === 'webhook_delivery').length || 0;
    const errors = eventRows.filter((e) => e.event_type === 'error').length || 0;

    const responseTimes = eventRows
      .filter((e) => e.duration_ms)
      .map((e) => e.duration_ms!)
      .sort((a, b) => a - b) || [];
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const p95ResponseTime =
      responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length * 0.95)]
        : 0;

    // Store usage rollup
    await supabase.from('ops_usage_daily_rollups').upsert(
      {
        date,
        active_orgs: activeOrgs.size,
        active_users: activeUsers.size,
        total_requests: requests,
        total_jobs: jobs,
        total_events: eventRows.length || 0,
        total_webhooks: webhooks,
        total_errors: errors,
        avg_response_time_ms: Math.round(avgResponseTime),
        p95_response_time_ms: Math.round(p95ResponseTime || 0),
      } as any,
      {
        onConflict: 'date',
      }
    );

    return NextResponse.json({
      success: true,
      date,
      costInputs: costInputs.length,
      costRollup,
      usageRollup: {
        activeOrgs: activeOrgs.size,
        activeUsers: activeUsers.size,
        requests,
        jobs,
        events: eventRows.length || 0,
        webhooks,
        errors,
      },
    });
  } catch (error) {
    console.error('Rollup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run rollup' },
      { status: 500 }
    );
  }
}
