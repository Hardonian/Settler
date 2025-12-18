/**
 * Daily Cost & Usage Rollup Cron Job
 * 
 * Runs daily to derive cost inputs and calculate rollups.
 * Should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deriveCostInputsFromEvents,
  calculateDailyCostRollup,
  storeCostInputs,
  storeCostRollup,
} from '@/lib/services/cost-signal-engine';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    // In development, allow without secret
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    // Use provided date or default to yesterday (typical for daily rollups)
    const targetDate =
      body.date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`[Daily Rollup] Starting rollup for ${targetDate}`);

    // Derive cost inputs from events
    const costInputs = await deriveCostInputsFromEvents(targetDate);
    console.log(`[Daily Rollup] Derived ${costInputs.length} cost inputs`);
    await storeCostInputs(costInputs);

    // Calculate daily cost rollup
    const costRollup = await calculateDailyCostRollup(targetDate);
    console.log(`[Daily Rollup] Cost rollup: $${costRollup.totalCostEst.toFixed(2)}`);
    await storeCostRollup(costRollup);

    // Calculate usage rollup
    const supabase = await createClient();
    const { data: events } = await supabase
      .from('ops_events')
      .select('*')
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lt('created_at', `${targetDate}T23:59:59Z`);

    const activeOrgs = new Set(events?.map((e) => e.organization_id).filter(Boolean) || []);
    const activeUsers = new Set(events?.map((e) => e.user_id).filter(Boolean) || []);
    const requests = events?.filter((e) => e.event_type === 'api_request').length || 0;
    const jobs = events?.filter((e) => e.event_type === 'job_execution').length || 0;
    const webhooks = events?.filter((e) => e.event_type === 'webhook_delivery').length || 0;
    const errors = events?.filter((e) => e.event_type === 'error').length || 0;

    const responseTimes = events
      ?.filter((e) => e.duration_ms)
      .map((e) => e.duration_ms)
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
        date: targetDate,
        active_orgs: activeOrgs.size,
        active_users: activeUsers.size,
        total_requests: requests,
        total_jobs: jobs,
        total_events: events?.length || 0,
        total_webhooks: webhooks,
        total_errors: errors,
        avg_response_time_ms: Math.round(avgResponseTime),
        p95_response_time_ms: Math.round(p95ResponseTime),
      },
      {
        onConflict: 'date',
      }
    );

    console.log(`[Daily Rollup] Usage rollup: ${activeOrgs.size} orgs, ${activeUsers.size} users`);

    return NextResponse.json({
      success: true,
      date: targetDate,
      costInputs: costInputs.length,
      costRollup: {
        totalCostEst: costRollup.totalCostEst,
        confidence: costRollup.confidence,
      },
      usageRollup: {
        activeOrgs: activeOrgs.size,
        activeUsers: activeUsers.size,
        requests,
        jobs,
        events: events?.length || 0,
        webhooks,
        errors,
      },
    });
  } catch (error) {
    console.error('[Daily Rollup] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to run rollup',
        success: false,
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggers
export async function GET(request: NextRequest) {
  return POST(request);
}
