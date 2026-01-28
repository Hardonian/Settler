/**
 * Reconciliation Jobs API - POST /api/v1/recon/jobs
 * 
 * Creates reconciliation jobs. Handles unauthenticated users gracefully
 * for playground access with demo/mock responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { requireActiveSubscription } from '@/lib/security/billing-enforcement';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/v1/recon/jobs
 * Create a reconciliation job
 */
export const POST = withSecurity(async function POST(request: NextRequest) {
  try {
    // Try to authenticate, but don't fail if unauthenticated (for playground)
    let isAuthenticated = false;
    
    const auth = await authenticateApiKey(request);
    if (auth) {
      isAuthenticated = true;
    }
    // Unauthenticated access allowed for playground (graceful degradation)

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name && !body.sourceAdapter) {
      return NextResponse.json(
        { error: 'name or sourceAdapter is required' },
        { status: 400 }
      );
    }

    // For unauthenticated users, return demo response
    if (!isAuthenticated) {
      const demoJobId = `demo_${Date.now()}`;
      const demoResponse = {
        id: demoJobId,
        jobId: demoJobId,
        name: body.name || 'Demo Reconciliation Job',
        status: 'queued',
        sourceAdapter: body.sourceAdapter || 'stripe',
        targetAdapter: body.targetAdapter || 'shopify',
        createdAt: new Date().toISOString(),
        message: 'This is a demo response. Sign in to create real reconciliation jobs.',
        demo: true,
      };

      return NextResponse.json(demoResponse, { status: 201 });
    }

    // CRITICAL: Enforce active subscription requirement
    const subscriptionCheck = await requireActiveSubscription(request, auth?.userId);
    if (!subscriptionCheck.allowed) {
      return subscriptionCheck.error!;
    }

    // For authenticated users, check billing account
    if (!auth?.billingAccountId) {
      return NextResponse.json(
        { error: 'Billing account required' },
        { status: 400 }
      );
    }

    // Enforce usage limits (for authenticated users)
    if (isAuthenticated && auth.billingAccountId) {
      const { enforceUsageLimit } = await import('@/middleware/usage-enforcement');
      const usageCheck = await enforceUsageLimit(request, auth, 1);
      if (!usageCheck.allowed && usageCheck.response) {
        return usageCheck.response;
      }
    }

    // Create reconciliation job using Prisma
    const { prisma } = await import('@/shared/db/prismaClient');
    
    // Get tenant ID from billing account
    const billingAccount = await prisma.billingAccount.findUnique({
      where: { id: auth.billingAccountId },
      select: { tenantId: true },
    });

    if (!billingAccount?.tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }
    
    // Create the job in the database
    // Store rules and options in metadata if schema doesn't support them directly
    if (!auth?.userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const job = await prisma.reconJob.create({
      data: {
        tenantId: billingAccount.tenantId,
        userId: auth.userId,
        name: body.name || 'Reconciliation Job',
        description: body.description || null,
        sourceAdapter: body.sourceAdapter,
        sourceConfigEncrypted: JSON.stringify(body.sourceConfig || {}),
        targetAdapter: body.targetAdapter,
        targetConfigEncrypted: JSON.stringify(body.targetConfig || {}),
        status: 'queued',
        validationRules: body.rules || [],
        scheduleCron: body.scheduleCron || null,
        scheduleTimezone: body.scheduleTimezone || 'UTC',
        metadata: {
          options: body.options || {},
        },
      },
    });

    // Track usage: Job creation counts as 1 transaction (will track actual transactions when job executes)
    try {
      const { trackReconciliationTransaction } = await import('@/middleware/usage-tracking');
      await trackReconciliationTransaction(
        auth.billingAccountId,
        billingAccount.tenantId,
        auth.userId,
        1, // Job creation = 1 usage event
        body.sourceAdapter
      );
    } catch (usageError) {
      // Don't fail job creation if usage tracking fails
      appLogger.error('[Recon Jobs API] Usage tracking failed', usageError);
    }

    const metadata = job.metadata as Record<string, unknown> | null;
    const validationRules = job.validationRules as Array<Record<string, unknown>> | null;
    const jobResponse = {
      id: job.id,
      jobId: job.id,
      name: job.name,
      status: job.status,
      sourceAdapter: job.sourceAdapter,
      targetAdapter: job.targetAdapter,
      rules: validationRules || [],
      options: metadata?.options || {},
      createdAt: job.createdAt.toISOString(),
      message: 'Reconciliation job created successfully. Processing will begin shortly.',
    };

    return NextResponse.json(jobResponse, { status: 201 });
  } catch (error) {
    // Never return 500 - always return 200 with error info for playground
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    appLogger.error('[Recon Jobs API] Error', error, { errorMessage });
    
    // Return 200 with error info instead of 500 to prevent playground crashes
    return NextResponse.json(
      {
        error: 'Failed to create reconciliation job',
        message: errorMessage,
        demo: true,
      },
      { status: 200 }
    );
  }
},
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: false }
);

