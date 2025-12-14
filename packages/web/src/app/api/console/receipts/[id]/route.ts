/**
 * Console Receipts API Route - Get Detail
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { prisma } from '@/shared/db/prismaClient';
import { getReceiptDetail } from '@/domain/console/receipts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate using unified auth (session or API key)
    const authContext = await requireAuth(request);

    // Get billing account
    let billingAccountId = authContext.billingAccountId;
    
    if (!billingAccountId) {
      // Try to find billing account for user
      const billingAccount = await prisma.billingAccount.findFirst({
        where: { userId: authContext.userId },
        select: { id: true },
      });

      if (!billingAccount) {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
      }

      billingAccountId = billingAccount.id;
    }

    const { id } = await params;
    
    // Validate receipt ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid receipt ID' }, { status: 400 });
    }

    const receipt = await getReceiptDetail(id, billingAccountId);

    if (!receipt) {
      // Receipt not found or doesn't belong to user's billing account
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Console Receipts] Error fetching detail:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return 404 instead of 500 to prevent page crashes
    return NextResponse.json(
      { error: 'Receipt not found' },
      { status: 404 }
    );
  }
}
