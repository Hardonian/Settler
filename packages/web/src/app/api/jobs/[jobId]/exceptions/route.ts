/**
 * Job Exceptions API - GET /api/jobs/[jobId]/exceptions
 * 
 * Returns unmatched transactions and conflicts for a reconciliation job.
 * Supports filtering, pagination, and sorting.
 * 
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Tenant isolation
 * - Pagination support
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
const QuerySchema = z.object({
  runId: z.string().uuid().optional(),
  matchType: z.enum(['unmatched', 'conflict', 'all']).optional().default('all'),
  reviewed: z.enum(['true', 'false', 'all']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['confidence', 'amountDiff', 'dateDiff', 'createdAt']).optional().default('confidence'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

interface ExceptionResponse {
  exceptions: Array<{
    id: string;
    runId: string;
    sourceTransactionId: string;
    targetTransactionId: string | null;
    matchType: string;
    confidence: number;
    matchReason: string | null;
    amountDiff: number | null;
    dateDiff: number | null;
    reviewed: boolean;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    sourceTransaction: {
      id: string;
      amount: number;
      currency: string;
      date: Date;
      description: string | null;
      externalId: string | null;
    };
    targetTransaction: {
      id: string;
      amount: number;
      currency: string;
      date: Date;
      description: string | null;
      externalId: string | null;
    } | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalUnmatched: number;
    totalConflicts: number;
    totalReviewed: number;
    totalUnreviewed: number;
  };
}

/**
 * GET /api/jobs/[jobId]/exceptions
 * Get exceptions (unmatched transactions and conflicts) for a job
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      runId: searchParams.get('runId') || undefined,
      matchType: searchParams.get('matchType') || 'all',
      reviewed: searchParams.get('reviewed') || 'all',
      limit: searchParams.get('limit') || '100',
      offset: searchParams.get('offset') || '0',
      sortBy: searchParams.get('sortBy') || 'confidence',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const queryValidation = QuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          message: 'Query parameters validation failed',
          details: queryValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      runId,
      matchType,
      reviewed,
      limit,
      offset,
      sortBy,
      sortOrder,
    } = queryValidation.data;

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
        } catch (supabaseError) {
          return NextResponse.json(
            {
              error: 'Unauthorized',
              message: 'Authentication required',
            },
            { status: 401 }
          );
        }
      }
    } catch (authError) {
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

    // Verify job exists and belongs to tenant
    const job = await prisma.reconJob.findFirst({
      where: {
        id: jobId,
        tenantId: tenantId,
        deletedAt: null,
      },
      select: { id: true },
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

    // Get reconciliation runs for this job
    const runs = await prisma.reconciliationRun.findMany({
      where: {
        tenantId: tenantId,
        ...(runId ? { id: runId } : {}),
      },
      select: { id: true },
    });

    const runIds = runs.map((r) => r.id);

    if (runIds.length === 0) {
      return NextResponse.json({
        exceptions: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
        summary: {
          totalUnmatched: 0,
          totalConflicts: 0,
          totalReviewed: 0,
          totalUnreviewed: 0,
        },
      });
    }

    // Build where clause for matches
    const whereClause: {
      runId?: { in: string[] };
      tenantId: string;
      matchType?: string;
      reviewed?: boolean;
    } = {
      runId: { in: runIds },
      tenantId: tenantId,
      ...(matchType === 'unmatched' ? { matchType: 'unmatched' } : {}),
      ...(matchType === 'conflict' ? { matchType: 'conflict' } : {}),
      ...(reviewed === 'true' ? { reviewed: true } : {}),
      ...(reviewed === 'false' ? { reviewed: false } : {}),
    };

    // Get total count for pagination
    const totalCount = await prisma.reconciliationMatch.count({
      where: whereClause,
    });

    // Get summary counts
    const [totalUnmatched, totalConflicts, totalReviewed, totalUnreviewed] = await Promise.all([
      prisma.reconciliationMatch.count({
        where: {
          runId: { in: runIds },
          tenantId: tenantId,
          matchType: 'unmatched',
        },
      }),
      prisma.reconciliationMatch.count({
        where: {
          runId: { in: runIds },
          tenantId: tenantId,
          matchType: 'conflict',
        },
      }),
      prisma.reconciliationMatch.count({
        where: {
          runId: { in: runIds },
          tenantId: tenantId,
          reviewed: true,
        },
      }),
      prisma.reconciliationMatch.count({
        where: {
          runId: { in: runIds },
          tenantId: tenantId,
          reviewed: false,
        },
      }),
    ]);

    // Build orderBy clause
    const orderBy: {
      confidence?: 'asc' | 'desc';
      amountDiff?: 'asc' | 'desc';
      dateDiff?: 'asc' | 'desc';
      createdAt: 'asc' | 'desc';
    } = {};
    if (sortBy === 'confidence') {
      orderBy.confidence = sortOrder;
    } else if (sortBy === 'amountDiff') {
      orderBy.amountDiff = sortOrder;
    } else if (sortBy === 'dateDiff') {
      orderBy.dateDiff = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Fetch exceptions with source and target transactions
    const matches = await prisma.reconciliationMatch.findMany({
      where: whereClause,
      include: {
        sourceTransaction: {
          select: {
            id: true,
            amount: true,
            currency: true,
            date: true,
            description: true,
            externalId: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Fetch target transactions for matches that have them
    const targetTransactionIds = matches
      .map((m) => m.targetTransactionId)
      .filter((id): id is string => id !== null);

    const targetTransactions = targetTransactionIds.length > 0
      ? await prisma.normalizedTransaction.findMany({
          where: {
            id: { in: targetTransactionIds },
            tenantId: tenantId,
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            date: true,
            description: true,
            externalId: true,
          },
        })
      : [];

    const targetTransactionMap = new Map(
      targetTransactions.map((t) => [t.id, t])
    );

    // Transform response
    const exceptions = matches.map((match) => ({
      id: match.id,
      runId: match.runId,
      sourceTransactionId: match.sourceTransactionId,
      targetTransactionId: match.targetTransactionId,
      matchType: match.matchType,
      confidence: Number(match.confidence),
      matchReason: match.matchReason,
      amountDiff: match.amountDiff ? Number(match.amountDiff) : null,
      dateDiff: match.dateDiff,
      reviewed: match.reviewed,
      reviewedBy: match.reviewedBy,
      reviewedAt: match.reviewedAt,
      sourceTransaction: {
        id: match.sourceTransaction.id,
        amount: Number(match.sourceTransaction.amount),
        currency: match.sourceTransaction.currency,
        date: match.sourceTransaction.date,
        description: match.sourceTransaction.description,
        externalId: match.sourceTransaction.externalId,
      },
      targetTransaction: match.targetTransactionId && targetTransactionMap.has(match.targetTransactionId)
        ? {
            id: targetTransactionMap.get(match.targetTransactionId)!.id,
            amount: Number(targetTransactionMap.get(match.targetTransactionId)!.amount),
            currency: targetTransactionMap.get(match.targetTransactionId)!.currency,
            date: targetTransactionMap.get(match.targetTransactionId)!.date,
            description: targetTransactionMap.get(match.targetTransactionId)!.description,
            externalId: targetTransactionMap.get(match.targetTransactionId)!.externalId,
          }
        : null,
      metadata: match.metadata as Record<string, unknown>,
      createdAt: match.createdAt,
    }));

    const response: ExceptionResponse = {
      exceptions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      summary: {
        totalUnmatched,
        totalConflicts,
        totalReviewed,
        totalUnreviewed,
      },
    };

    // Log successful request
    const duration = Date.now() - startTime;
    appLogger.info('[Job Exceptions API] Success', {
      jobId,
      tenantId,
      userId,
      duration,
      exceptionCount: exceptions.length,
      totalCount,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    appLogger.error('[Job Exceptions API] Error', error, {
      errorMessage,
      stack: errorStack,
      duration,
    });

    // Never return 500 - return empty exceptions array with graceful error message
    return NextResponse.json(
      {
        exceptions: [],
        error: 'Failed to fetch exceptions',
        message: 'Please try again later or contact support if the issue persists',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);