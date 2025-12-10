/**
 * Reconcile API - POST /api/v1/recon/jobs
 * 
 * Create a reconciliation job to compare data from two sources.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { prisma } from '@/shared/db/prismaClient';
import { recordServiceUsage } from '@/shared/usage/usageEvent';
import { checkRequestEntitlement, createEntitlementErrorResponse } from '@/shared/middleware/entitlements';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for reconciliation

export async function POST(request: NextRequest) {
  try {
    // Authenticate API key
    const auth = await authenticateApiKey(request);

    if (!auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    // Check entitlement
    const entitlement = await checkRequestEntitlement(auth, 'reconcile');
    if (!entitlement.allowed && entitlement.error) {
      return createEntitlementErrorResponse(entitlement.error);
    }

    const body = await request.json();
    const { name, description, sourceAdapter, sourceConfig, targetAdapter, targetConfig, mappingTemplateId, transformRecipeId, validationRules } = body;

    if (!name || !sourceAdapter || !targetAdapter) {
      return NextResponse.json(
        { error: 'name, sourceAdapter, and targetAdapter are required' },
        { status: 400 }
      );
    }

    // Get tenant ID from auth
    const tenantId = auth.tenantId || crypto.randomUUID(); // Fallback if not in auth
    const userId = auth.userId || crypto.randomUUID(); // Fallback if not in auth

    // Create reconciliation job
    const job = await prisma.reconJob.create({
      data: {
        tenantId,
        userId,
        name,
        description,
        sourceAdapter,
        sourceConfigEncrypted: JSON.stringify(sourceConfig || {}),
        targetAdapter,
        targetConfigEncrypted: JSON.stringify(targetConfig || {}),
        mappingTemplateId,
        transformRecipeId,
        validationRules: (validationRules || []) as unknown as Record<string, unknown>,
        status: 'active',
      },
    });

    // Record usage
    await recordServiceUsage({
      billingAccountId: auth.billingAccountId,
      service: 'settler-reconcile',
      operation: 'create_job',
      quantity: 1,
      metadata: {
        jobId: job.id,
        sourceAdapter,
        targetAdapter,
      },
    });

    return NextResponse.json({
      id: job.id,
      name: job.name,
      description: job.description,
      sourceAdapter: job.sourceAdapter,
      targetAdapter: job.targetAdapter,
      status: job.status,
      createdAt: job.createdAt,
    });
  } catch (error) {
    console.error('Reconciliation job creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create reconciliation job',
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const tenantId = auth.tenantId || crypto.randomUUID();

    const jobs = await prisma.reconJob.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        deletedAt: null,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        sourceAdapter: true,
        targetAdapter: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      jobs,
    });
  } catch (error) {
    console.error('Error listing reconciliation jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to list reconciliation jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