/**
 * GET /api/v1/recon/jobs
 * List reconciliation jobs (demo for unauthenticated users)
 * 
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Tenant isolation
 * - Pagination support
 * - Filtering by status
 */
export const GET = withSecurity(async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '100', 10),
      1000
    );
    const offset = Math.max(
      parseInt(searchParams.get('offset') || '0', 10),
      0
    );

    // Try to authenticate, but don't fail if unauthenticated
    let isAuthenticated = false;
    let tenantId: string | null = null;
    let userId: string | null = null;
    
    const auth = await authenticateApiKey(request);
    if (auth) {
      isAuthenticated = true;
      tenantId = auth.tenantId || null;
      userId = auth.userId || null;
    } else {
      // Try Supabase auth as fallback (graceful degradation)
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          isAuthenticated = true;
          userId = user.id;
          // Get tenant from billing account
          const { prisma } = await import('@/shared/db/prismaClient');
          const billingAccount = await prisma.billingAccount.findFirst({
            where: { userId: user.id },
            select: { tenantId: true },
          });
          tenantId = billingAccount?.tenantId || null;
        }
      } catch (error) {
        // Unauthenticated access allowed for playground
      }
    }

    // For unauthenticated users, return demo response
    if (!isAuthenticated || !tenantId) {
      const demoJobs = [
        {
          id: 'demo_1',
          name: 'Demo Monthly Reconciliation',
          status: 'completed',
          sourceAdapter: 'stripe',
          targetAdapter: 'shopify',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          demo: true,
        },
      ];

      return NextResponse.json(demoJobs, { status: 200 });
    }

    // For authenticated users, fetch actual jobs from database
    const { prisma } = await import('@/shared/db/prismaClient');
    
    // Build where clause
    const whereClause: {
      tenantId: string;
      deletedAt: null;
      status?: string;
    } = {
      tenantId: tenantId,
      deletedAt: null,
      ...(status ? { status } : {}),
    };

    // Get total count for pagination
    const totalCount = await prisma.reconJob.count({
      where: whereClause,
    });

    // Fetch jobs with latest result
    const jobs = await prisma.reconJob.findMany({
      where: whereClause,
      include: {
        results: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 1, // Latest result only
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transform response
    const response = jobs.map((job) => {
      const latestResult = job.results.length > 0 ? job.results[0] : null;
      
      return {
        id: job.id,
        name: job.name,
        description: job.description,
        status: job.status,
        sourceAdapter: job.sourceAdapter,
        targetAdapter: job.targetAdapter,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        scheduleCron: job.scheduleCron,
        scheduleTimezone: job.scheduleTimezone,
        latestResult: latestResult ? {
          id: latestResult.id,
          status: latestResult.status,
          startedAt: latestResult.startedAt.toISOString(),
          completedAt: latestResult.completedAt?.toISOString() || null,
          matchedCount: latestResult.matchedCount,
          unmatchedSourceCount: latestResult.unmatchedSourceCount,
          unmatchedTargetCount: latestResult.unmatchedTargetCount,
          conflictCount: latestResult.conflictCount,
          confidenceAvg: latestResult.confidenceAvg ? Number(latestResult.confidenceAvg) : null,
          errorMessage: latestResult.errorMessage,
        } : null,
      };
    });

    // Log successful request
    const duration = Date.now() - startTime;
    appLogger.info('[Recon Jobs API] Success', {
      tenantId,
      userId,
      duration,
      jobCount: jobs.length,
      totalCount,
    });

    return NextResponse.json({
      data: response,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    }, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    appLogger.error('[Recon Jobs API] Error', error, {
      error: errorMessage,
      stack: errorStack,
      duration,
    });
    
    // Return empty array on error (graceful degradation)
    return NextResponse.json({
      data: [],
      pagination: {
        total: 0,
        limit: 100,
        offset: 0,
        hasMore: false,
      },
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    }, { status: 200 });
  }
},
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
