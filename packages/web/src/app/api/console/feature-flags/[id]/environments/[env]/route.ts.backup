/**
 * Console Feature Flags Environment API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { updateFlagEnvironment } from '@/domain/console/featureFlags';
import { Environment } from '@/domain/featureFlags/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

interface RouteParams {
  params: Promise<{ id: string; env: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id, env } = await params;
    const body = await request.json();

    await updateFlagEnvironment(
      id,
      env as Environment,
      billingAccount.id,
      {
        enabled: body.enabled,
        variant: body.variant,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating feature flag environment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update feature flag';
    // Return 200 with error message instead of 500
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 200 }
    );
  }
}
