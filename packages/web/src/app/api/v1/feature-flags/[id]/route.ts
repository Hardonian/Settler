/**
 * Feature Flags API - Update flag
 * 
 * PATCH /api/v1/feature-flags/:id - Update flag settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { prisma } from '@/shared/db/prismaClient';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withUniversalBillingGate(async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Try to authenticate, but allow unauthenticated access for playground
    let auth: Awaited<ReturnType<typeof authenticateApiKey>> | undefined;
    let isAuthenticated = false;
    
    try {
      auth = await authenticateApiKey(request);
      isAuthenticated = true;
    } catch (error) {
      // Unauthenticated access allowed for playground - will return demo response
      auth = undefined;
    }

    const { id } = await params;
    const body = await request.json();

    // For unauthenticated users, return demo response
    if (!isAuthenticated) {
      return NextResponse.json({
        id: `demo_${id}`,
        key: 'demo_flag',
        name: body.name || 'Demo Feature Flag',
        description: body.description || 'This is a demo response',
        type: 'boolean',
        isGlobal: false,
        defaultValue: false,
        updatedAt: new Date().toISOString(),
        demo: true,
        message: 'This is a demo response. Sign in to update real feature flags.',
      }, { status: 200 });
    }

    if (!auth || !auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    // Verify flag belongs to billing account
    const existing = await prisma.featureFlag.findFirst({
      where: {
        id,
        billingAccountId: auth!.billingAccountId,
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
      where: { id },
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
    // Never return 500 - always return 200 with error info for playground
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      {
        error: 'Failed to update feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
      },
      { status: 200 }
    );
  }
}, { feature: 'PATCH API' });
