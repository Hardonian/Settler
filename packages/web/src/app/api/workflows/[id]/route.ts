import { NextRequest, NextResponse } from "next/server";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";
import { prisma } from "@/shared/db/prismaClient";
import {
  WORKFLOWS_CAPABILITY,
  WORKFLOW_HISTORY_CAPABILITY,
  WORKFLOW_MUTATION_UNAVAILABLE_CODE,
} from "@/lib/workflows/capability";

function mutationUnavailableResponse(status = 409) {
  return NextResponse.json(
    {
      error: WORKFLOWS_CAPABILITY.message,
      code: WORKFLOW_MUTATION_UNAVAILABLE_CODE,
      capability: WORKFLOWS_CAPABILITY,
    },
    { status }
  );
}

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
      try {
        const tenantContext = await requireTenantRequestContext(request);
        const { id } = await context.params;

        const latestRun = await prisma.workflowRun.findFirst({
          where: {
            tenantId: tenantContext.tenantId,
            workflowId: id,
          },
          orderBy: { startedAt: "desc" },
          select: {
            workflowId: true,
            workflowName: true,
            status: true,
            startedAt: true,
            errorMessage: true,
          },
        });

        if (!latestRun) {
          return NextResponse.json(
            {
              error: "Workflow history not found",
              code: "WORKFLOW_NOT_FOUND",
              capability: WORKFLOW_HISTORY_CAPABILITY,
              automationCapability: WORKFLOWS_CAPABILITY,
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          id: latestRun.workflowId,
          name: latestRun.workflowName || `Workflow ${latestRun.workflowId.slice(0, 8)}`,
          trigger: { type: "historical.workflow_run", config: {} },
          actions: [{ type: "history_only", config: {} }],
          enabled: false,
          lastRun: {
            status: latestRun.status === "completed" ? "success" : "failed",
            timestamp: latestRun.startedAt.toISOString(),
            error: latestRun.errorMessage || undefined,
          },
          capability: WORKFLOW_HISTORY_CAPABILITY,
          automationCapability: WORKFLOWS_CAPABILITY,
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
        appLogger.error("[Workflows API] GET detail error", error);
        return NextResponse.json(
          {
            error: "Failed to load workflow detail",
            code: "WORKFLOW_DETAIL_UNAVAILABLE",
            capability: { state: "degraded", reason: "workflow_detail_unavailable" },
            automationCapability: WORKFLOWS_CAPABILITY,
          },
          { status: 503 }
        );
      }
    },
    { feature: "Workflows detail GET" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const PATCH = withSecurity(
  withUniversalBillingGate(
    async function PATCH(request: NextRequest) {
      try {
        await requireTenantRequestContext(request);
        return mutationUnavailableResponse(409);
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }
        appLogger.error("[Workflows API] PATCH error", error);
        return mutationUnavailableResponse(503);
      }
    },
    { feature: "Workflows PATCH" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 30 }, requireAuth: true }
);

export const DELETE = withSecurity(
  withUniversalBillingGate(
    async function DELETE(request: NextRequest) {
      try {
        await requireTenantRequestContext(request);
        return mutationUnavailableResponse(409);
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }
        appLogger.error("[Workflows API] DELETE error", error);
        return mutationUnavailableResponse(503);
      }
    },
    { feature: "Workflows DELETE" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 30 }, requireAuth: true }
);
