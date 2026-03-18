/**
 * List Reconciliation Runs
 *
 * GET /api/runs
 *
 * Returns a list of reconciliation runs with their latest execution results.
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import {
  buildCanonicalRunTruth,
  type ReconJobRow,
  type ReconResultRow,
} from "@/lib/reconciliation/run-status";

export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest, _params: unknown) {
      const logger = createLogger({});

      try {
        const { searchParams } = new URL(_request.url);
        const statusFilter = searchParams.get("status")?.toLowerCase() || undefined;
        const searchFilter = searchParams.get("search")?.trim().toLowerCase() || undefined;

        const { supabase, tenantIds } = await resolveTenantMembershipScope();

        // Get runs with their latest result
        const { data: latestResults, error: resultsError } = (await supabase
          .from("recon_results" as any)
          .select(
            "id, recon_job_id, status, started_at, completed_at, source_count, target_count, matched_count, unmatched_source_count, unmatched_target_count, conflict_count, error_message, metadata"
          )
          .in("tenant_id", tenantIds)
          .order("started_at", { ascending: false })) as {
          data: ReconResultRow[] | null;
          error: { message?: string } | null;
        };

        if (resultsError) {
          logger.error(
            "Error fetching results",
            new Error(resultsError.message || "Unknown error")
          );
          return NextResponse.json({ error: "Failed to fetch run results" }, { status: 500 });
        }

        // Get runs
        const { data: runs, error: runsError } = (await supabase
          .from("recon_jobs" as any)
          .select("id, name, status, created_at, updated_at")
          .in("tenant_id", tenantIds)
          .order("created_at", { ascending: false })
          .limit(200)) as {
          data: ReconJobRow[] | null;
          error: { message?: string } | null;
        };

        if (runsError) {
          logger.error("Error fetching runs", new Error(runsError.message || "Unknown error"));
          return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
        }

        const latestResultByJobId = new Map<string, ReconResultRow>();
        for (const result of latestResults || []) {
          if (!latestResultByJobId.has(result.recon_job_id)) {
            latestResultByJobId.set(result.recon_job_id, result);
          }
        }

        const filteredRuns = (runs || [])
          .map((run) => {
            const latestResult = latestResultByJobId.get(run.id) ?? null;
            const truth = buildCanonicalRunTruth(run.status, latestResult);
            return {
              id: run.id,
              name: run.name || "Reconciliation Run",
              status: truth.status,
              statusLabel: truth.statusLabel,
              startedAt: latestResult?.started_at || run.created_at,
              completedAt: latestResult?.completed_at || null,
              summary: truth.summary,
              summaryState: truth.summaryState,
              progress: truth.progressPercent,
              progressState: truth.progressState,
              isTerminal: truth.isTerminal,
            };
          })
          .filter((run) => {
            if (statusFilter && run.status !== statusFilter) {
              return false;
            }
            if (searchFilter) {
              const searchable = `${run.id} ${run.name}`.toLowerCase();
              return searchable.includes(searchFilter);
            }
            return true;
          });

        return NextResponse.json(filteredRuns);
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status }
          );
        }
        logger.error("Error fetching runs", error as Error);
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
