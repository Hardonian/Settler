/**
 * Ops Briefing Detail API
 * 
 * Get single briefing
 * 
 * Performance optimizations:
 * - Input validation
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
    const briefingId = params.id;

    // Validate UUID
    if (!isValidUUID(briefingId)) {
      return NextResponse.json({ error: 'Invalid briefing ID format' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get briefing with timeout
    const queryPromise = supabase
      .from('ops_briefings')
      .select('*')
      .eq('id', briefingId)
      .single();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 30000)
    );

    const { data: briefing, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Briefing not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(briefing);
  } catch (error) {
    console.error('Error fetching briefing:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch briefing';
    const statusCode = errorMessage.includes('timeout') ? 504 : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
