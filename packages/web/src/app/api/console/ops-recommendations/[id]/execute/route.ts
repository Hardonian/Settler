/**
 * Execute Recommendation API
 * 
 * Execute a recommendation and create action record
 * 
 * Security & Performance:
 * - Input validation
 * - SQL injection prevention (via Supabase client)
 * - Error handling
 * - Transaction safety
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { createClient } from '@/lib/supabase/server';
import { isValidUUID, sanitizeString } from '@/lib/ops-intelligence/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const recommendationId = params.id;

    // Validate UUID
    if (!isValidUUID(recommendationId)) {
      return NextResponse.json({ error: 'Invalid recommendation ID format' }, { status: 400 });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { actionTaken, outcomeNotes } = body;

    // Validate required fields
    if (!actionTaken || typeof actionTaken !== 'string') {
      return NextResponse.json(
        { error: 'actionTaken is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedActionTaken = sanitizeString(actionTaken);
    const sanitizedOutcomeNotes = outcomeNotes ? sanitizeString(outcomeNotes) : null;

    if (sanitizedActionTaken.length === 0) {
      return NextResponse.json(
        { error: 'actionTaken cannot be empty' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify recommendation exists and is in suggested status
    const { data: recommendation, error: recError } = await supabase
      .from('ops_recommendations')
      .select('id, status, insight_id')
      .eq('id', recommendationId)
      .single();

    if (recError || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const recStatus = (recommendation as any).status;
    if (recStatus !== 'suggested') {
      return NextResponse.json(
        { error: `Recommendation is already ${recStatus}` },
        { status: 400 }
      );
    }

    // Execute recommendation via RPC (atomic operation)
    const { data: actionId, error: executeError } = await supabase.rpc(
      'execute_recommendation',
      {
        p_recommendation_id: recommendationId,
        p_executed_by: user.id,
        p_action_taken: sanitizedActionTaken,
        p_outcome_notes: sanitizedOutcomeNotes,
      } as any
    );

    if (executeError) {
      console.error('RPC error:', executeError);
      throw executeError;
    }

    // Get the created action
    if (actionId) {
      const { data: action, error: actionError } = await supabase
        .from('ops_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      if (actionError) {
        console.error('Error fetching action:', actionError);
        // Still return success since RPC succeeded
        return NextResponse.json({ success: true, actionId });
      }

      return NextResponse.json({ success: true, action });
    }

    return NextResponse.json({ success: true, actionId });
  } catch (error) {
    console.error('Error executing recommendation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute recommendation',
      },
      { status: 500 }
    );
  }
}
