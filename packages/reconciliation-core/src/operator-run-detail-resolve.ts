/**
 * Canonical operator run detail read pipeline: resolve → enrich → serialize to OperatorRunDetail.
 *
 * `runs` / GET /api/runs/[id] is the operator-truth surface. This module owns all
 * tenant-scoped enrichment needed for that response (recon_job and ingestion_run).
 */

import type { PrismaClient } from "@prisma/client";
import {
  buildCanonicalRunResultContract,
  buildLegacyRunSummary,
  toLegacyRunTruth,
  type DeterministicMatchRowLike,
  type ReconJobRecordLike,
  type ReconResultRecordLike,
  type SnapshotRecordLike,
} from "./canonical-run-result.js";
import {
  buildOperatorIngestionRunDetailJson,
  buildOperatorReconRunDetailJson,
  type OperatorRunDetail,
  type OperatorRunStageRow,
} from "./operator-run-detail.js";
import { countReconciliationExceptionsForScope } from "./exception-workbench.js";
import {
  resolveReconciliationRunForTenants,
  type ResolvedReconciliationRunForTenants,
} from "./run-resolution.js";
import {
  buildRunConfigurationSummary,
  type RunConfigurationSummary,
} from "./run-configuration-summary.js";
import { toStageRows, type ReconAuditRow } from "./recon-audit-stages.js";

export type OperatorRunDetailResolution =
  | { kind: "ok"; detail: OperatorRunDetail }
  | { kind: "ambiguous_uuid_collision"; jobId: string; ingestionRunId: string }
  | { kind: "not_found" }
  | { kind: "recon_enrichment_failed"; message: string };

