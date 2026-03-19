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
  buildRunSummary,
  toStageRows,
  type ReconAuditRow,
  type ReconJobRow,
  type ReconResultRow,
} from "@/lib/reconciliation/run-status";
import { buildRunConfigurationSummary } from "@/lib/reconciliation/run-detail";
import { prisma } from "@/shared/db/prismaClient";

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

        const { data: recentResults, error: resultError } = (await supabase
          .from("recon_results" as any)
          .select(
            "id, recon_job_id, status, started_at, completed_at, source_count, target_count, matched_count, unmatched_source_count, unmatched_target_count, conflict_count, error_message, input_hash, snapshot_id, metadata"
          )
          .eq("recon_job_id", params.runId)
          .eq("tenant_id", run.tenant_id)
          .order("started_at", { ascending: false })
          .limit(2)) as {
          data:
            | Array<ReconResultRow & { input_hash?: string | null; snapshot_id?: string | null }>
            | null;
          error: { message?: string } | null;
        };

        if (resultError) {
          logger.error("Error fetching latest result", resultError as Error);
          return NextResponse.json({ error: "Failed to load run result" }, { status: 500 });
        }

        const latestResult = recentResults?.[0] ?? null;
        const previousResult = recentResults?.[1] ?? null;

        const { count: persistedResultCount } = (await supabase
          .from("recon_results" as any)
          .select("id", { count: "exact", head: true })
          .eq("recon_job_id", params.runId)
          .eq("tenant_id", run.tenant_id)) as {
          count: number | null;
          error: { message?: string } | null;
        };

        const snapshotId = latestResult?.snapshot_id ?? null;
        const { data: snapshotRecord } = snapshotId
          ? ((await supabase
              .from("run_snapshots" as any)
              .select("id, input_hash, job_config, rule_versions, created_at")
              .eq("id", snapshotId)
              .eq("tenant_id", run.tenant_id)
              .maybeSingle()) as {
              data:
                | {
                    id: string;
                    input_hash: string | null;
                    job_config: unknown;
                    rule_versions: unknown;
                    created_at: string | null;
                  }
                | null;
            })
          : { data: null };

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
        const previousSummary = previousResult ? buildRunSummary(previousResult) : null;
        const comparison =
          previousResult && previousSummary
            ? {
                previousResultId: previousResult.id,
                previousResultStartedAt: previousResult.started_at,
                deltaMatched: truth.summary.matched - previousSummary.matched,
                deltaUnmatched: truth.summary.unmatched - previousSummary.unmatched,
                deltaConflicts: truth.summary.conflicts - previousSummary.conflicts,
              }
            : null;
        const config = buildRunConfigurationSummary({
          sourceAdapter: run.source_adapter ?? null,
          targetAdapter: run.target_adapter ?? null,
          reconStrategy: run.recon_strategy ?? null,
          templateId: run.template_id ?? null,
          validationRules: run.validation_rules,
          snapshotId,
          inputHash: latestResult?.input_hash ?? null,
          resultStartedAt: latestResult?.started_at ?? null,
          snapshot: snapshotRecord
            ? {
                id: snapshotRecord.id,
                inputHash: snapshotRecord.input_hash,
                createdAt: snapshotRecord.created_at,
                jobConfig: snapshotRecord.job_config,
                ruleVersions: snapshotRecord.rule_versions,
              }
            : null,
        });

        const [exceptionAggregateRow] = await prisma.$queryRaw<
          Array<{
            total: number | bigint;
            pending: number | bigint;
            investigating: number | bigint;
            resolved: number | bigint;
            ignored: number | bigint;
          }>
        >`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE acknowledged = false)::int AS pending,
            COUNT(*) FILTER (
              WHERE acknowledged = true
              AND COALESCE(LOWER(metadata -> 'resolution' ->> 'status'), '') NOT IN ('resolved', 'ignored')
            )::int AS investigating,
            COUNT(*) FILTER (
              WHERE LOWER(metadata -> 'resolution' ->> 'status') = 'resolved'
            )::int AS resolved,
            COUNT(*) FILTER (
              WHERE LOWER(metadata -> 'resolution' ->> 'status') = 'ignored'
            )::int AS ignored
          FROM drift_events
          WHERE recon_job_id = ${params.runId}
            AND tenant_id = ${run.tenant_id}
        `;

        const exceptionCounts = {
          total: Number(exceptionAggregateRow?.total || 0),
          pending: Number(exceptionAggregateRow?.pending || 0),
          investigating: Number(exceptionAggregateRow?.investigating || 0),
          resolved: Number(exceptionAggregateRow?.resolved || 0),
          ignored: Number(exceptionAggregateRow?.ignored || 0),
        };

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
          summaryMath: {
            sourceCount: truth.summary.sourceCount,
            targetCount: truth.summary.targetCount,
            matchedCount: truth.summary.matched,
            unmatchedSourceCount: truth.summary.unmatchedSourceCount,
            unmatchedTargetCount: truth.summary.unmatchedTargetCount,
            conflictCount: truth.summary.conflicts,
            note: "unmatched = unmatched_source + unmatched_target",
          },
          resultContext: {
            latestResultId: latestResult?.id ?? null,
            latestResultStatus: latestResult?.status ?? null,
            latestResultStartedAt: latestResult?.started_at ?? null,
            latestResultCompletedAt: latestResult?.completed_at ?? null,
            persistedResultCount: persistedResultCount ?? (latestResult ? 1 : 0),
            comparison,
          },
          exceptions: {
            ...exceptionCounts,
            reviewRequired: exceptionCounts.pending + exceptionCounts.investigating,
          },
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
