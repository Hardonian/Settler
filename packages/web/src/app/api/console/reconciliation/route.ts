/**
 * Reconciliation API Route
 * 
 * Runs reconciliation jobs and retrieves reconciliation summaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, UnifiedAuthContext } from '@/lib/api/unified-auth';
import { triggerInternalReconciliationRun } from '@/lib/server/internal-api';
import { getReconciliationSummary, listReconciliationItems } from '@/lib/server/settler/reconciliation';
import { getPrimaryTenant } from '@/lib/supabase/tenant-helpers';
import { z } from 'zod';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

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

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const authContext: UnifiedAuthContext = await requireAuth(request);
    
    // Get tenant ID
    const tenantId = authContext.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }

    // Get user ID
    const userId = authContext.userId;
    
    // Parse and validate body
    const body = await request.json();
    const params = RunReconciliationSchema.parse(body);
    
    // Run reconciliation via the authoritative internal API
    const result = await triggerInternalReconciliationRun(tenantId, userId, {
      ingestionId: params.sourceId,
      config: {
        rules: params.rules,
      }
    });
    
    if (!result || !result.runId) {
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to create reconciliation',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 500 } // Use a 500 status for a failed internal process
    );
    }
    
    return NextResponse.json({ runId: result.runId }, { status: 202 }); // 202 Accepted is more appropriate for an async job start
  } catch (error) {
    // Return typed error, not 500
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    appLogger.error('[Reconciliation API] Error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run reconciliation',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
  try {
    // Authenticate
    await requireAuth(request);
    
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
    appLogger.error('[Reconciliation API] Error', error);
    return NextResponse.json({ reconciliations: [] }, { status: 200 });
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
