/**
 * Ops Insights API
 * 
 * Get insights with filtering and pagination
 * 
 * Performance optimizations:
 * - Input validation
 * - Query optimization
 * - Error handling
 * - Rate limiting ready
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { createClient } from '@/lib/supabase/server';
import {
  isValidInsightType,
  isValidSeverity,
  isValidStatus,
  validatePagination,
  DEFAULT_PAGE_SIZE,
  INSIGHT_TYPES,
  INSIGHT_SEVERITIES,
  INSIGHT_STATUSES,
} from '@/lib/ops-intelligence';

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

    // Validate and parse query parameters
    const typeParam = searchParams.get('type');
    const severityParam = searchParams.get('severity');
    const statusParam = searchParams.get('status') || 'active';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);

    // Validate inputs
    if (typeParam && !isValidInsightType(typeParam)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${INSIGHT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (severityParam && !isValidSeverity(severityParam)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${INSIGHT_SEVERITIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (statusParam && statusParam !== 'all' && !isValidStatus(statusParam)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${INSIGHT_STATUSES.join(', ')}, or 'all'` },
        { status: 400 }
      );
    }

    const { page, limit } = validatePagination(pageParam, limitParam);
    const offset = (page - 1) * limit;

    // Build query with optimizations
    let query = supabase
      .from('ops_insights')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (typeParam) {
      query = query.eq('type', typeParam);
    }
    if (severityParam) {
      query = query.eq('severity', severityParam);
    }
    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    // Execute query with timeout
    const queryPromise = query;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 30000)
    );

    const { data, error, count } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({
      insights: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch insights';
    const statusCode = errorMessage.includes('timeout') ? 504 : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
