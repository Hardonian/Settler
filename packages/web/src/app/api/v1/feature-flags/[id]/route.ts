/**
 * Feature Flags API - Update flag
 * 
 * PATCH /api/v1/feature-flags/:id - Update flag settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApiKey(request);

    if (!auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verify flag belongs to billing account
    const existing = await prisma.featureFlag.findFirst({
      where: {
        id: params.id,
        billingAccountId: auth.billingAccountId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    // Update flag
    const flag = await prisma.featureFlag.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        isGlobal: body.isGlobal,
        defaultValue: body.defaultValue ? JSON.parse(JSON.stringify(body.defaultValue)) : undefined,
      },
    });

    return NextResponse.json({
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      type: flag.type,
      isGlobal: flag.isGlobal,
      defaultValue: flag.defaultValue,
      updatedAt: flag.updatedAt,
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      {
        error: 'Failed to update feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
