/**
 * Saved Views API
 * 
 * Manage saved analytics views
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const supabase = await createClient();
    const userId = adminCheck.user?.id;
    if (!userId) {
      return NextResponse.json({ views: [] }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('ops_saved_views')
      .select('*')
      .or(`is_public.eq.true,created_by.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ views: data || [] });
  } catch (error) {
    console.error('Failed to fetch saved views:', error);
    return NextResponse.json({ views: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const supabase = await createClient();

    const userId = adminCheck.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('ops_saved_views')
      .insert({
        name: body.name,
        description: body.description,
        dataset: body.dataset,
        rows: body.rows,
        columns: body.columns,
        measure: body.measure,
        aggregation: body.aggregation,
        filters: body.filters,
        date_range: body.dateRange,
        created_by: userId,
        is_public: body.isPublic || false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ view: data });
  } catch (error) {
    console.error('Failed to create saved view:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create saved view' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const viewId = searchParams.get('id');

    if (!viewId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('ops_saved_views')
      .delete()
      .eq('id', viewId)
      .or(`created_by.eq.${adminCheck.userId},is_public.eq.true`); // Only delete own or public views

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete saved view:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete saved view' },
      { status: 500 }
    );
  }
}
