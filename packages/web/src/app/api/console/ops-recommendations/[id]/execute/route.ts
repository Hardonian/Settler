/**
 * Execute Recommendation API
 * 
 * Execute a recommendation and create action record
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const recommendationId = params.id;
    const body = await request.json();
    const { actionTaken, outcomeNotes } = body;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Execute recommendation via RPC
    const { data: actionId, error: executeError } = await supabase.rpc(
      'execute_recommendation',
      {
        p_recommendation_id: recommendationId,
        p_executed_by: user.id,
        p_action_taken: actionTaken,
        p_outcome_notes: outcomeNotes || null,
      }
    );

    if (executeError) {
      throw executeError;
    }

    // Get the created action
    if (actionId) {
      const { data: action } = await supabase
        .from('ops_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      return NextResponse.json({ success: true, action });
    }

    return NextResponse.json({ success: true, actionId });
  } catch (error) {
    console.error('Error executing recommendation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute recommendation' },
      { status: 500 }
    );
  }
}
