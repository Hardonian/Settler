/**
 * Console Feature Flags API Route
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { prisma } from '@/shared/db/prismaClient';
import { listFeatureFlags } from '@/domain/console/featureFlags';

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
      return NextResponse.json({ flags: [] });
    }

    const flags = await listFeatureFlags(billingAccount.id);

    return NextResponse.json({ flags });
  } catch (error) {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Console Feature Flags] Error:', error);
    // Return 200 with empty array instead of 500
    return NextResponse.json({ flags: [] });
  }
}
