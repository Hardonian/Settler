/**
 * Meaningful Changes API Route
 * 
 * Returns meaningful changes ranked by impact and urgency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { listMeaningfulChanges } from '@/lib/server/settler/meaningful-changes';
import { getPrimaryTenant } from '@/lib/supabase/tenant-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const QuerySchema = z.object({
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  minRiskScore: z.coerce.number().min(0).max(1).optional(),
  sourceId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authContext = await requireAuth(request);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found', changes: [] },
        { status: 200 } // Return 200 with empty array, not 500
      );
    }
    
    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filters = QuerySchema.parse(searchParams);
    
    // List meaningful changes
    const changes = await listMeaningfulChanges(tenantId, filters);
    
    return NextResponse.json({ changes });
  } catch (error) {
    // Never return 500 - always return 200 with empty array
    console.error('[Meaningful Changes API] Error:', error);
    return NextResponse.json({ changes: [] }, { status: 200 });
  }
}
