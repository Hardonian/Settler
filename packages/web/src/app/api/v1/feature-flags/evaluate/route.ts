/**
 * Feature Flags API - Evaluate flag
 * 
 * POST /api/v1/feature-flags/evaluate - Evaluate a flag value
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { recordServiceUsage } from '@/shared/usage/usageEvent';
import { evaluateFlag } from '@/domain/featureFlags/evaluator';
import { Environment } from '@/domain/featureFlags/types';
import { checkRequestEntitlement, createEntitlementErrorResponse } from '@/shared/middleware/entitlements';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request);

    if (!auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    // Check entitlement (Feature Flags has generous limits, but still check)
    const entitlement = await checkRequestEntitlement(auth, 'featureFlags');
    if (!entitlement.allowed && entitlement.error) {
      return createEntitlementErrorResponse(entitlement.error);
    }

    const body = await request.json();
    const { flagKey, environment, context } = body;

    if (!flagKey || !environment) {
      return NextResponse.json(
        { error: 'flagKey and environment are required' },
        { status: 400 }
      );
    }

    // Evaluate flag
    const result = await evaluateFlag({
      flagKey,
      environment: environment as Environment,
      billingAccountId: auth.billingAccountId,
      projectId: context?.projectId,
      context: {
        userId: context?.userId || auth.userId,
        tenantId: context?.tenantId || auth.tenantId,
        ...context,
      },
    });

    // Record usage (free tier, but still track for observability)
    await recordServiceUsage({
      billingAccountId: auth.billingAccountId,
      service: 'settler-feature-flags',
      operation: 'evaluate',
      quantity: 1,
      metadata: {
        flagKey,
        environment,
        source: result.source,
      },
    });

    return NextResponse.json({
      value: result.value,
      source: result.source,
      environment: result.environment,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Error evaluating feature flag:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
