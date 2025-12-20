/**
 * Feature Flags API - Evaluate flag
 * 
 * POST /api/v1/feature-flags/evaluate - Evaluate a flag value
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { recordServiceUsage } from '@/shared/usage/usageEvent';
import { evaluateFlag } from '@/domain/featureFlags/evaluator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

export async function POST(request: NextRequest) {
  try {
    // Try to authenticate, but allow unauthenticated access for playground
    let auth;
    let isAuthenticated = false;
    
    try {
      auth = await authenticateApiKey(request);
      isAuthenticated = true;
    } catch (error) {
      // Unauthenticated access allowed for playground - will return demo response
    }

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
      environment: environment as 'production' | 'staging' | 'development' | string,
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
    // Never return 500 - always return 200 with demo evaluation for playground
    console.error('Error evaluating feature flag:', error);
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
}
