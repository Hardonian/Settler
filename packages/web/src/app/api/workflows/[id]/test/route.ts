import { NextRequest, NextResponse } from "next/server";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";
import {
  WORKFLOWS_CAPABILITY,
  WORKFLOW_MUTATION_UNAVAILABLE_CODE,
} from "@/lib/workflows/capability";

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      try {
        await requireTenantRequestContext(request);
        return NextResponse.json(
          {
            error: WORKFLOWS_CAPABILITY.message,
            code: WORKFLOW_MUTATION_UNAVAILABLE_CODE,
            capability: WORKFLOWS_CAPABILITY,
          },
          { status: 409 }
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
        appLogger.error("[Workflows API] TEST error", error);
        return NextResponse.json(
          {
            error: "Workflow test execution is unavailable",
            code: WORKFLOW_MUTATION_UNAVAILABLE_CODE,
            capability: WORKFLOWS_CAPABILITY,
          },
          { status: 503 }
        );
      }
    },
    { feature: "Workflows TEST" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 30 }, requireAuth: true }
);
