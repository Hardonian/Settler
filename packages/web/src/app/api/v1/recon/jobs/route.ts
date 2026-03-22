/**
 * Reconciliation Jobs API
 *
 * Production endpoints for creating and listing reconciliation jobs.
 * All handlers require authentication — unauthenticated requests receive 401.
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/shared/auth/apiKey";
import { requireActiveSubscription } from "@/lib/security/billing-enforcement";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/v1/recon/jobs
 * Create a reconciliation job
 */
export const POST = withSecurity(
  async function POST(request: NextRequest) {
    try {
      // Authenticate — production endpoints require valid API key
      const auth = await authenticateApiKey(request);
      if (!auth) {
        return NextResponse.json(
          {
            error: "Authentication required",
            code: "SETTLER_UNAUTHORIZED",
            message: "A valid API key is required. For demo access, use /api/demo/* endpoints.",
          },
          { status: 401 }
        );
      }

      // Parse request body
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      // Validate required fields
      if (!body.name && !body.sourceAdapter) {
        return NextResponse.json({ error: "name or sourceAdapter is required" }, { status: 400 });
      }
      // CRITICAL: Enforce active subscription requirement
      const subscriptionCheck = await requireActiveSubscription(request, auth?.userId);
      if (!subscriptionCheck.allowed) {
        return subscriptionCheck.error!;
      }

      // For authenticated users, check billing account
      if (!auth?.billingAccountId) {
        return NextResponse.json({ error: "Billing account required" }, { status: 402 });
      }

      // Enforce usage limits
      if (auth.billingAccountId) {
        const { enforceUsageLimit } = await import("@/middleware/usage-enforcement");
        const usageCheck = await enforceUsageLimit(request, auth, 1);
        if (!usageCheck.allowed && usageCheck.response) {
          return usageCheck.response;
        }
      }

      // Create reconciliation job using Prisma
      const { prisma } = await import("@/shared/db/prismaClient");

      // Get tenant ID from billing account
      const billingAccount = await prisma.billingAccount.findUnique({
        where: { id: auth.billingAccountId },
        select: { tenantId: true },
      });

      if (!billingAccount?.tenantId) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
      }

      // Create the job in the database
      // Store rules and options in metadata if schema doesn't support them directly
      if (!auth?.userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
      }

      const job = await prisma.reconJob.create({
        data: {
          tenantId: billingAccount.tenantId,
          userId: auth.userId,
          name: body.name || "Reconciliation Job",
          description: body.description || null,
          sourceAdapter: body.sourceAdapter,
          sourceConfigEncrypted: JSON.stringify(body.sourceConfig || {}),
          targetAdapter: body.targetAdapter,
          targetConfigEncrypted: JSON.stringify(body.targetConfig || {}),
          // ReconCoreEngine only executes jobs in active status.
          status: "active",
          validationRules: body.rules || [],
          scheduleCron: body.scheduleCron || null,
          scheduleTimezone: body.scheduleTimezone || "UTC",
          metadata: {
            options: body.options || {},
          },
        },
      });

      // Track usage: Job creation counts as 1 transaction (will track actual transactions when job executes)
      try {
        const { trackReconciliationTransaction } = await import("@/middleware/usage-tracking");
        await trackReconciliationTransaction(
          auth.billingAccountId,
          billingAccount.tenantId,
          auth.userId,
          1, // Job creation = 1 usage event
          body.sourceAdapter
        );
      } catch (usageError) {
        // Don't fail job creation if usage tracking fails
        appLogger.error("[Recon Jobs API] Usage tracking failed", usageError);
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
        message: "Reconciliation job created successfully. Processing will begin shortly.",
      };

      return NextResponse.json(jobResponse, { status: 201 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      appLogger.error("[Recon Jobs API] Error", error, { errorMessage });

      return NextResponse.json(
        {
          error: "Failed to create reconciliation job",
          message: errorMessage,
        },
        { status: 500 }
      );
    }
  },
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

/**
 * GET /api/v1/recon/jobs
 * List reconciliation jobs for the authenticated tenant.
 */
export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") || undefined;
      const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 1000);
      const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

      // Authenticate — production endpoints require valid API key or session
      let tenantId: string | null = null;
      let userId: string | null = null;

      const auth = await authenticateApiKey(request);
      if (auth) {
        tenantId = auth.tenantId || null;
        userId = auth.userId || null;
      } else {
        // Try Supabase auth as fallback for console users
        try {
          const { createClient } = await import("@/lib/supabase/server");
          const supabase = await createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            userId = user.id;
            const { prisma } = await import("@/shared/db/prismaClient");
            const billingAccount = await prisma.billingAccount.findFirst({
              where: { userId: user.id },
              select: { tenantId: true },
            });
            tenantId = billingAccount?.tenantId || null;
          }
        } catch {
          // Auth failed — reject below
        }
      }

      if (!tenantId) {
        return NextResponse.json(
          {
            error: "Authentication required",
            code: "SETTLER_UNAUTHORIZED",
            message:
              "A valid API key or session is required. For demo access, use /api/demo/* endpoints.",
          },
          { status: 401 }
        );
      }

      // For authenticated users, fetch actual jobs from database
      const { prisma } = await import("@/shared/db/prismaClient");

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
              startedAt: "desc",
            },
            take: 1, // Latest result only
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      });

      // Transform response
      const response = jobs.map((job: (typeof jobs)[0]) => {
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
          latestResult: latestResult
            ? {
                id: latestResult.id,
                status: latestResult.status,
                startedAt: latestResult.startedAt.toISOString(),
                completedAt: latestResult.completedAt?.toISOString() || null,
                matchedCount: latestResult.matchedCount,
                unmatchedSourceCount: latestResult.unmatchedSourceCount,
                unmatchedTargetCount: latestResult.unmatchedTargetCount,
                conflictCount: latestResult.conflictCount,
                confidenceAvg: latestResult.confidenceAvg
                  ? Number(latestResult.confidenceAvg)
                  : null,
                errorMessage: latestResult.errorMessage,
              }
            : null,
        };
      });

      // Log successful request
      const duration = Date.now() - startTime;
      appLogger.info("[Recon Jobs API] Success", {
        tenantId,
        userId,
        duration,
        jobCount: jobs.length,
        totalCount,
      });

      return NextResponse.json(
        {
          data: response,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      appLogger.error("[Recon Jobs API] Error", error, {
        error: errorMessage,
        stack: errorStack,
        duration,
      });

      return NextResponse.json(
        { error: "Failed to retrieve reconciliation jobs" },
        { status: 500 }
      );
    }
  },
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
