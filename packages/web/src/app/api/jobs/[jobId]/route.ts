/**
 * Job Detail API - GET /api/jobs/[jobId]
 * 
 * Returns detailed information about a reconciliation job including:
 * - Job configuration
 * - Execution results
 * - Match statistics
 * - Unmatched transactions
 * - Error information
 * 
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Tenant isolation
 * - Idempotent operations
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

interface JobDetailResponse {
  id: string;
  name: string;
  description: string | null;
  status: string;
  sourceAdapter: string;
  targetAdapter: string;
  createdAt: Date;
  updatedAt: Date;
  results: Array<{
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    sourceCount: number;
    targetCount: number;
    matchedCount: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflictCount: number;
    totalAmountSource: number | null;
    totalAmountTarget: number | null;
    totalAmountMatched: number | null;
    totalAmountUnmatched: number | null;
    currency: string | null;
    confidenceAvg: number | null;
    confidenceMin: number | null;
    confidenceMax: number | null;
    durationMs: bigint | null;
    errorMessage: string | null;
    summary: Record<string, unknown>;
  }>;
  latestResult: {
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    sourceCount: number;
    targetCount: number;
    matchedCount: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflictCount: number;
    totalAmountSource: number | null;
    totalAmountTarget: number | null;
    totalAmountMatched: number | null;
    totalAmountUnmatched: number | null;
    currency: string | null;
    confidenceAvg: number | null;
    confidenceMin: number | null;
    confidenceMax: number | null;
    durationMs: bigint | null;
    errorMessage: string | null;
    summary: Record<string, unknown>;
  } | null;
  schedule: {
    cron: string | null;
    timezone: string;
  } | null;
}

/**
 * GET /api/jobs/[jobId]
 * Get detailed job information
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
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Authenticate request
    let auth;
    let tenantId: string | null = null;
    let userId: string | null = null;

    try {
      auth = await authenticateApiKey(request);
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
            // Get tenant from billing account
            const billingAccount = await prisma.billingAccount.findFirst({
              where: { userId: user.id },
              select: { tenantId: true },
            });
            tenantId = billingAccount?.tenantId || null;
          }
        } catch (error) {
          // Both auth methods failed
          return NextResponse.json(
            {
              error: 'Unauthorized',
              message: 'Authentication required',
            },
            { status: 401 }
          );
        }
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      );
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

    // Fetch job with results
    const job = await prisma.reconJob.findFirst({
      where: {
        id: jobId,
        tenantId: tenantId,
        deletedAt: null,
      },
      include: {
        results: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 10, // Last 10 results
        },
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

    // Get latest result
    const latestResult = job.results.length > 0 ? job.results[0] : null;

    // Transform response
    const response: JobDetailResponse = {
      id: job.id,
      name: job.name,
      description: job.description,
      status: job.status,
      sourceAdapter: job.sourceAdapter,
      targetAdapter: job.targetAdapter,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      results: job.results.map((result) => ({
        id: result.id,
        status: result.status,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        sourceCount: result.sourceCount,
        targetCount: result.targetCount,
        matchedCount: result.matchedCount,
        unmatchedSourceCount: result.unmatchedSourceCount,
        unmatchedTargetCount: result.unmatchedTargetCount,
        conflictCount: result.conflictCount,
        totalAmountSource: result.totalAmountSource ? Number(result.totalAmountSource) : null,
        totalAmountTarget: result.totalAmountTarget ? Number(result.totalAmountTarget) : null,
        totalAmountMatched: result.totalAmountMatched ? Number(result.totalAmountMatched) : null,
        totalAmountUnmatched: result.totalAmountUnmatched ? Number(result.totalAmountUnmatched) : null,
        currency: result.currency,
        confidenceAvg: result.confidenceAvg ? Number(result.confidenceAvg) : null,
        confidenceMin: result.confidenceMin ? Number(result.confidenceMin) : null,
        confidenceMax: result.confidenceMax ? Number(result.confidenceMax) : null,
        durationMs: result.durationMs,
        errorMessage: result.errorMessage,
        summary: result.summary as Record<string, unknown>,
      })),
      latestResult: latestResult ? {
        id: latestResult.id,
        status: latestResult.status,
        startedAt: latestResult.startedAt,
        completedAt: latestResult.completedAt,
        sourceCount: latestResult.sourceCount,
        targetCount: latestResult.targetCount,
        matchedCount: latestResult.matchedCount,
        unmatchedSourceCount: latestResult.unmatchedSourceCount,
        unmatchedTargetCount: latestResult.unmatchedTargetCount,
        conflictCount: latestResult.conflictCount,
        totalAmountSource: latestResult.totalAmountSource ? Number(latestResult.totalAmountSource) : null,
        totalAmountTarget: latestResult.totalAmountTarget ? Number(latestResult.totalAmountTarget) : null,
        totalAmountMatched: latestResult.totalAmountMatched ? Number(latestResult.totalAmountMatched) : null,
        totalAmountUnmatched: latestResult.totalAmountUnmatched ? Number(latestResult.totalAmountUnmatched) : null,
        currency: latestResult.currency,
        confidenceAvg: latestResult.confidenceAvg ? Number(latestResult.confidenceAvg) : null,
        confidenceMin: latestResult.confidenceMin ? Number(latestResult.confidenceMin) : null,
        confidenceMax: latestResult.confidenceMax ? Number(latestResult.confidenceMax) : null,
        durationMs: latestResult.durationMs,
        errorMessage: latestResult.errorMessage,
        summary: latestResult.summary as Record<string, unknown>,
      } : null,
      schedule: job.scheduleCron ? {
        cron: job.scheduleCron,
        timezone: job.scheduleTimezone,
      } : null,
    };

    // Log successful request
    const duration = Date.now() - startTime;
    appLogger.info('[Job Detail API] Success', {
      jobId,
      tenantId,
      userId,
      duration,
      resultCount: job.results.length,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    appLogger.error('[Job Detail API] Error', error, {
      errorMessage,
      stack: errorStack,
      duration,
    });

    // Never return 500 - return graceful error response
    return NextResponse.json(
      {
        error: 'Failed to fetch job details',
        message: 'Please try again later or contact support if the issue persists',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        job: null,
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);