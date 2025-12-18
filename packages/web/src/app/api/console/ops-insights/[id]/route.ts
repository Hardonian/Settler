/**
 * Ops Insight Detail API
 * 
 * Get single insight with recommendations and actions
 * 
 * Performance optimizations:
 * - Input validation
 * - Query optimization
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { createClient } from '@/lib/supabase/server';
import { isValidUUID } from '@/lib/ops-intelligence/utils';

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
    // Validate UUID
    const insightId = params.id;
    if (!isValidUUID(insightId)) {
      return NextResponse.json({ error: 'Invalid insight ID format' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get insight with timeout
    const insightPromise = supabase
      .from('ops_insights')
      .select('*')
      .eq('id', insightId)
      .single();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 30000)
    );

    const { data: insight, error: insightError } = await Promise.race([
      insightPromise,
      timeoutPromise,
    ]);

    if (insightError) {
      if (insightError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
      }
      throw insightError;
    }

    // Get recommendations and actions in parallel
    const [recommendationsResult, actionsResult] = await Promise.all([
      supabase
        .from('ops_recommendations')
        .select('*')
        .eq('insight_id', insightId)
        .order('risk_level', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('ops_actions')
        .select('*')
        .eq('insight_id', insightId)
        .order('executed_at', { ascending: false }),
    ]);

    return NextResponse.json({
      insight,
      recommendations: recommendationsResult.data || [],
      actions: actionsResult.data || [],
    });
  } catch (error) {
    console.error('Error fetching insight:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch insight';
    const statusCode = errorMessage.includes('timeout') ? 504 : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
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
    const insightId = params.id;
    if (!isValidUUID(insightId)) {
      return NextResponse.json({ error: 'Invalid insight ID format' }, { status: 400 });
    }

    const supabase = await createClient();
    const body = await request.json();

    // Validate allowed fields
    const allowedFields = ['status', 'resolved_at', 'resolved_by', 'resolution_notes'];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ops_insights')
      // @ts-expect-error - Supabase type inference issue
      .update(updateData)
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
