/**
 * Reconciliation API Route
 * 
 * Runs reconciliation jobs and retrieves reconciliation summaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { runReconciliation, getReconciliationSummary, listReconciliationItems } from '@/lib/server/settler/reconciliation';
import { getPrimaryTenant } from '@/lib/supabase/tenant-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const RunReconciliationSchema = z.object({
  sourceId: z.string().min(1),
  targetAdapter: z.string().optional(),
  rules: z.array(z.object({
    field: z.string(),
    tolerance: z.number().optional(),
    window: z.string().optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authContext = await requireAuth(request);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }
    
    // Parse and validate body
    const body = await request.json();
    const params = RunReconciliationSchema.parse(body);
    
    // Run reconciliation
    const summary = await runReconciliation(tenantId, params);
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to create reconciliation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ reconciliation: summary }, { status: 201 });
  } catch (error) {
    // Return typed error, not 500
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('[Reconciliation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run reconciliation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authContext = await requireAuth(request);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json({ reconciliations: [] }, { status: 200 });
    }
    
    // Get reconciliation ID from query params
    const reconciliationId = request.nextUrl.searchParams.get('id');
    
    if (reconciliationId) {
      // Get specific reconciliation summary
      const summary = await getReconciliationSummary(tenantId, reconciliationId);
      
      if (!summary) {
        return NextResponse.json(
          { error: 'Reconciliation not found' },
          { status: 404 }
        );
      }
      
      // Get items
      const items = await listReconciliationItems(tenantId, reconciliationId);
      
      return NextResponse.json({
        reconciliation: summary,
        items,
      });
    }
    
    // List all reconciliations (placeholder - would need list function)
    return NextResponse.json({ reconciliations: [] }, { status: 200 });
  } catch (error) {
    console.error('[Reconciliation API] Error:', error);
    return NextResponse.json({ reconciliations: [] }, { status: 200 });
  }
}
