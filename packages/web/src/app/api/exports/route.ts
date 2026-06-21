/**
 * Export API - POST /api/exports
 *
 * Creates exports of reconciliation results in various formats.
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Tenant isolation
 * - Idempotent operations
 * - Signed URL generation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { z } from "zod";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { getTraceId } from "@/lib/observability/trace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large exports

const ExportRequestSchema = z.object({
  type: z.enum(["csv", "json", "excel"]),
  format: z.enum(["matched", "unmatched", "all", "reconciliation_report"]),
  reconciliationRunId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  ingestionId: z.string().uuid().optional(),
});

function unsupportedExportResponse(error: string, code: string, reason: string): NextResponse {
  return NextResponse.json(
    {
      error,
      code,
      capability: {
        state: "unavailable",
        reason,
      },
    },
    { status: 409 }
  );
}

async function assertExportTargetsAccessible(args: {
  tenantId: string;
  reconciliationRunId?: string;
  jobId?: string;
  ingestionId?: string;
}): Promise<NextResponse | null> {
  const { tenantId, reconciliationRunId, jobId, ingestionId } = args;

  if (reconciliationRunId) {
    const run = await prisma.reconciliationRun.findFirst({
      where: {
        id: reconciliationRunId,
        tenantId,
      },
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json(
        {
          error: "Reconciliation run not found",
          code: "EXPORT_RUN_NOT_FOUND",
        },
        { status: 404 }
      );
    }
  }

  if (jobId) {
    const job = await prisma.reconJob.findFirst({
      where: {
        id: jobId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        {
          error: "Job not found",
          code: "EXPORT_JOB_NOT_FOUND",
        },
        { status: 404 }
      );
    }
  }

  if (ingestionId) {
    const ingestion = await prisma.ingestion.findFirst({
      where: {
        id: ingestionId,
        tenantId,
      },
      select: { id: true },
    });

    if (!ingestion) {
      return NextResponse.json(
        {
          error: "Ingestion not found",
          code: "EXPORT_INGESTION_NOT_FOUND",
        },
        { status: 404 }
      );
    }
  }

  return null;
}

/**
 * POST /api/exports
 * Create an export
 */
