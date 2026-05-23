/**
 * Job Exceptions API - GET /api/jobs/[id]/exceptions
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { authenticateApiKey } from "@/shared/auth/apiKey";
import {
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { z } from "zod";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const JobIdSchema = z.string().uuid();
const QuerySchema = z.object({
  runId: z.string().uuid().optional(),
  matchType: z.enum(["unmatched", "conflict", "all"]).optional().default("all"),
  reviewed: z.enum(["true", "false", "all"]).optional().default("all"),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z
    .enum(["confidence", "amountDiff", "dateDiff", "createdAt"])
    .optional()
    .default("confidence"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
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

function runMetadataReferencesJob(metadata: unknown, jobId: string): boolean {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  const meta = metadata as Record<string, unknown>;
  const directCandidates = ["jobId", "job_id", "reconJobId", "recon_job_id"];
  for (const candidate of directCandidates) {
    if (meta[candidate] === jobId) {
      return true;
    }
  }

  const nested = meta.matchingConfig;
  if (nested && typeof nested === "object") {
    const nestedJobId = (nested as Record<string, unknown>).jobId;
    if (nestedJobId === jobId) {
      return true;
    }
  }

  return false;
}

/**
 * GET /api/jobs/[id]/exceptions
 * Get exceptions (unmatched transactions and conflicts) for a job
 */
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
      const startTime = Date.now();

      try {
        // Parse and validate id
        const { id } = await params;
        const validationResult = JobIdSchema.safeParse(id);

        if (!validationResult.success) {
          return NextResponse.json(
            {
              error: "Invalid job ID",
              message: "Job ID must be a valid UUID",
              details: validationResult.error.issues,
            },
            { status: 400 }
          );
        }

        // Parse and validate query parameters
        const { searchParams } = new URL(request.url);
        const queryParams = {
          runId: searchParams.get("runId") || undefined,
          matchType: searchParams.get("matchType") || "all",
          reviewed: searchParams.get("reviewed") || "all",
          limit: searchParams.get("limit") || "100",
          offset: searchParams.get("offset") || "0",
          sortBy: searchParams.get("sortBy") || "confidence",
          sortOrder: searchParams.get("sortOrder") || "desc",
        };

        const queryValidation = QuerySchema.safeParse(queryParams);
        if (!queryValidation.success) {
          return NextResponse.json(
            {
              error: "Invalid query parameters",
              message: "Query parameters validation failed",
              details: queryValidation.error.issues,
            },
            { status: 400 }
          );
        }

        const { runId, matchType, reviewed, limit, offset, sortBy, sortOrder } =
          queryValidation.data;

        // Authenticate request and derive scoped tenant context.
        let scopedTenantId: string | null = null;
        let userId: string | null = null;
        let memberTenantIds: string[] | null = null;

        try {
          const apiKeyAuth = await authenticateApiKey(request);
          if (apiKeyAuth?.tenantId) {
            scopedTenantId = apiKeyAuth.tenantId;
            userId = apiKeyAuth.userId || "api-key";
          } else {
            const scope = await resolveTenantMembershipScope();
            memberTenantIds = scope.tenantIds;
            userId = scope.userId;
          }
        } catch (error) {
          if (error instanceof TenantMembershipError) {
            return NextResponse.json(
              { error: error.message, code: error.code },
              { status: error.status }
            );
          }
          return NextResponse.json(
            {
              error: "Unauthorized",
              message: "Authentication required",
            },
            { status: 401 }
          );
        }

        if (!userId) {
          return NextResponse.json(
            {
              error: "Unauthorized",
              message: "Authentication required",
            },
            { status: 401 }
          );
        }

        // Verify job exists and belongs to authenticated scope.
        const job = await prisma.reconJob.findFirst({
          where: {
            id: id,
            deletedAt: null,
            ...(scopedTenantId
              ? { tenantId: scopedTenantId }
              : { tenantId: { in: memberTenantIds || [] } }),
          },
          select: { id: true, tenantId: true },
        });

        if (!job) {
          return NextResponse.json(
            {
              error: "Not found",
              message: `Reconciliation job ${id} not found`,
            },
            { status: 404 }
          );
        }

        const tenantId = job.tenantId;
        if (!tenantId) {
          return NextResponse.json(
            {
              error: "Not found",
              message: `Reconciliation job ${id} not found`,
            },
            { status: 404 }
          );
        }

        // Get reconciliation runs for this job
        // NOTE: Reconciliation runs are stored separately from recon jobs, so we use metadata
        // provenance linkage when present and fail closed to avoid cross-job leakage.
        const runs = await prisma.reconciliationRun.findMany({
          where: {
            tenantId: tenantId,
            ...(runId ? { id: runId } : {}),
          },
          select: { id: true, metadata: true },
        });

        const runIds = runs
          .filter((run: { metadata: unknown }) => runMetadataReferencesJob(run.metadata, id))
          .map((run: { id: string }) => run.id);

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
          ...(matchType === "unmatched" ? { matchType: "unmatched" } : {}),
          ...(matchType === "conflict" ? { matchType: "conflict" } : {}),
          ...(reviewed === "true" ? { reviewed: true } : {}),
          ...(reviewed === "false" ? { reviewed: false } : {}),
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
              matchType: "unmatched",
            },
          }),
          prisma.reconciliationMatch.count({
            where: {
              runId: { in: runIds },
              tenantId: tenantId,
              matchType: "conflict",
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
          confidence?: "asc" | "desc";
          amountDiff?: "asc" | "desc";
          dateDiff?: "asc" | "desc";
          createdAt: "asc" | "desc";
        } = {
          createdAt: sortOrder,
        };
        if (sortBy === "confidence") {
          orderBy.confidence = sortOrder;
        } else if (sortBy === "amountDiff") {
          orderBy.amountDiff = sortOrder;
        } else if (sortBy === "dateDiff") {
          orderBy.dateDiff = sortOrder;
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
          .map((m: { targetTransactionId: string | null }) => m.targetTransactionId)
          .filter((id: string | null): id is string => id !== null);

        const targetTransactions =
          targetTransactionIds.length > 0
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

        interface TargetTransaction {
          id: string;
          amount: number;
          currency: string;
          date: Date;
          description: string | null;
          externalId: string | null;
        }

        const targetTransactionMap = new Map(
          targetTransactions.map((t: TargetTransaction) => [t.id, t])
        );

        // Transform response
        const exceptions = matches.map((match: (typeof matches)[number]) => ({
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
          targetTransaction:
            match.targetTransactionId && targetTransactionMap.has(match.targetTransactionId)
              ? (() => {
                  const t = targetTransactionMap.get(
                    match.targetTransactionId
                  ) as TargetTransaction;
                  return {
                    id: t.id,
                    amount: Number(t.amount),
                    currency: t.currency,
                    date: t.date,
                    description: t.description,
                    externalId: t.externalId,
                  };
                })()
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
        appLogger.info("[Job Exceptions API] Success", {
          jobId: id,
          tenantId,
          userId,
          duration,
          exceptionCount: exceptions.length,
          totalCount,
        });

        return NextResponse.json(response, { status: 200 });
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;

        appLogger.error("[Job Exceptions API] Error", error, {
          errorMessage,
          stack: errorStack,
          duration,
        });

        return NextResponse.json(
          {
            exceptions: [],
            error: "Failed to fetch exceptions",
            message: "Please try again later or contact support if the issue persists",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
          },
          { status: 500 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);

// try catch
