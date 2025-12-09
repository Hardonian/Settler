/**
 * Console Feature Flags Environment API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { updateFlagEnvironment } from '@/domain/console/featureFlags';
import { Environment } from '@/domain/featureFlags/types';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; env: string } }
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

    const body = await request.json();

    await updateFlagEnvironment(
      params.id,
      params.env as Environment,
      billingAccount.id,
      {
        enabled: body.enabled,
        variant: body.variant,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating feature flag environment:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}
