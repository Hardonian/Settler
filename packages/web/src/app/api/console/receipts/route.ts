/**
 * Console Receipts API Route
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { prisma } from '@/shared/db/prismaClient';
import { listReceipts } from '@/domain/console/receipts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Authenticate using unified auth (session or API key)
    const authContext = await requireAuth(request);

    // Validate billing account exists
    if (!authContext.billingAccountId) {
      // Try to find billing account for user
      const billingAccount = await prisma.billingAccount.findFirst({
        where: { userId: authContext.userId },
        select: { id: true },
      });

      if (!billingAccount) {
        // No billing account - return empty array (user hasn't created one yet)
        return NextResponse.json({ receipts: [] });
      }

      // Use found billing account
      const receipts = await listReceipts(billingAccount.id, 50);
      return NextResponse.json({ receipts });
    }

    // Use billing account from auth context
    const receipts = await listReceipts(authContext.billingAccountId, 50);

    return NextResponse.json({ receipts });
  } catch (error) {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Console Receipts] Error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return 200 with empty array instead of 500 to prevent page crashes
    // The UI will show "No receipts" message
    return NextResponse.json({ receipts: [] });
  }
}
