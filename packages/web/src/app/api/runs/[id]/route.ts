/**
 * Get Reconciliation Run
 *
 * GET /api/runs/[id]
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
  buildCanonicalRunResultContract,
  buildLegacyRunSummary,
  toLegacyRunTruth,
  type DeterministicMatchRowLike,
  type ReconJobRecordLike,
  type ReconResultRecordLike,
  type SnapshotRecordLike,
} from "@/lib/reconciliation/canonical-run-result";
import {
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
    async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
      const logger = createLogger({ runId: params.id });

      try {
        const { supabase, tenantIds: accessibleTenantIds } = await resolveTenantMembershipScope();

        const { data: run, error: runError } = (await supabase
          .from("recon_jobs" as any)
          .select(
            "id, name, status, created_at, updated_at, tenant_id, template_id, source_adapter, target_adapter, source_config_encrypted, target_config_encrypted, validation_rules, recon_strategy"
          )
          .eq("id", params.id)
          .in("tenant_id", accessibleTenantIds)
          .single()) as {
          data:
            | (ReconJobRow & {
                tenant_id: string;
                template_id?: string | null;
                source_adapter?: string | null;
                target_adapter?: string | null;
                source_config_encrypted?: string | null;
                target_config_encrypted?: string | null;
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
            "id, recon_job_id, status, started_at, completed_at, source_count, target_count, matched_count, unmatched_source_count, unmatched_target_count, conflict_count, error_message, input_hash, snapshot_id, summary, metadata"
          )
          .eq("recon_job_id", params.id)
          .eq("tenant_id", run.tenant_id)
          .order("started_at", { ascending: false })
          .limit(2)) as {
          data: Array<
            ReconResultRow & {
              input_hash?: string | null;
              snapshot_id?: string | null;
              summary?: unknown;
            }
          > | null;
          error: { message?: string } | null;
        };

        if (resultError) {
          logger.error("Error fetching latest result", resultError as Error);
          return NextResponse.json({ error: "Failed to load run result" }, { status: 500 });
        }

        const latestResult = (recentResults?.[0] ?? null) as ReconResultRecordLike | null;
        const previousResult = (recentResults?.[1] ?? null) as ReconResultRecordLike | null;

        const { count: persistedResultCount } = (await supabase
          .from("recon_results" as any)
          .select("id", { count: "exact", head: true })
          .eq("recon_job_id", params.id)
          .eq("tenant_id", run.tenant_id)) as {
          count: number | null;
          error: { message?: string } | null;
        };

        const snapshotId =
          (latestResult?.snapshot_id as string | null | undefined) ||
          (latestResult?.snapshotId as string | null | undefined) ||
          null;
        const { data: snapshotRecord } = snapshotId
          ? ((await supabase
              .from("run_snapshots" as any)
              .select(
                "id, input_hash, adapter_config_hashes, job_config, rule_versions, created_at"
              )
              .eq("id", snapshotId)
              .eq("tenant_id", run.tenant_id)
              .maybeSingle()) as {
              data: {
                id: string;
                input_hash: string | null;
                adapter_config_hashes: unknown;
                job_config: unknown;
                rule_versions: unknown;
                created_at: string | null;
              } | null;
            })
          : { data: null };

        const { data: audits, error: auditsError } = (await supabase
          .from("recon_audits" as any)
          .select("id, audit_type, action, metadata, created_at")
          .eq("recon_job_id", params.id)
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
          WHERE recon_job_id = ${params.id}
            AND tenant_id = ${run.tenant_id}
        `;

        const exceptionCounts = {
          total: Number(exceptionAggregateRow?.total || 0),
          pending: Number(exceptionAggregateRow?.pending || 0),
          investigating: Number(exceptionAggregateRow?.investigating || 0),
          resolved: Number(exceptionAggregateRow?.resolved || 0),
          ignored: Number(exceptionAggregateRow?.ignored || 0),
          unresolved:
            Number(exceptionAggregateRow?.pending || 0) +
            Number(exceptionAggregateRow?.investigating || 0),
        };

        let deterministicRows: DeterministicMatchRowLike[] = [];
        if (latestResult?.id) {
          try {
            deterministicRows = await prisma.$queryRaw<DeterministicMatchRowLike[]>`
              SELECT
                stable_match_id,
                left_record_id,
                right_record_id,
                confidence_score,
                rule_id,
                rule_version,
                match_rationale,
                matched_at
              FROM deterministic_match_results
              WHERE run_result_id = ${latestResult.id}
                AND tenant_id = ${run.tenant_id}
              ORDER BY matched_at DESC
              LIMIT 250
            `;
          } catch (error) {
            logger.warn("Deterministic match rows unavailable for run detail", {
              runId: params.id,
              resultId: latestResult.id,
              error: error instanceof Error ? error.message : "Unknown",
            });
          }
        }

        const contract = buildCanonicalRunResultContract({
          job: run as ReconJobRecordLike,
          result: latestResult,
          snapshot: snapshotRecord
            ? ({
                id: snapshotRecord.id,
                input_hash: snapshotRecord.input_hash,
                adapter_config_hashes: snapshotRecord.adapter_config_hashes,
                job_config: snapshotRecord.job_config,
                rule_versions: snapshotRecord.rule_versions,
                created_at: snapshotRecord.created_at,
              } as SnapshotRecordLike)
            : null,
          exceptionCounts,
          deterministicRows,
        });

        const truth = toLegacyRunTruth(contract);

        const previousSummary = previousResult ? buildLegacyRunSummary(previousResult) : null;
        const comparison =
          previousResult && previousSummary
            ? {
                previousResultId: previousResult.id,
                previousResultStartedAt:
                  (previousResult.started_at as string | null | undefined) ||
                  (previousResult.startedAt as string | null | undefined) ||
                  null,
                deltaMatched: truth.summary.matched - previousSummary.matched,
                deltaUnmatched: truth.summary.unmatched - previousSummary.unmatched,
                deltaConflicts: truth.summary.conflicts - previousSummary.conflicts,
                snapshotChanged:
                  ((latestResult?.snapshot_id as string | null | undefined) ||
                    (latestResult?.snapshotId as string | null | undefined) ||
                    null) !==
                  ((previousResult.snapshot_id as string | null | undefined) ||
                    (previousResult.snapshotId as string | null | undefined) ||
                    null),
                inputHashChanged:
                  ((latestResult?.input_hash as string | null | undefined) ||
                    (latestResult?.inputHash as string | null | undefined) ||
                    null) !==
                  ((previousResult.input_hash as string | null | undefined) ||
                    (previousResult.inputHash as string | null | undefined) ||
                    null),
              }
            : null;

        const config = buildRunConfigurationSummary({
          sourceAdapter: run.source_adapter ?? null,
          targetAdapter: run.target_adapter ?? null,
          reconStrategy: run.recon_strategy ?? null,
          templateId: run.template_id ?? null,
          validationRules: run.validation_rules,
          snapshotId,
          inputHash:
            (latestResult?.input_hash as string | null | undefined) ||
            (latestResult?.inputHash as string | null | undefined) ||
            null,
          resultStartedAt:
            (latestResult?.started_at as string | null | undefined) ||
            (latestResult?.startedAt as string | null | undefined) ||
            null,
          sourceConfigEncrypted: run.source_config_encrypted ?? null,
          targetConfigEncrypted: run.target_config_encrypted ?? null,
          snapshot: snapshotRecord
            ? {
                id: snapshotRecord.id,
                inputHash: snapshotRecord.input_hash,
                createdAt: snapshotRecord.created_at,
                jobConfig: snapshotRecord.job_config,
                ruleVersions: snapshotRecord.rule_versions,
                adapterConfigHashes: snapshotRecord.adapter_config_hashes,
              }
            : null,
        });

        const rowRationaleCodes = Array.from(
          new Set(contract.rowResults.map((row) => row.rationale.code))
        );

        return NextResponse.json({
          id: run.id,
          name: contract.name,
          status: truth.status,
          statusLabel: truth.statusLabel,
          isTerminal: truth.isTerminal,
          progress: truth.progressPercent,
          progressState: truth.progressState,
          startedAt: contract.provenance.executedAt || run.created_at,
          completedAt: contract.provenance.completedAt,
          ...(latestResult?.error_message
            ? { error: latestResult.error_message }
            : latestResult?.errorMessage
              ? { error: latestResult.errorMessage }
              : {}),
          summary: truth.summary,
          summarySemantics: {
            processed: contract.summary.processed,
            matchedWithTolerance: contract.summary.matchedWithTolerance,
            exceptioned: contract.summary.exceptioned,
            unresolved: contract.summary.unresolved,
            ignored: contract.summary.ignored,
            resolved: contract.summary.resolved,
          },
          summaryState: truth.summaryState,
          summaryMath: {
            sourceCount: truth.summary.sourceCount,
            targetCount: truth.summary.targetCount,
            matchedCount: truth.summary.matched,
            unmatchedSourceCount: truth.summary.unmatchedSourceCount,
            unmatchedTargetCount: truth.summary.unmatchedTargetCount,
            conflictCount: truth.summary.conflicts,
            note: "unmatched = unmatched_source + unmatched_target; review scope includes unresolved exceptions",
          },
          provenance: contract.provenance,
          resultContext: {
            latestResultId: contract.provenance.runResultId,
            latestResultStatus: latestResult?.status ?? null,
            latestResultStartedAt: contract.provenance.executedAt,
            latestResultCompletedAt: contract.provenance.completedAt,
            persistedResultCount: persistedResultCount ?? (latestResult ? 1 : 0),
            comparison,
          },
          config,
          configDrift: contract.configDrift,
          exceptions: {
            total: contract.exceptions.total,
            pending: contract.exceptions.pending,
            investigating: contract.exceptions.investigating,
            resolved: contract.exceptions.resolved,
            ignored: contract.exceptions.ignored,
            reviewRequired: contract.exceptions.unresolved,
          },
          rowRationale: {
            available: contract.rowResults.length > 0,
            rowCount: contract.rowResults.length,
            codes: rowRationaleCodes,
          },
          rowResultsPreview: contract.rowResults.slice(0, 100),
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
