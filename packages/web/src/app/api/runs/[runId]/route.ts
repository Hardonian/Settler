/**
 * Get Reconciliation Run
 * 
 * GET /api/runs/[runId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/authz';
import { createLogger } from '@/lib/logger';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';

export const runtime = 'nodejs';

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(
  _request: NextRequest,
  { params }: { params: { runId: string } }
) {
  const logger = createLogger({ runId: params.runId });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get run
    const runResult = await (supabase
      .from('recon_runs') as any)
      .select('*')
      .eq('id', params.runId)
      .single() as Promise<{ data: { workspace_id: string } | null; error: { message?: string } | null }>);
    const { data: run, error: runError } = runResult;

    if (runError || !run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership
    await requireWorkspaceMembership(run.workspace_id);

    // Get events
    const eventsResult = await (supabase
      .from('run_events') as any)
      .select('*')
      .eq('run_id', params.runId)
      .order('created_at', { ascending: false })
      .limit(100) as Promise<{ data: Array<Record<string, unknown>> | null }>;
    const { data: events } = eventsResult;

    return NextResponse.json({
      run,
      events: events || [],
    });
  } catch (error) {
    logger.error('Error fetching run', error as Error);
    // Never return 500 - return actionable error message
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.',
        retryable: true,
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);