/**
 * Get Reconciliation Run
 *
 * GET /api/runs/[id]
 *
 * Returns canonical run detail for the same entity used by /api/runs.
 * Resolution, enrichment, and serialization live in @settler/reconciliation-core;
 * this route handles auth, tenant scope, and HTTP mapping only.
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { prisma } from "@/shared/db/prismaClient";
import { resolveOperatorRunDetailForTenants } from "@settler/reconciliation-core";

export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
      const logger = createLogger({ runId: params.id });

      try {
        const { tenantIds: accessibleTenantIds } = await resolveTenantMembershipScope();

        const outcome = await resolveOperatorRunDetailForTenants(
          prisma,
          accessibleTenantIds,
          params.id
        );

        if (outcome.kind === "ambiguous_uuid_collision") {
          return NextResponse.json(
            {
              error: "Ambiguous run identifier",
              code: "RUN_ID_COLLISION",
              detail:
                "The same UUID exists as both a recon job and an ingestion reconciliation run; disambiguate in the database or use tenant-scoped APIs that return a single kind.",
              recon_job_id: outcome.jobId,
              ingestion_run_id: outcome.ingestionRunId,
            },
            { status: 409 }
          );
        }

        if (outcome.kind === "not_found") {
          return NextResponse.json({ error: "Run not found" }, { status: 404 });
        }

        if (outcome.kind === "recon_enrichment_failed") {
          logger.error("Operator run detail enrichment failed", new Error(outcome.message));
          return NextResponse.json({ error: "Failed to load run result" }, { status: 500 });
        }

        return NextResponse.json(outcome.detail);
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status }
          );
        }
        logger.error("Error fetching run", error as Error);
        return NextResponse.json(
          {
            error: "Internal server error",
            message:
              error instanceof Error ? error.message : "Unknown error occurred. Please try again.",
            retryable: true,
          },
          { status: 500 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
