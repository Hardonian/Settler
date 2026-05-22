/**
 * GET /api/console/workforce/registry
 * Canonical capability disclosure for bounded workforce modules (OSS-safe).
 */

import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { gateConsoleTenant } from "../_shared";

export const dynamic = "force-dynamic";

const PRIOR_RUN_DELTA_ANALYST_KEY = "prior_run_delta_analyst";

export const GET = withSecurity(
  async function GET(request: NextRequest): Promise<NextResponse> {
    const gate = await gateConsoleTenant(request);
    if (!gate.ok) return gate.response;

    void gate.tenantId;

    return NextResponse.json({
      data: {
        workers: [
          {
            key: PRIOR_RUN_DELTA_ANALYST_KEY,
            version: "1",
            displayName: "Prior Run Delta Analyst",
            description:
              "Deterministic briefing from canonical RunDelta rows. No external inference; cites run and delta ids only.",
            inputs: ["run_delta row (tenant-scoped)", "recon result pair"],
            outputs: ["headline", "posture", "bullets", "recommended next steps", "contentHash"],
            riskLevel: "low",
            requiresApproval: false,
            degradedWhen: [
              "no prior run on delta",
              "config drift flagged on delta",
              "worker_runs table unavailable",
            ],
          },
        ],
      },
      capability: { state: "available", worker_count: 1 },
    });
  },
  {
    rateLimit: { windowMs: 60_000, maxRequests: 60 },
    requireAuth: true,
  }
);