function toReconResultRecordLike(row: {
  id: string;
  reconJobId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  sourceCount: number;
  targetCount: number;
  matchedCount: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflictCount: number;
  errorMessage: string | null;
  inputHash: string | null;
  snapshotId: string | null;
  summary: unknown;
  metadata: unknown;
}): ReconResultRecordLike {
  return {
    id: row.id,
    recon_job_id: row.reconJobId,
    status: row.status,
    started_at: row.startedAt.toISOString(),
    completed_at: row.completedAt?.toISOString() ?? null,
    source_count: row.sourceCount,
    target_count: row.targetCount,
    matched_count: row.matchedCount,
    unmatched_source_count: row.unmatchedSourceCount,
    unmatched_target_count: row.unmatchedTargetCount,
    conflict_count: row.conflictCount,
    error_message: row.errorMessage,
    input_hash: row.inputHash,
    snapshot_id: row.snapshotId,
    summary: row.summary as Record<string, unknown> | null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

function toReconJobRecordLike(job: {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdAt: Date;
  sourceAdapter: string;
  targetAdapter: string;
  reconStrategy: string;
  templateId: string | null;
  validationRules: unknown;
  sourceConfigEncrypted: string;
  targetConfigEncrypted: string;
}): ReconJobRecordLike {
  return {
    id: job.id,
    tenantId: job.tenantId,
    name: job.name,
    status: job.status,
    created_at: job.createdAt.toISOString(),
    source_adapter: job.sourceAdapter,
    target_adapter: job.targetAdapter,
    recon_strategy: job.reconStrategy,
    template_id: job.templateId,
    validation_rules: job.validationRules,
    source_config_encrypted: job.sourceConfigEncrypted,
    target_config_encrypted: job.targetConfigEncrypted,
  };
}

function runConfigurationToOperatorConfig(summary: RunConfigurationSummary) {
  return {
    sourceAdapter: summary.sourceAdapter,
    targetAdapter: summary.targetAdapter,
    reconStrategy: summary.reconStrategy,
    templateId: summary.templateId,
    validationRuleCount: summary.validationRuleCount,
    validationRuleLabels: summary.validationRuleLabels,
    ruleVersionCount: summary.ruleVersionCount,
    ruleVersionLabels: summary.ruleVersionLabels,
    snapshotId: summary.snapshotId,
    inputHash: summary.inputHash,
    configSource: summary.configSource,
    configCapturedAt: summary.configCapturedAt,
    definitionDriftDetected: summary.definitionDriftDetected,
    definitionDriftNotes: summary.definitionDriftNotes,
    summaryBasis: summary.summaryBasis,
  };
}

function buildIngestionStages(
  resolved: Extract<ResolvedReconciliationRunForTenants, { kind: "ingestion_run" }>
): OperatorRunStageRow[] {
  const stageStatus: "pending" | "running" | "completed" | "failed" =
    resolved.detail.lifecycle.status === "completed"
      ? "completed"
      : resolved.detail.lifecycle.status === "failed"
        ? "failed"
        : resolved.detail.lifecycle.status === "running"
          ? "running"
          : "pending";

  return [
    {
      id: "ingestion-reconciliation",
      name: "Ingestion reconciliation",
      status: stageStatus,
      startedAt: resolved.detail.timestamps.startedAt ?? resolved.detail.timestamps.createdAt,
      completedAt: resolved.detail.timestamps.completedAt ?? undefined,
      ...(resolved.detail.errorMessage ? { error: resolved.detail.errorMessage } : {}),
    },
  ];
}

/**
 * Resolve tenant-scoped run id to full {@link OperatorRunDetail} (canonical operator read model).
 */
export async function resolveOperatorRunDetailForTenants(
  prisma: PrismaClient,
  tenantIds: string[],
  runId: string
): Promise<OperatorRunDetailResolution> {
  const resolved = await resolveReconciliationRunForTenants(prisma, tenantIds, runId);

  if (resolved.kind === "ambiguous_uuid_collision") {
    return {
      kind: "ambiguous_uuid_collision",
      jobId: resolved.jobId,
      ingestionRunId: resolved.ingestionRunId,
    };
  }

  if (resolved.kind === "not_found") {
    return { kind: "not_found" };
  }

  if (resolved.kind === "ingestion_run") {
    return {
      kind: "ok",
      detail: buildOperatorIngestionRunDetailJson({
        detail: resolved.detail,
        stages: buildIngestionStages(resolved),
      }),
    };
  }

  try {
    const job = resolved.jobRecord;
    const latestResult = resolved.latestResultRecord;
    const snapshotId = latestResult?.snapshot_id ?? null;

    const [
      recentResults,
      persistedResultCount,
      audits,
      exceptionCountResult,
      runDeltaRecord,
      snapshotRecord,
      deterministicRows,
    ] = await Promise.all([
      // Fetch the previous result for comparison (skip the first one since we have it)
      prisma.reconResult.findMany({
        where: { reconJobId: runId, tenantId: job.tenantId, id: { not: latestResult?.id } },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          id: true,
          reconJobId: true,
          status: true,
          startedAt: true,
          completedAt: true,
          sourceCount: true,
          targetCount: true,
          matchedCount: true,
          unmatchedSourceCount: true,
          unmatchedTargetCount: true,
          conflictCount: true,
          errorMessage: true,
          inputHash: true,
          snapshotId: true,
          summary: true,
          metadata: true,
        },
      }),
      prisma.reconResult.count({
        where: { reconJobId: runId, tenantId: job.tenantId },
      }),
      prisma.reconAudit.findMany({
        where: { reconJobId: runId, tenantId: job.tenantId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          auditType: true,
          action: true,
          metadata: true,
          createdAt: true,
        },
      }),
      countReconciliationExceptionsForScope({
        prisma,
        tenantId: job.tenantId,
        runId,
        runKind: "recon_job",
      }),
      prisma.runDelta.findFirst({
        where: { currentRunId: runId, tenantId: job.tenantId },
      }),
      snapshotId
        ? prisma.runSnapshot.findFirst({
            where: { id: snapshotId, tenantId: job.tenantId },
            select: {
              id: true,
              inputHash: true,
              adapterConfigHashes: true,
              jobConfig: true,
              ruleVersions: true,
              createdAt: true,
            },
          })
        : Promise.resolve(null),
      latestResult?.id
        ? (prisma.$queryRaw`
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
          WHERE run_result_id = ${latestResult.id}::uuid
            AND tenant_id = ${job.tenantId}::uuid
          ORDER BY matched_at DESC
          LIMIT 250
        `.catch(() => []) as Promise<DeterministicMatchRowLike[]>)
        : Promise.resolve([]),
    ]);

    const previousResult = recentResults[0] ?? null;
    const latestRecord = latestResult;
    const previousRecord = previousResult ? toReconResultRecordLike(previousResult) : null;

    const snapshotLike: SnapshotRecordLike | null = snapshotRecord
      ? {
          id: snapshotRecord.id,
          input_hash: snapshotRecord.inputHash,
          adapter_config_hashes: snapshotRecord.adapterConfigHashes,
          job_config: snapshotRecord.jobConfig,
          rule_versions: snapshotRecord.ruleVersions,
          created_at: snapshotRecord.createdAt?.toISOString() ?? null,
        }
      : null;

    const auditRows: ReconAuditRow[] = (audits as any).map(
      (a: {
        id: string;
        auditType: string;
        action: string;
        metadata: unknown;
        createdAt: Date;
      }) => ({
        id: a.id,
        audit_type: a.auditType,
        action: a.action,
        metadata: (a.metadata as Record<string, unknown> | null) ?? null,
        created_at: a.createdAt.toISOString(),
      })
    );

    const exceptionCounts =
      exceptionCountResult.kind === "ok"
        ? {
            total: exceptionCountResult.counts.total,
            pending: exceptionCountResult.counts.pending,
            investigating: exceptionCountResult.counts.investigating,
            resolved: exceptionCountResult.counts.resolved,
            ignored: exceptionCountResult.counts.ignored,
            unresolved: exceptionCountResult.counts.reviewRequired,
          }
        : {
            total: 0,
            pending: 0,
            investigating: 0,
            resolved: 0,
            ignored: 0,
            unresolved: 0,
          };

    const jobLike = toReconJobRecordLike(job);

    const contract = buildCanonicalRunResultContract({
      job: jobLike,
      result: latestRecord,
      snapshot: snapshotLike,
      exceptionCounts,
      deterministicRows,
    });

    const truth = toLegacyRunTruth(contract);

    const previousSummary = previousRecord ? buildLegacyRunSummary(previousRecord) : null;
    const comparison =
      previousRecord && previousSummary
        ? {
            previousResultId: previousRecord.id,
            previousResultStartedAt: previousRecord.started_at ?? null,
            deltaMatched: truth.summary.matched - previousSummary.matched,
            deltaUnmatched: truth.summary.unmatched - previousSummary.unmatched,
            deltaConflicts: truth.summary.conflicts - previousSummary.conflicts,
            snapshotChanged:
              (latestRecord?.snapshot_id ?? null) !== (previousRecord.snapshot_id ?? null),
            inputHashChanged:
              (latestRecord?.input_hash ?? null) !== (previousRecord.input_hash ?? null),
          }
        : null;

    const configSummary = buildRunConfigurationSummary({
      sourceAdapter: job.sourceAdapter,
      targetAdapter: job.targetAdapter,
      reconStrategy: job.reconStrategy,
      templateId: job.templateId,
      validationRules: job.validationRules,
      snapshotId,
      inputHash: latestRecord?.input_hash ?? null,
      resultStartedAt: latestRecord?.started_at ?? null,
      sourceConfigEncrypted: job.sourceConfigEncrypted,
      targetConfigEncrypted: job.targetConfigEncrypted,
      snapshot: snapshotRecord
        ? {
            id: snapshotRecord.id,
            inputHash: snapshotRecord.inputHash,
            createdAt: snapshotRecord.createdAt?.toISOString() ?? null,
            jobConfig: snapshotRecord.jobConfig,
            ruleVersions: snapshotRecord.ruleVersions,
            adapterConfigHashes: snapshotRecord.adapterConfigHashes,
          }
        : null,
    });

    const rowRationaleCodes = Array.from(
      new Set(contract.rowResults.map((row) => row.rationale.code))
    );

    const detailJson = buildOperatorReconRunDetailJson({
      detail: resolved.detail,
      status: truth.status,
      startedAt: contract.provenance.executedAt || job.createdAt.toISOString(),
      completedAt: contract.provenance.completedAt,
      errorMessage: latestRecord?.error_message ?? null,
      summaryMathNote:
        "unmatched = unmatched_source + unmatched_target; review scope includes unresolved exceptions",
      resultContext: {
        latestResultId: contract.provenance.runResultId,
        latestResultStatus: latestResult?.status ?? null,
        latestResultStartedAt: contract.provenance.executedAt,
        latestResultCompletedAt: contract.provenance.completedAt,
        persistedResultCount,
        comparison,
      },
      config: runConfigurationToOperatorConfig(configSummary),
      exceptions: {
        total: contract.exceptions.total,
        pending: contract.exceptions.pending,
        investigating: contract.exceptions.investigating,
        resolved: contract.exceptions.resolved,
        ignored: contract.exceptions.ignored,
        reviewRequired: contract.exceptions.unresolved,
      },
      rowRationaleCodes,
      rowResultsPreview: contract.rowResults.slice(0, 100),
      stages: toStageRows(auditRows),
      runDelta: runDeltaRecord
        ? {
            inputChanged: runDeltaRecord.inputChanged,
            matchedDelta: runDeltaRecord.matchedDelta,
            unmatchedDelta: runDeltaRecord.unmatchedDelta,
            exceptionDelta: runDeltaRecord.exceptionDelta,
            configDriftDetected: runDeltaRecord.configDriftDetected,
            newExceptionPatterns: (runDeltaRecord.newExceptionPatterns as string[]) || [],
            resolvedPatterns: (runDeltaRecord.resolvedPatterns as string[]) || [],
            confidenceDelta: runDeltaRecord.confidenceDelta
              ? Number(runDeltaRecord.confidenceDelta)
              : null,
          }
        : null,
    });

    return { kind: "ok", detail: detailJson };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { kind: "recon_enrichment_failed", message };
  }
}
