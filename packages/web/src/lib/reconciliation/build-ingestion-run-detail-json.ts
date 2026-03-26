import type {
  AdapterDriftSignal,
  CanonicalReconciliationRunDetail,
} from "@settler/reconciliation-core";

function legacyAdapterDriftLabel(signal: AdapterDriftSignal): "source" | "target" | "both" | "none" {
  if (signal.sourceChanged && signal.targetChanged) return "both";
  if (signal.sourceChanged) return "source";
  if (signal.targetChanged) return "target";
  return "none";
}

/**
 * JSON body for GET /api/runs/[id] when the resolved entity is a `reconciliation_runs` row.
 * Intentionally narrower than recon_job detail (no snapshot, audits, drift_events FK, etc.).
 */
export function buildIngestionRunDetailJson(detail: CanonicalReconciliationRunDetail) {
  const s = detail.summary;
  const lifecycle = detail.lifecycle;
  const startedAt = detail.timestamps.startedAt ?? detail.timestamps.createdAt;

  const stageStatus: "pending" | "running" | "completed" | "failed" =
    lifecycle.status === "completed"
      ? "completed"
      : lifecycle.status === "failed"
        ? "failed"
        : lifecycle.status === "running"
          ? "running"
          : "pending";

  return {
    runKind: "ingestion_run" as const,
    id: detail.id,
    name: detail.name,
    status: lifecycle.status,
    statusLabel: lifecycle.statusLabel,
    isTerminal: lifecycle.isTerminal,
    progress: lifecycle.progressPercent,
    progressState: lifecycle.progressState,
    startedAt,
    completedAt: detail.timestamps.completedAt,
    ...(detail.errorMessage ? { error: detail.errorMessage } : {}),
    summary: {
      total: s.total,
      sourceCount: s.sourceCount,
      targetCount: s.targetCount,
      matched: s.matched,
      unmatched: s.unmatched,
      unmatchedSourceCount: s.unmatchedSourceCount,
      unmatchedTargetCount: s.unmatchedTargetCount,
      conflicts: s.conflicts,
    },
    summaryMath: {
      sourceCount: s.sourceCount,
      targetCount: s.targetCount,
      matchedCount: s.matched,
      unmatchedSourceCount: s.unmatchedSourceCount,
      unmatchedTargetCount: s.unmatchedTargetCount,
      conflictCount: s.conflicts,
      note:
        "Ingestion-backed run: counts come from reconciliation_runs; exception workflow and snapshot-backed config apply to recon job runs only.",
    },
    summarySemantics: {
      processed: s.processed,
      matchedWithTolerance: s.matchedWithTolerance,
      exceptioned: s.exceptioned,
      unresolved: s.unresolved,
      ignored: s.ignored,
      resolved: s.resolved,
    },
    summaryState: detail.summaryState,
    provenance: {
      sourceModel: detail.provenance.sourceModel,
      runKind: detail.provenance.runKind,
      ingestionId: detail.provenance.ingestionId,
      reconJobId: detail.provenance.reconJobId,
      executedAt: startedAt,
      completedAt: detail.timestamps.completedAt,
      sourceAdapter: detail.adapters.sourceAdapter,
      targetAdapter: detail.adapters.targetAdapter,
    },
    resultContext: {
      latestResultId: null,
      latestResultStatus: lifecycle.status,
      latestResultStartedAt: startedAt,
      latestResultCompletedAt: detail.timestamps.completedAt,
      persistedResultCount: 0,
      comparison: null,
      note: "This run is stored in reconciliation_runs (ingestion path), not recon_jobs + recon_results.",
    },
    config: {
      sourceAdapter: detail.adapters.sourceAdapter,
      targetAdapter: detail.adapters.targetAdapter,
      reconStrategy: null,
      templateId: null,
      validationRuleCount: 0,
      validationRuleLabels: [] as string[],
      ruleVersionCount: 0,
      ruleVersionLabels: [] as string[],
      snapshotId: null,
      inputHash: null,
      configSource: "job_definition" as const,
      configCapturedAt: null,
      definitionDriftDetected: false,
      definitionDriftNotes: [] as string[],
      summaryBasis: "Ingestion run row only; no job snapshot.",
    },
    configDrift: {
      status: detail.configDrift.status,
      adapter: legacyAdapterDriftLabel(detail.configDrift.adapter),
    },
    exceptions: {
      total: 0,
      pending: 0,
      investigating: 0,
      resolved: 0,
      ignored: 0,
      reviewRequired: 0,
    },
    exceptionWorkflowNote:
      "Drift events are keyed to recon_job_id today; ingestion-backed runs may not appear in exception lists filtered by this run id.",
    rowRationale: {
      available: false,
      rowCount: 0,
      codes: [] as string[],
    },
    rowResultsPreview: [] as unknown[],
    stages: [
      {
        id: "ingestion-reconciliation",
        name: "Ingestion reconciliation",
        status: stageStatus,
        startedAt,
        completedAt: detail.timestamps.completedAt ?? undefined,
        ...(detail.errorMessage ? { error: detail.errorMessage } : {}),
      },
    ],
    metadata: detail.metadata,
    traceId: detail.traceId,
  };
}
