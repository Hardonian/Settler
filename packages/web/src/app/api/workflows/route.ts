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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WorkflowListItem = {
  id: string;
  name: string;
  trigger: {
    type: "historical.workflow_run";
    config: Record<string, never>;
  };
  actions: Array<{
    type: "history_only";
    config: Record<string, never>;
  }>;
  enabled: false;
  lastRun: {
    status: "success" | "failed";
    timestamp: string;
    error?: string;
  };
};

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
    async function GET(request: NextRequest) {
      try {
        const tenantContext = await requireTenantRequestContext(request);

        const runs = await prisma.workflowRun.findMany({
          where: { tenantId: tenantContext.tenantId },
          select: {
            workflowId: true,
            workflowName: true,
            status: true,
            startedAt: true,
            errorMessage: true,
          },
          orderBy: [{ startedAt: "desc" }],
          take: 100,
        });

        const seen = new Set<string>();
        const workflows: WorkflowListItem[] = [];

        for (const run of runs) {
          if (seen.has(run.workflowId)) {
            continue;
          }
          seen.add(run.workflowId);
          workflows.push({
            id: run.workflowId,
            name: run.workflowName || `Workflow ${run.workflowId.slice(0, 8)}`,
            trigger: { type: "historical.workflow_run", config: {} },
            actions: [{ type: "history_only", config: {} }],
            enabled: false,
            lastRun: {
              status: run.status === "completed" ? "success" : "failed",
              timestamp: run.startedAt.toISOString(),
              error: run.errorMessage || undefined,
            },
          });
        }

        return NextResponse.json({
          workflows,
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
        appLogger.error("[Workflows API] GET error", error);
        return NextResponse.json(
          {
            workflows: [],
            error: "Failed to load workflow history",
            capability: { state: "degraded", reason: "workflow_history_unavailable" },
            automationCapability: WORKFLOWS_CAPABILITY,
          },
          { status: 503 }
        );
      }
    },
    { feature: "Workflows GET" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
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
        appLogger.error("[Workflows API] POST error", error);
        return mutationUnavailableResponse(503);
      }
    },
    { feature: "Workflows POST" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 30 }, requireAuth: true }
);
