/**
 * Ops Insight Detail API
 * 
 * Get single insight with recommendations and actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const supabase = await createClient();
    const insightId = params.id;

    // Get insight
    const { data: insight, error: insightError } = await supabase
      .from('ops_insights')
      .select('*')
      .eq('id', insightId)
      .single();

    if (insightError) {
      throw insightError;
    }

    // Get recommendations
    const { data: recommendations } = await supabase
      .from('ops_recommendations')
      .select('*')
      .eq('insight_id', insightId)
      .order('risk_level', { ascending: false })
      .order('created_at', { ascending: false });

    // Get actions
    const { data: actions } = await supabase
      .from('ops_actions')
      .select('*')
      .eq('insight_id', insightId)
      .order('executed_at', { ascending: false });

    return NextResponse.json({
      insight,
      recommendations: recommendations || [],
      actions: actions || [],
    });
  } catch (error) {
    console.error('Error fetching insight:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch insight' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const supabase = await createClient();
    const insightId = params.id;
    const body = await request.json();

    const { data, error } = await supabase
      .from('ops_insights')
      .update(body)
      .eq('id', insightId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update insight' },
      { status: 500 }
    );
  }
}
