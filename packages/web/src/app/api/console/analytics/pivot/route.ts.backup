/**
 * Analytics Pivot API
 * 
 * Execute pivot queries for analytics studio
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { executePivotQuery, validatePivotQuery, PivotQuery } from '@/lib/services/pivot-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const query: PivotQuery = {
      dataset: body.dataset,
      rows: body.rows || [],
      columns: body.columns || [],
      measure: body.measure,
      aggregation: body.aggregation || 'sum',
      filters: body.filters || {},
      dateRange: body.dateRange,
    };

    // Validate query
    const validation = validatePivotQuery(query);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Execute query
    const result = await executePivotQuery(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pivot query error:', error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute pivot query',
        message: 'Please try again later',
        data: null,
      },
      { status: 200 }
    );
  }
}
