/**
 * Feature Flags API - CRUD operations
 * 
 * POST /api/v1/feature-flags - Create a flag
 * GET /api/v1/feature-flags - List flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { prisma } from '@/shared/db/prismaClient';
import { FlagType } from '@/domain/featureFlags/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request);

    if (!auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { key, name, description, type, isGlobal, defaultValue, projectId } = body;

    if (!key || !name) {
      return NextResponse.json(
        { error: 'key and name are required' },
        { status: 400 }
      );
    }

    const flagType: FlagType = type || 'boolean';

    // Create flag
    const flag = await prisma.featureFlag.create({
      data: {
        billingAccountId: auth.billingAccountId,
        projectId: projectId || null,
        key,
        name,
        description,
        type: flagType,
        isGlobal: isGlobal || false,
        defaultValue: defaultValue ? JSON.parse(JSON.stringify(defaultValue)) : null,
        metadata: {},
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
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
    });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    return NextResponse.json(
      {
        error: 'Failed to create feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request);

    if (!auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // List flags
    const flags = await prisma.featureFlag.findMany({
      where: {
        billingAccountId: auth.billingAccountId,
        projectId: projectId || undefined,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      flags: flags.map(flag => ({
        id: flag.id,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        type: flag.type,
        isGlobal: flag.isGlobal,
        defaultValue: flag.defaultValue,
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error listing feature flags:', error);
    return NextResponse.json(
      {
        error: 'Failed to list feature flags',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
