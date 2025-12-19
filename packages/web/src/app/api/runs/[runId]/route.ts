/**
 * Get Reconciliation Run
 * 
 * GET /api/runs/[runId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/authz';
import { createLogger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(
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
    const { data: run, error: runError } = await (supabase
      .from('recon_runs' as any)
      .select('*')
      .eq('id', params.runId)
      .single() as any);

    if (runError || !run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    // Verify workspace membership
    await requireWorkspaceMembership(run.workspace_id);

    // Get events
    const { data: events } = await (supabase
      .from('run_events' as any)
      .select('*')
      .eq('run_id', params.runId)
      .order('created_at', { ascending: false })
      .limit(100) as any);

    return NextResponse.json({
      run,
      events: events || [],
    });
  } catch (error) {
    logger.error('Error fetching run', error as Error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