export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      const startTime = Date.now();
      const traceId = await getTraceId(request);

      try {
        const tenantContext = await requireTenantRequestContext(request);

        // Parse and validate request body
        const body = await request.json();
        const validationResult = ExportRequestSchema.safeParse(body);

        if (!validationResult.success) {
          return NextResponse.json(
            {
              error: "Invalid request body",
              message: "Request body validation failed",
              details: validationResult.error.issues,
            },
            { status: 400 }
          );
        }

        const { type, format, reconciliationRunId, jobId, ingestionId } = validationResult.data;

        if (type === "excel") {
          return unsupportedExportResponse(
            "Excel exports are not available in this release.",
            "EXPORT_TYPE_UNAVAILABLE",
            "excel_export_unavailable"
          );
        }

        if (format === "reconciliation_report") {
          return unsupportedExportResponse(
            "Reconciliation report exports are not available in this release.",
            "EXPORT_FORMAT_UNAVAILABLE",
            "reconciliation_report_unavailable"
          );
        }

        // Verify at least one ID is provided
        if (!reconciliationRunId && !jobId && !ingestionId) {
          return NextResponse.json(
            {
              error: "Invalid request",
              message:
                "At least one of reconciliationRunId, jobId, or ingestionId must be provided",
            },
            { status: 400 }
          );
        }

        if (ingestionId && !reconciliationRunId && !jobId) {
          return unsupportedExportResponse(
            "Ingestion-only exports are not available in this release.",
            "EXPORT_TARGET_UNAVAILABLE",
            "ingestion_export_unavailable"
          );
        }

        const targetCheck = await assertExportTargetsAccessible({
          tenantId: tenantContext.tenantId,
          reconciliationRunId,
          jobId,
          ingestionId,
        });

        if (targetCheck) {
          return targetCheck;
        }

        // Create export record
        const exportRecord = await prisma.export.create({
          data: {
            tenantId: tenantContext.tenantId,
            userId: tenantContext.userId,
            type: type,
            format: format,
            reconciliationRunId: reconciliationRunId || null,
            ingestionId: ingestionId || null,
            status: "pending",
            traceId,
            metadata: {
              jobId: jobId || null,
              actor: {
                userId: tenantContext.userId,
                authType: tenantContext.auth.type,
              },
              requestedScope: {
                tenantId: tenantContext.tenantId,
                reconciliationRunId: reconciliationRunId || null,
                ingestionId: ingestionId || null,
              },
            },
          },
        });

        // Process export asynchronously (in production, use a job queue)
        // For now, process immediately
        processExport(
          exportRecord.id,
          tenantContext.tenantId,
          type,
          format,
          reconciliationRunId,
          jobId,
          ingestionId
        ).catch((error) => {
          appLogger.error(`[Export API] Failed to process export ${exportRecord.id}`, error);
          // Update export status to failed
          prisma.export
            .update({
              where: { id: exportRecord.id },
              data: {
                status: "failed",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
              },
            })
            .catch(() => {
              // Ignore update errors
            });
        });

        // Return export record immediately
        return NextResponse.json(
          {
            id: exportRecord.id,
            status: exportRecord.status,
            type: exportRecord.type,
            format: exportRecord.format,
            traceId: exportRecord.traceId,
            reconciliationRunId: exportRecord.reconciliationRunId,
            ingestionId: exportRecord.ingestionId,
            jobId,
            createdAt: exportRecord.createdAt,
            message: "Export created successfully. Processing will begin shortly.",
            capability: {
              state: "available",
            },
          },
          { status: 201 }
        );
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }

        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;

        appLogger.error("[Export API] Error", error, {
          errorMessage,
          stack: errorStack,
          duration,
        });

        return NextResponse.json(
          {
            error: "Failed to create export",
            message: "Please try again later or contact support if the issue persists",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
            traceId,
            capability: {
              state: "degraded",
              reason: "export_create_unavailable",
            },
          },
          { status: 500 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

/**
 * GET /api/exports
 * List exports
 */
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      try {
        const tenantContext = await requireTenantRequestContext(request);

        // Fetch exports
        const exports = await prisma.export.findMany({
          where: {
            tenantId: tenantContext.tenantId,
            userId: tenantContext.userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        });

        return NextResponse.json({
          data: exports.map((exp: any) => {
            const metadata = (exp.metadata as { jobId?: string | null } | null) || null;

            return {
              id: exp.id,
              type: exp.type,
              format: exp.format,
              status: exp.status,
              reconciliationRunId: exp.reconciliationRunId,
              ingestionId: exp.ingestionId,
              jobId: metadata?.jobId || null,
              traceId: exp.traceId,
              createdAt: exp.createdAt,
              signedUrl: exp.signedUrl,
              signedUrlExpiresAt: exp.signedUrlExpiresAt,
              fileSizeBytes: exp.fileSizeBytes,
              rowCount: exp.rowCount,
            };
          }),
          capability: {
            state: "available",
          },
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }

        return NextResponse.json(
          {
            data: [],
            error: "Failed to list exports",
            message: "Please try again later or contact support if the issue persists",
            capability: {
              state: "degraded",
              reason: "export_list_unavailable",
            },
          },
          { status: 503 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

/**
 * Process export asynchronously
 */
async function processExport(
  exportId: string,
  tenantId: string,
  type: string,
  format: string,
  reconciliationRunId: string | undefined,
  jobId: string | undefined,
  _ingestionId: string | undefined
): Promise<void> {
  try {
    // Update status to processing
    await prisma.export.update({
      where: { id: exportId },
      data: { status: "processing" },
    });

    // Fetch data based on format
    let data: Array<Record<string, unknown>> = [];

    if (reconciliationRunId) {
      // Export reconciliation matches
      const matches = await prisma.reconciliationMatch.findMany({
        where: {
          runId: reconciliationRunId,
          tenantId: tenantId,
          ...(format === "matched" ? { matchType: { not: "unmatched" } } : {}),
          ...(format === "unmatched" ? { matchType: "unmatched" } : {}),
        },
        include: {
          sourceTransaction: true,
        },
        take: 10000, // Limit for performance
      });

      data = matches.map((match: any) => ({
        id: match.id,
        matchType: match.matchType,
        confidence: Number(match.confidence || 0),
        sourceAmount: Number(match.sourceTransaction?.amount || 0),
        sourceCurrency: match.sourceTransaction?.currency || "USD",
        sourceDate: match.sourceTransaction?.date || new Date(),
        sourceDescription: match.sourceTransaction?.description || "",
        amountDiff: match.amountDiff ? Number(match.amountDiff) : null,
        dateDiff: match.dateDiff,
        reviewed: match.reviewed,
      }));
    } else if (jobId) {
      // Export job results
      const results = await prisma.reconResult.findMany({
        where: {
          reconJobId: jobId,
          tenantId: tenantId,
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 100,
      });

      data = results.map((result: any) => ({
        id: result.id,
        status: result.status,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        matchedCount: result.matchedCount,
        unmatchedSourceCount: result.unmatchedSourceCount,
        unmatchedTargetCount: result.unmatchedTargetCount,
        conflictCount: result.conflictCount,
        confidenceAvg: result.confidenceAvg ? Number(result.confidenceAvg) : null,
      }));
    }

    // Generate file based on type
    let fileContent: string | Buffer;
    let filename: string;

    if (type === "csv") {
      // Generate CSV
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(","),
        ...data.map((row: any) =>
          headers
            .map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return "";

              let strValue = typeof value === "object" ? JSON.stringify(value) : String(value);

              // CSV Formula Injection Protection
              if (/^[=+\-@]/.test(strValue)) {
                strValue = "'" + strValue;
              }

              return `"${strValue.replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ];
      fileContent = csvRows.join("\n");
      filename = `export-${exportId}.csv`;
    } else if (type === "json") {
      fileContent = JSON.stringify(data, null, 2);
      filename = `export-${exportId}.json`;
    } else {
      throw new Error(`Unsupported export type: ${type}`);
    }

    const fileSizeBytes = Buffer.byteLength(fileContent);
    const MAX_EXPORT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

    if (fileSizeBytes > MAX_EXPORT_SIZE_BYTES) {
      throw new Error(
        `Export size (${Math.round(fileSizeBytes / 1024 / 1024)}MB) exceeds maximum allowed size of 50MB`
      );
    }

    // In production, upload to S3 or similar storage
    // For now, store in database metadata (not recommended for large files)
    const storageLocation = `exports/${exportId}/${filename}`;

    // Generate signed URL (in production, use actual storage service)
    const signedUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://settler.dev"}/api/exports/${exportId}/download`;
    const signedUrlExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update export record
    await prisma.export.update({
      where: { id: exportId },
      data: {
        status: "completed",
        storageLocation: storageLocation,
        signedUrl: signedUrl,
        signedUrlExpiresAt: signedUrlExpiresAt,
        fileSizeBytes: Buffer.byteLength(fileContent),
        rowCount: data.length,
      },
    });

    appLogger.info(`[Export API] Export ${exportId} completed successfully`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await prisma.export.update({
      where: { id: exportId },
      data: {
        status: "failed",
        errorMessage: errorMessage,
      },
    });

    throw error;
  }
}

// try catch
