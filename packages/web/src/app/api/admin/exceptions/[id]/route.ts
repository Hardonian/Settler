/**
 * Admin Exception Detail API
 *
 * GET /api/admin/exceptions/[id] – Returns full detail for a single exception.
 * Requires super admin access.
 * Replaces the previous anti-pattern of fetching up to 1000 exceptions and
 * filtering client-side on the admin detail page.
 */

// ROUTE_CLASS: admin-internal
// AUTH: session + superAdmin

import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { prisma } from "@/shared/db/prismaClient";
import { adminLogger } from "@/lib/admin/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ExceptionIdParamSchema = z.string().uuid("Exception ID must be a valid UUID");

function deriveStatus(
  acknowledged: boolean,
  metadata: Record<string, unknown>
): "new" | "in_review" | "resolved" {
  const resolution = metadata.resolution;
  if (resolution && typeof resolution === "object" && !Array.isArray(resolution)) {
    const resolutionStatus = (resolution as Record<string, unknown>).status;
    if (resolutionStatus === "resolved" || resolutionStatus === "ignored") {
      return "resolved";
    }
  }
  if (acknowledged) {
    return "in_review";
  }
  return "new";
}

/**
 * GET /api/admin/exceptions/[id]
 * Returns full provenance detail for a single exception.
 */
export const GET = withSecurity(
  async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const adminCheck = await isSuperAdmin();
      if (!adminCheck) {
        return NextResponse.json(
          { error: "Forbidden", message: "Super admin access required" },
          { status: 403 }
        );
      }

      const { id } = await params;
      const parsedId = ExceptionIdParamSchema.safeParse(id);
      if (!parsedId.success) {
        return NextResponse.json(
          {
            error: "Invalid exception ID",
            message: "Exception ID must be a valid UUID",
            details: parsedId.error.issues,
          },
          { status: 400 }
        );
      }

      const exception = await prisma.driftEvent.findUnique({
        where: { id: parsedId.data },
        select: {
          id: true,
          tenantId: true,
          driftType: true,
          severity: true,
          acknowledged: true,
          acknowledgedBy: true,
          acknowledgedAt: true,
          createdAt: true,
          updatedAt: true,
          reconJobId: true,
          fieldPath: true,
          expectedValue: true,
          actualValue: true,
          driftMetrics: true,
          metadata: true,
        },
      });

      if (!exception) {
        return NextResponse.json(
          {
            error: "Not found",
            message: "This exception no longer exists or you do not have access",
          },
          { status: 404 }
        );
      }

      const metadata = (exception.metadata as Record<string, unknown>) || {};
      const driftMetrics = (exception.driftMetrics as Record<string, unknown>) || {};

      const status = deriveStatus(exception.acknowledged, metadata);

      // Extract best available provenance from metadata fields
      const provenance = {
        runId: exception.reconJobId || null,
        fieldPath: exception.fieldPath || null,
        ruleId:
          (metadata.ruleId as string | undefined) ??
          (metadata.rule_id as string | undefined) ??
          null,
        detectorId:
          (metadata.detectorId as string | undefined) ??
          (metadata.detector_id as string | undefined) ??
          null,
        sourceAdapter:
          (metadata.sourceAdapter as string | undefined) ??
          (metadata.sourceSystem as string | undefined) ??
          null,
        targetAdapter:
          (metadata.targetAdapter as string | undefined) ??
          (metadata.targetSystem as string | undefined) ??
          null,
        sourceTransactionId: (metadata.sourceTransactionId as string | undefined) ?? null,
        targetTransactionId: (metadata.targetTransactionId as string | undefined) ?? null,
        ingestionId: (metadata.ingestionId as string | undefined) ?? null,
        matchReason:
          (metadata.matchReason as string | undefined) ??
          (driftMetrics.matchReason as string | undefined) ??
          null,
        confidenceScore:
          typeof driftMetrics.confidenceScore === "number"
            ? (driftMetrics.confidenceScore as number)
            : typeof metadata.confidenceScore === "number"
              ? (metadata.confidenceScore as number)
              : null,
      };

      const reviewedAt = exception.acknowledgedAt?.toISOString() ?? null;
      const updatedAt =
        (exception.updatedAt as Date | null)?.toISOString() ?? exception.createdAt.toISOString();

      const result = {
        id: exception.id,
        tenantId: exception.tenantId,
        source: exception.driftType || "unknown",
        severity: (exception.severity || "info") as "info" | "warn" | "critical",
        status,
        reason: exception.fieldPath
          ? `Field mismatch: ${exception.fieldPath}`
          : exception.driftType || "Drift detected",
        evidence: {
          expected: exception.expectedValue ?? null,
          actual: exception.actualValue ?? null,
        },
        provenance,
        reviewedBy: exception.acknowledgedBy ?? null,
        reviewedAt,
        createdAt: exception.createdAt.toISOString(),
        updatedAt,
        // Include raw metadata for diagnostics – bounded by collapsibility in UI
        metadata,
      };

      return NextResponse.json(result);
    } catch (error) {
      adminLogger.error("Failed to retrieve exception detail", error);
      return NextResponse.json(
        {
          error: "Failed to retrieve exception",
          message: "Please try again later or contact support if the issue persists",
        },
        { status: 500 }
      );
    }
  },
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

// try catch
