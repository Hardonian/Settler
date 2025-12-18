/**
 * Ops Briefings API
 * 
 * Get briefings with pagination
 * 
 * Performance optimizations:
 * - Input validation
 * - Query optimization
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_BRIEFING_PAGE_SIZE,
  validatePagination,
} from '@/lib/ops-intelligence/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(
      searchParams.get('limit') || String(DEFAULT_BRIEFING_PAGE_SIZE),
      10
    );

    const { page, limit } = validatePagination(pageParam, limitParam);
    const offset = (page - 1) * limit;

    // Build query with timeout protection
    const queryPromise = supabase
      .from('ops_briefings')
      .select('*', { count: 'exact' })
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 30000)
    );

    const { data, error, count } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({
      briefings: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching briefings:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch briefings';
    const statusCode = errorMessage.includes('timeout') ? 504 : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
