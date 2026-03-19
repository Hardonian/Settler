/**
 * Get Reconciliation Run
 *
 * GET /api/runs/[runId]
 *
 * Returns canonical run detail for the same entity used by /api/runs.
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
  toStageRows,
  type ReconAuditRow,
  type ReconJobRow,
  type ReconResultRow,
} from "@/lib/reconciliation/run-status";
import { buildRunConfigurationSummary } from "@/lib/reconciliation/run-detail";

export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest, { params }: { params: { runId: string } }) {
      const logger = createLogger({ runId: params.runId });

      try {
        const { supabase, tenantIds: accessibleTenantIds } = await resolveTenantMembershipScope();

        const { data: run, error: runError } = (await supabase
          .from("recon_jobs" as any)
          .select(
            "id, name, status, created_at, updated_at, tenant_id, template_id, source_adapter, target_adapter, validation_rules, recon_strategy"
          )
          .eq("id", params.runId)
          .in("tenant_id", accessibleTenantIds)
          .single()) as {
          data:
            | (ReconJobRow & {
                tenant_id: string;
                template_id?: string | null;
                source_adapter?: string | null;
                target_adapter?: string | null;
                validation_rules?: unknown;
                recon_strategy?: string | null;
              })
            | null;
          error: { message?: string } | null;
        };

        if (runError || !run) {
          return NextResponse.json({ error: "Run not found" }, { status: 404 });
        }

        const { data: latestResult, error: resultError } = (await supabase
          .from("recon_results" as any)
          .select(
            "id, recon_job_id, status, started_at, completed_at, source_count, target_count, matched_count, unmatched_source_count, unmatched_target_count, conflict_count, error_message, input_hash, snapshot_id, metadata"
          )
          .eq("recon_job_id", params.runId)
          .eq("tenant_id", run.tenant_id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle()) as {
          data:
            | (ReconResultRow & { input_hash?: string | null; snapshot_id?: string | null })
            | null;
          error: { message?: string } | null;
        };

        if (resultError) {
          logger.error("Error fetching latest result", resultError as Error);
          return NextResponse.json({ error: "Failed to load run result" }, { status: 500 });
        }

        const { data: audits, error: auditsError } = (await supabase
          .from("recon_audits" as any)
          .select("id, audit_type, action, metadata, created_at")
          .eq("recon_job_id", params.runId)
          .eq("tenant_id", run.tenant_id)
          .order("created_at", { ascending: false })
          .limit(50)) as {
          data: ReconAuditRow[] | null;
          error: { message?: string } | null;
        };

        if (auditsError) {
          logger.warn("Failed to fetch audits for run detail", {
            error: auditsError.message || "Unknown error",
          });
        }

        const startedAt = latestResult?.started_at || run.created_at;
        const completedAt = latestResult?.completed_at || null;
        const truth = buildCanonicalRunTruth(run.status, latestResult);
        const config = buildRunConfigurationSummary({
          sourceAdapter: run.source_adapter ?? null,
          targetAdapter: run.target_adapter ?? null,
          reconStrategy: run.recon_strategy ?? null,
          templateId: run.template_id ?? null,
          validationRules: run.validation_rules,
          snapshotId: latestResult?.snapshot_id ?? null,
          inputHash: latestResult?.input_hash ?? null,
        });

        return NextResponse.json({
          id: run.id,
          name: run.name || "Reconciliation Run",
          status: truth.status,
          statusLabel: truth.statusLabel,
          isTerminal: truth.isTerminal,
          progress: truth.progressPercent,
          progressState: truth.progressState,
          startedAt,
          completedAt,
          ...(latestResult?.error_message ? { error: latestResult.error_message } : {}),
          summary: truth.summary,
          summaryState: truth.summaryState,
          config,
          stages: toStageRows(audits || []),
        });
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
