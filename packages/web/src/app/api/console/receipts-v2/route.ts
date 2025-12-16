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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateReceiptSchema = z.object({
  sourceId: z.string().optional(),
  canonicalJson: z.record(z.unknown()),
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

export async function POST(request: NextRequest) {
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
        { error: 'Failed to create receipt' },
        { status: 500 }
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
    
    console.error('[Receipts V2 API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
    console.error('[Receipts V2 API] Error:', error);
    return NextResponse.json({ receipts: [] }, { status: 200 });
  }
}
