/**
 * Job Progress API - GET /api/jobs/[jobId]/progress
 * 
 * Returns real-time progress information for a running reconciliation job.
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Tenant isolation
 * - Real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { authenticateApiKey } from '@/shared/auth/apiKey';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const JobIdSchema = z.string().uuid();

interface ProgressResponse {
  jobId: string;
  status: string;
  progress: {
    stage: string;
    percentage: number;
    message: string;
    startedAt: Date;
    estimatedCompletionAt: Date | null;
  } | null;
  currentResult: {
    id: string;
    status: string;
    startedAt: Date;
    sourceCount: number;
    targetCount: number;
    matchedCount: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
  } | null;
}

/**
 * GET /api/jobs/[jobId]/progress
 * Get job progress
 */
export const GET = withSecurity(
  withUniversalBillingGate(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Parse and validate jobId
    const { jobId } = await params;
    const validationResult = JobIdSchema.safeParse(jobId);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid job ID',
          message: 'Job ID must be a valid UUID',
        },
        { status: 400 }
      );
    }

    // Authenticate request
    let tenantId: string | null = null;
    let userId: string | null = null;

    const auth = await authenticateApiKey(request);
    if (auth) {
      tenantId = auth.tenantId || null;
      userId = auth.userId || null;
    } else {
      // Try Supabase auth as fallback (graceful degradation)
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          const billingAccount = await prisma.billingAccount.findFirst({
            where: { userId: user.id },
            select: { tenantId: true },
          });
          tenantId = billingAccount?.tenantId || null;
        }
      } catch {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
          },
          { status: 401 }
        );
      }
    }

    if (!tenantId || !userId) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Tenant ID and User ID required',
        },
        { status: 401 }
      );
    }

    // Fetch job
    const job = await prisma.reconJob.findFirst({
      where: {
        id: jobId,
        tenantId: tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: `Reconciliation job ${jobId} not found`,
        },
        { status: 404 }
      );
    }

    // Fetch latest running result
    const currentResult = await prisma.reconResult.findFirst({
      where: {
        reconJobId: jobId,
        tenantId: tenantId,
        status: 'running',
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    // Calculate progress from metadata or result state
    let progress: ProgressResponse['progress'] = null;

    if (currentResult) {
      const metadata = currentResult.metadata as Record<string, unknown> | null;
      const progressData = metadata?.progress as {
        stage?: string;
        percentage?: number;
        message?: string;
      } | undefined;

      if (progressData) {
        progress = {
          stage: progressData.stage || 'processing',
          percentage: progressData.percentage || 0,
          message: progressData.message || 'Processing...',
          startedAt: currentResult.startedAt,
          estimatedCompletionAt: null, // Could calculate based on historical data
        };
      } else {
        // Estimate progress based on result counts
        const totalExpected = currentResult.sourceCount + currentResult.targetCount;
        const completed = currentResult.matchedCount + currentResult.unmatchedSourceCount + currentResult.unmatchedTargetCount;
        const percentage = totalExpected > 0 ? Math.round((completed / totalExpected) * 100) : 0;

        progress = {
          stage: 'matching',
          percentage,
          message: `Matched ${currentResult.matchedCount} transactions`,
          startedAt: currentResult.startedAt,
          estimatedCompletionAt: null,
        };
      }
    }

    const response: ProgressResponse = {
      jobId: job.id,
      status: job.status,
      progress,
      currentResult: currentResult ? {
        id: currentResult.id,
        status: currentResult.status,
        startedAt: currentResult.startedAt,
        sourceCount: currentResult.sourceCount,
        targetCount: currentResult.targetCount,
        matchedCount: currentResult.matchedCount,
        unmatchedSourceCount: currentResult.unmatchedSourceCount,
        unmatchedTargetCount: currentResult.unmatchedTargetCount,
      } : null,
    };

    // Log successful request
    const duration = Date.now() - startTime;
    appLogger.info('[Job Progress API] Success', {
      jobId,
      tenantId,
      userId,
      duration,
      hasProgress: progress !== null,
    });

    return NextResponse.json(response, { status: 200 });
  } catch {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    appLogger.error('[Job Progress API] Error', error, {
      error: errorMessage,
      stack: errorStack,
      duration,
    });

    // Never return 500 - return graceful error response
    return NextResponse.json(
      {
        progress: null,
        error: 'Failed to fetch job progress',
        message: 'Please try again later or contact support if the issue persists',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);