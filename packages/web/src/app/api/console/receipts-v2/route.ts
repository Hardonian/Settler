/**
 * Receipts V2 API Route
 * 
 * Uses new Settler service layer with hash chain support.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { createReceipt, listReceipts, verifyReceiptChain } from '@/lib/server/settler/receipts';
import { getPrimaryTenant } from '@/lib/supabase/tenant-helpers';
import { z } from 'zod';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateReceiptSchema = z.object({
  sourceId: z.string().optional(),
  canonicalJson: z.record(z.string(), z.unknown()),
  evidenceRefs: z.array(z.object({
    type: z.enum(['hash', 'source_ref', 'transaction_id', 'receipt_id']),
    value: z.string(),
    description: z.string().optional(),
  })),
  narrative: z.object({
    summary: z.string(),
    whyItMatters: z.string(),
    nextSteps: z.string().optional(),
  }),
});

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    // Authenticate
    await requireAuth(request);
    
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
    const payload = CreateReceiptSchema.parse(body);
    
    // Create receipt
    const receipt = await createReceipt(tenantId, payload);
    
    if (!receipt) {
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to create receipt',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }
    
    return NextResponse.json({ receipt }, { status: 201 });
  } catch (error) {
    // Return typed error, not 500
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    appLogger.error('[Receipts V2 API] Error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create receipt',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
  try {
    // Authenticate
    await requireAuth(request);
    
    // Get tenant ID
    const tenantId = await getPrimaryTenant();
    if (!tenantId) {
      return NextResponse.json({ receipts: [] }, { status: 200 });
    }
    
    // Get limit from query params
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10);
    
    // Get receipt ID for verification
    const receiptId = request.nextUrl.searchParams.get('verify');
    
    if (receiptId) {
      // Verify receipt chain
      const verification = await verifyReceiptChain(tenantId, receiptId);
      return NextResponse.json({ verification });
    }
    
    // List receipts
    const receipts = await listReceipts(tenantId, limit);
    
    return NextResponse.json({ receipts });
  } catch (error) {
    appLogger.error('[Receipts V2 API] Error', error);
    return NextResponse.json({ receipts: [] }, { status: 200 });
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
