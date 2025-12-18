/**
 * Ops Briefing Detail API
 * 
 * Get single briefing
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
    const briefingId = params.id;

    const { data: briefing, error } = await supabase
      .from('ops_briefings')
      .select('*')
      .eq('id', briefingId)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(briefing);
  } catch (error) {
    console.error('Error fetching briefing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch briefing' },
      { status: 500 }
    );
  }
}
