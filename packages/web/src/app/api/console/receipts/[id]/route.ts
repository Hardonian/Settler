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

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: authContext.userId },
    });

    if (!billingAccount) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const { id } = await params;
    const receipt = await getReceiptDetail(id, billingAccount.id);

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('[Console Receipts] Error fetching detail:', error);
    // Return 404 instead of 500
    return NextResponse.json(
      { error: 'Receipt not found' },
      { status: 404 }
    );
  }
}
