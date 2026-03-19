/**
 * List Reconciliation Runs
 *
 * GET /api/runs
 *
 * Returns canonical run results using one shared run-result contract.
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
  buildCanonicalRunResultContract,
  type ReconJobRecordLike,
  type ReconResultRecordLike,
} from "@/lib/reconciliation/canonical-run-result";

export const runtime = "nodejs";

type RunListJobRow = {
  id: string;
  name: string | null;
  status: string | null;
  tenant_id: string;
  created_at: string;
  updated_at?: string | null;
  source_adapter?: string | null;
  target_adapter?: string | null;
  recon_strategy?: string | null;
  template_id?: string | null;
  validation_rules?: unknown;
  source_config_encrypted?: string | null;
  target_config_encrypted?: string | null;
};

type RunListResultRow = ReconResultRecordLike & {
  recon_job_id: string;
};

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest, _params: unknown) {
      const logger = createLogger({});

      try {
        const { searchParams } = new URL(_request.url);
        const statusFilter = searchParams.get("status")?.toLowerCase() || undefined;
        const searchFilter = searchParams.get("search")?.trim().toLowerCase() || undefined;

        const { supabase, tenantIds } = await resolveTenantMembershipScope();

        const { data: latestResults, error: resultsError } = (await supabase
          .from("recon_results" as any)
          .select(
            "id, recon_job_id, status, started_at, completed_at, source_count, target_count, matched_count, unmatched_source_count, unmatched_target_count, conflict_count, error_message, input_hash, snapshot_id, summary, metadata"
          )
          .in("tenant_id", tenantIds)
          .order("started_at", { ascending: false })) as {
          data: RunListResultRow[] | null;
          error: { message?: string } | null;
        };

        if (resultsError) {
          logger.error("Error fetching results", new Error(resultsError.message || "Unknown error"));
          return NextResponse.json({ error: "Failed to fetch run results" }, { status: 500 });
        }

        const { data: runs, error: runsError } = (await supabase
          .from("recon_jobs" as any)
          .select(
            "id, name, status, tenant_id, created_at, updated_at, source_adapter, target_adapter, recon_strategy, template_id, validation_rules, source_config_encrypted, target_config_encrypted"
          )
          .in("tenant_id", tenantIds)
          .order("created_at", { ascending: false })
          .limit(200)) as {
          data: RunListJobRow[] | null;
          error: { message?: string } | null;
        };

        if (runsError) {
          logger.error("Error fetching runs", new Error(runsError.message || "Unknown error"));
          return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
        }

        const latestResultByJobId = new Map<string, RunListResultRow>();
        for (const result of latestResults || []) {
          if (!latestResultByJobId.has(result.recon_job_id)) {
            latestResultByJobId.set(result.recon_job_id, result);
          }
        }

        const filteredRuns = (runs || [])
          .map((run) => {
            const latestResult = latestResultByJobId.get(run.id) ?? null;
            const contract = buildCanonicalRunResultContract({
              job: run as ReconJobRecordLike,
              result: latestResult,
            });

            return {
              id: run.id,
              name: contract.name,
              status: contract.lifecycle.status,
              statusLabel: contract.lifecycle.statusLabel,
              startedAt:
                contract.provenance.executedAt || run.created_at || new Date().toISOString(),
              completedAt: contract.provenance.completedAt,
              summary: {
                total: contract.summary.total,
                sourceCount: contract.summary.sourceCount,
                targetCount: contract.summary.targetCount,
                matched: contract.summary.matched,
                unmatched: contract.summary.unmatched,
                unmatchedSourceCount: contract.summary.unmatchedSourceCount,
                unmatchedTargetCount: contract.summary.unmatchedTargetCount,
                conflicts: contract.summary.conflicts,
              },
              summarySemantics: {
                processed: contract.summary.processed,
                matchedWithTolerance: contract.summary.matchedWithTolerance,
                exceptioned: contract.summary.exceptioned,
                unresolved: contract.summary.unresolved,
                ignored: contract.summary.ignored,
                resolved: contract.summary.resolved,
              },
              summaryState: contract.summaryState,
              progress: contract.lifecycle.progressPercent,
              progressState: contract.lifecycle.progressState,
              isTerminal: contract.lifecycle.isTerminal,
              provenance: contract.provenance,
              configDrift: {
                status: contract.configDrift.status,
                adapter: contract.configDrift.adapter,
              },
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
