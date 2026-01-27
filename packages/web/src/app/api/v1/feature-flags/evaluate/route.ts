/**
 * Feature Flags API - Evaluate flag
 * 
 * POST /api/v1/feature-flags/evaluate - Evaluate a flag value
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { recordServiceUsage } from '@/shared/usage/usageEvent';
import { evaluateFlag } from '@/domain/featureFlags/evaluator';
import type { Environment } from '@/domain/featureFlags/types';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    // Try to authenticate, but allow unauthenticated access for playground
    let isAuthenticated = false;
    
    const auth = await authenticateApiKey(request);
    if (auth) {
      isAuthenticated = true;
    }
    // Unauthenticated access allowed for playground (graceful degradation)

    const body = await request.json();
    const { flagKey, environment, context } = body;

    if (!flagKey || !environment) {
      return NextResponse.json(
        { error: 'flagKey and environment are required' },
        { status: 400 }
      );
    }

    // For unauthenticated users, return demo evaluation
    if (!isAuthenticated) {
      return NextResponse.json({
        value: false,
        source: 'demo',
        environment: environment || 'production',
        metadata: {
          demo: true,
          message: 'This is a demo evaluation. Sign in to evaluate real feature flags.',
        },
      }, { status: 200 });
    }

    if (!auth || !auth.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    // Feature Flags doesn't require entitlement check - it's always available
    // Skip entitlement check for feature flags

    // Enforce usage limits (for authenticated users)
    if (isAuthenticated && auth?.billingAccountId) {
      const { enforceUsageLimit } = await import('@/middleware/usage-enforcement');
      const usageCheck = await enforceUsageLimit(request, auth, 1);
      if (!usageCheck.allowed && usageCheck.response) {
        return usageCheck.response;
      }
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
  } catch {
    // Never return 500 - always return 200 with demo evaluation for playground
    appLogger.error('Error evaluating feature flag', error);
    return NextResponse.json(
      {
        value: false,
        source: 'demo',
        environment: 'production',
        metadata: {
          demo: true,
          error: 'Failed to evaluate feature flag',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 200 }
    );
  }
}, { feature: 'Feature Flags Evaluation', allowPublic: true }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
