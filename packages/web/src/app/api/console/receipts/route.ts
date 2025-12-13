/**
 * Console Receipts API Route
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { listReceipts } from '@/domain/console/receipts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
    });

    if (!billingAccount) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const receipts = await listReceipts(billingAccount.id, 50);

    return NextResponse.json({ receipts });
  } catch (error) {
    console.error('[Console Receipts] Error:', error);
    // Return 200 with empty array instead of 500
    return NextResponse.json({ receipts: [] });
  }
}
