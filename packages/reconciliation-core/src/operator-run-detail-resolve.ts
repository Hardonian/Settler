/**
 * Canonical operator run detail read pipeline: resolve → enrich → serialize to OperatorRunDetail.
 *
 * `runs` / GET /api/runs/[id] is the operator-truth surface. This module owns all
 * tenant-scoped enrichment needed for that response (recon_job and ingestion_run).
 */

import {
  buildCanonicalRunResultContract,
  buildLegacyRunSummary,
  toLegacyRunTruth,
  type DeterministicMatchRowLike,
  type ReconJobRecordLike,
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
import {
  buildRunProofpackIndexByRunId,
  resolveRunCompactProofSummary,
} from "./run-proofpack-index.js";
import { classifyRunDelta } from "./run-delta-classification.js";
import { computeSourceReliabilityProjection } from "./source-reliability.js";
import {
  aggregateAdjudicationLearning,
  buildWorkforceHints,
  type OperatorRunIntelligence,
} from "./run-operator-intelligence.js";
import { resolveReconciliationExceptionScope } from "./exception-workbench.js";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";

export type OperatorRunDetailResolution =
  | { kind: "ok"; detail: OperatorRunDetail }
  | { kind: "ambiguous_uuid_collision"; jobId: string; ingestionRunId: string }
  | { kind: "not_found" }
  | { kind: "recon_enrichment_failed"; message: string };

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
  prisma: ReconciliationCorePrismaClient,
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
        proofpackIndex: undefined,
      }),
    };
  }

  try {
    const job = resolved.jobRecord;
    const latestResult = resolved.latestResultRecord;
    const snapshotId = latestResult?.snapshot_id ?? null;

    const [
      audits,
      exceptionCountResult,
      exceptionScope,
      runDeltaRecord,
      snapshotRecord,
      deterministicRowsRaw,
    ] = await Promise.all([
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
      resolveReconciliationExceptionScope({
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
        ? prisma.$queryRaw<DeterministicMatchRowLike[]>`
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
        `.catch((err: unknown) => {
            console.warn(
              "[settler] deterministic_match_results query failed for run",
              latestResult?.id,
              err instanceof Error ? err.message : String(err)
            );
            return [] as DeterministicMatchRowLike[];
          })
        : Promise.resolve([]),
    ]);

    const deterministicRows = deterministicRowsRaw as DeterministicMatchRowLike[];

    const persistedResultCount = resolved.persistedResultCount;
    const previousRecord = resolved.previousResultRecord;
    const latestRecord = latestResult;

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

    // Typed audit record to avoid 'as any' at Prisma delegate boundary.
    type ReconAuditRecord = {
      id: string;
      auditType: string;
      action: string;
      metadata: unknown;
      createdAt: Date;
    };

    const auditRows: ReconAuditRow[] = (audits as ReconAuditRecord[]).map((a) => ({
      id: a.id,
      audit_type: a.auditType,
      action: a.action,
      metadata: (a.metadata as Record<string, unknown> | null) ?? null,
      created_at: a.createdAt.toISOString(),
    }));

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

    const proofpackIndexByRun = await buildRunProofpackIndexByRunId({
      prisma,
      tenantId: job.tenantId,
      runs: [resolved.detail],
    });

    const proofpackIndex = proofpackIndexByRun.get(resolved.detail.id);
    const compactResolution = resolveRunCompactProofSummary({
      runKind: resolved.detail.runKind,
      proofpackIndex,
    });

    const deltaClassification = runDeltaRecord
      ? classifyRunDelta({
          matchedDelta: runDeltaRecord.matchedDelta,
          unmatchedDelta: runDeltaRecord.unmatchedDelta,
          exceptionDelta: runDeltaRecord.exceptionDelta,
          inputChanged: runDeltaRecord.inputChanged,
          configDriftDetected: runDeltaRecord.configDriftDetected,
          criticalDelta:
            runDeltaRecord.criticalDelta != null ? Number(runDeltaRecord.criticalDelta) : 0,
          highDelta: runDeltaRecord.highDelta != null ? Number(runDeltaRecord.highDelta) : 0,
        })
      : null;

    const sourceReliability = computeSourceReliabilityProjection({
      configDriftStatus: resolved.detail.configDrift.status,
      proofPackagesState: compactResolution.compactProofSummary.proofPackages.state,
      inputHashPresent: Boolean(latestRecord?.input_hash),
      comparisonState: compactResolution.compactProofSummary.delta.state,
    });

    let institutionalMemory: NonNullable<OperatorRunDetail["institutionalMemory"]> = {
      state: "unavailable",
      reasonCodes: ["ADJ_MEMORY_SCOPE_UNAVAILABLE"],
      operatorMessage:
        "Adjudication memory could not be scoped to reconciliation_matches for this run.",
      adjudications: [],
    };

    if (exceptionScope.kind === "not_found") {
      institutionalMemory = {
        state: "unavailable",
        reasonCodes: ["ADJ_MEMORY_EXCEPTION_SCOPE_NOT_FOUND"],
        operatorMessage:
          "Exception scope for this run id was not found; adjudication memory is not attached.",
        adjudications: [],
      };
    } else if (exceptionScope.kind === "ambiguous_uuid_collision") {
      institutionalMemory = {
        state: "unavailable",
        reasonCodes: ["ADJ_MEMORY_EXCEPTION_SCOPE_AMBIGUOUS"],
        operatorMessage:
          "Exception scope is ambiguous (UUID collision); adjudication memory is not attached until the run is disambiguated.",
        adjudications: [],
      };
    } else if (exceptionScope.kind === "scoped" && exceptionScope.runIds.length === 0) {
      institutionalMemory = {
        state: "unavailable",
        reasonCodes: ["ADJ_MEMORY_NO_LINKED_RECONCILIATION_RUNS"],
        operatorMessage:
          "No reconciliation_runs rows are linked to this recon job in metadata; adjudication memory cannot be scoped.",
        adjudications: [],
      };
    }

    const learningRows: Array<{
      resolutionReason: string | null;
      adjudicationType: string;
      matchType?: string | null;
    }> = [];

    if (exceptionScope.kind === "scoped" && exceptionScope.runIds.length > 0) {
      try {
        const memories = await prisma.exceptionAdjudicationMemory.findMany({
          where: {
            tenantId: job.tenantId,
            exception: { runId: { in: exceptionScope.runIds } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            exceptionId: true,
            resolution: true,
            resolutionReason: true,
            adjudicationType: true,
            adjudicatorId: true,
            createdAt: true,
            exception: { select: { matchType: true } },
          },
        });

        institutionalMemory = {
          state: "available",
          reasonCodes: [],
          operatorMessage:
            "Adjudication rows below are tenant-scoped and limited to exceptions on runs linked to this recon job.",
          adjudications: memories.map(
            (m: {
              id: string;
              exceptionId: string;
              resolution: string;
              resolutionReason: string | null;
              adjudicationType: string;
              adjudicatorId: string;
              createdAt: Date;
              exception: { matchType: string } | null;
            }) => ({
              id: m.id,
              exceptionId: m.exceptionId,
              resolution: m.resolution,
              resolutionReason: m.resolutionReason,
              adjudicationType: m.adjudicationType,
              adjudicatorId: m.adjudicatorId,
              createdAt: m.createdAt.toISOString(),
            })
          ),
        };

        for (const m of memories as Array<{
          resolutionReason: string | null;
          adjudicationType: string;
          exception: { matchType: string } | null;
        }>) {
          learningRows.push({
            resolutionReason: m.resolutionReason,
            adjudicationType: m.adjudicationType,
            matchType: m.exception?.matchType ?? null,
          });
        }
      } catch {
        institutionalMemory = {
          state: "degraded",
          reasonCodes: ["ADJ_MEMORY_QUERY_FAILED"],
          operatorMessage:
            "Adjudication memory query failed; operator truth excludes adjudication rows until the query succeeds.",
          adjudications: [],
        };
      }
    }

    const adjudicationLearning = aggregateAdjudicationLearning(learningRows);
    const workforce = deltaClassification
      ? buildWorkforceHints(deltaClassification)
      : { triggerRunDeltaAnalysis: false, reasonCodes: [] as string[] };

    const intelligenceReasonCodes: string[] = [
      ...sourceReliability.reasonCodes,
      ...(institutionalMemory.state === "degraded" ? institutionalMemory.reasonCodes : []),
      ...(deltaClassification?.reasoningCodes ?? []),
      ...workforce.reasonCodes,
    ].filter((c, i, a) => a.indexOf(c) === i);

    const intelligenceState: OperatorRunIntelligence["state"] =
      institutionalMemory.state === "degraded" ? "degraded" : "available";

    if (compactResolution.source === "fallback_unavailable") {
      intelligenceReasonCodes.push("INTEL_PROOF_SUMMARY_FALLBACK");
    }

    const intelligence: OperatorRunDetail["intelligence"] = {
      state: intelligenceState,
      reasonCodes: [...new Set(intelligenceReasonCodes)].sort(),
      operatorMessage:
        intelligenceState === "degraded"
          ? "Partial operator intelligence: adjudication memory or upstream signals are degraded. Reliability and delta signals remain evidence-backed."
          : "Operator intelligence available from proof posture, drift, adjudication sample, and persisted run delta when present.",
      sourceReliability,
      adjudicationLearning,
      runDelta: runDeltaRecord
        ? {
            recordId: runDeltaRecord.id,
            previousRunId: runDeltaRecord.previousRunId ?? null,
            classification: deltaClassification!,
          }
        : null,
      workforce,
    };

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
      proofpackIndex,
      runDelta: runDeltaRecord
        ? {
            recordId: runDeltaRecord.id,
            previousRunId: runDeltaRecord.previousRunId ?? null,
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
            classification: deltaClassification!,
          }
        : null,
      institutionalMemory,
      intelligence,
    });

    return { kind: "ok", detail: detailJson };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { kind: "recon_enrichment_failed", message };
  }
}
