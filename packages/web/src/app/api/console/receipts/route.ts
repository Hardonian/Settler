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

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: authContext.userId },
    });

    if (!billingAccount) {
      // Return empty array instead of 404
      return NextResponse.json({ receipts: [] });
    }

    const receipts = await listReceipts(billingAccount.id, 50);

    return NextResponse.json({ receipts });
  } catch (error) {
    console.error('[Console Receipts] Error:', error);
    // Return 200 with empty array instead of 500
    return NextResponse.json({ receipts: [] });
  }
}
