import type { OperatorRunDetail } from "@/types/operator-run-detail";

export type OperatorAttentionSeverity = "critical" | "warning" | "info";

export interface OperatorAttentionItem {
  severity: OperatorAttentionSeverity;
  code: string;
  title: string;
  detail: string;
}

export interface OperatorNextAction {
  label: string;
  href?: string;
  rationale: string;
}

function pushUnique(
  items: OperatorAttentionItem[],
  item: OperatorAttentionItem,
  seen: Set<string>
) {
  const key = `${item.code}:${item.title}`;
  if (seen.has(key)) return;
  seen.add(key);
  items.push(item);
}

/**
 * Derives operator-facing attention items from canonical {@link OperatorRunDetail}.
 * All semantics are backend-owned; this layer only prioritizes and presents them.
 */
export function deriveOperatorRunAttention(run: OperatorRunDetail): OperatorAttentionItem[] {
  const items: OperatorAttentionItem[] = [];
  const seen = new Set<string>();

  if (run.error) {
    pushUnique(
      items,
      {
        severity: "critical",
        code: "run_error",
        title: "Run ended with an error",
        detail: run.error,
      },
      seen
    );
  }

  if (run.status === "failed" && run.isTerminal) {
    pushUnique(
      items,
      {
        severity: "critical",
        code: "terminal_failed",
        title: "Run status is failed",
        detail:
          "This run completed in a failed state. Inspect stages for the failing step and upstream data before retrying.",
      },
      seen
    );
  }

  if (run.configDrift.status === "detected") {
    pushUnique(
      items,
      {
        severity: "warning",
        code: "adapter_drift",
        title: "Adapter or connector drift detected",
        detail: `Source/target adapter inputs changed since capture (${run.configDrift.adapter}). Compare configuration against the prior snapshot before trusting like-for-like deltas.`,
      },
      seen
    );
  }

  if (run.runDelta?.configDriftDetected) {
    pushUnique(
      items,
      {
        severity: "warning",
        code: "run_delta_config_drift",
        title: "Config drift flagged on this run delta",
        detail:
          "The recorded delta marks configuration drift versus the prior run. Treat period-over-period comparisons as provisional until configuration is reconciled.",
      },
      seen
    );
  }

  const { exceptions } = run;
  if (exceptions.reviewRequired > 0) {
    pushUnique(
      items,
      {
        severity: "warning",
        code: "exceptions_review",
        title: `${exceptions.reviewRequired} exception${exceptions.reviewRequired === 1 ? "" : "s"} require review`,
        detail: `Pending: ${exceptions.pending}, investigating: ${exceptions.investigating}. Resolved: ${exceptions.resolved}, ignored: ${exceptions.ignored}.`,
      },
      seen
    );
  } else if (exceptions.pending > 0 || exceptions.investigating > 0) {
    pushUnique(
      items,
      {
        severity: "info",
        code: "exceptions_in_flight",
        title: "Exceptions still in workflow",
        detail: `${exceptions.pending} pending, ${exceptions.investigating} investigating (total ${exceptions.total} on this run).`,
      },
      seen
    );
  }

  const proof = run.compactProofSummary;
  const op = proof.operatorSummary;
  if (op.signal === "degraded" || op.signal === "unavailable" || op.signal === "not_comparable") {
    pushUnique(
      items,
      {
        severity: op.signal === "not_comparable" ? "warning" : "info",
        code: `proof_signal_${op.signal}`,
        title: `Proof / history signal: ${op.signal.replace(/_/g, " ")}`,
        detail: op.summary,
      },
      seen
    );
  }

  const pkg = proof.proofPackages;
  if (pkg.state === "degraded" && pkg.degradedEvidenceReasons.length > 0) {
    pushUnique(
      items,
      {
        severity: "warning",
        code: "proof_packages_degraded",
        title: "Proof package completeness is degraded",
        detail: pkg.degradedEvidenceReasons.join("; "),
      },
      seen
    );
  } else if (pkg.state === "setup_required") {
    pushUnique(
      items,
      {
        severity: "info",
        code: "proof_packages_setup",
        title: "Proof packages not fully established",
        detail:
          "Finalize or attach proof packages for this job so audit exports and support bundles carry complete evidence.",
      },
      seen
    );
  }

  if (run.runDelta?.newExceptionPatterns && run.runDelta.newExceptionPatterns.length > 0) {
    pushUnique(
      items,
      {
        severity: "warning",
        code: "new_exception_patterns",
        title: "New exception patterns vs prior run",
        detail: run.runDelta.newExceptionPatterns.join("; "),
      },
      seen
    );
  }

  if (run.runKind === "ingestion_run" && run.exceptionWorkflowNote) {
    pushUnique(
      items,
      {
        severity: "info",
        code: "ingestion_exception_scope",
        title: "Exception workflow scope (ingestion run)",
        detail: run.exceptionWorkflowNote,
      },
      seen
    );
  }

  const order: Record<OperatorAttentionSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  return [...items].sort((a, b) => order[a.severity] - order[b.severity]);
}

/**
 * Suggested next steps grounded in the same canonical detail (no invented intelligence).
 */
export function deriveOperatorRunNextActions(run: OperatorRunDetail): OperatorNextAction[] {
  const actions: OperatorNextAction[] = [];

  if (run.status === "failed" && run.isTerminal) {
    actions.push({
      label: "Review stages for the failing step",
      href: undefined,
      rationale: "Failed runs need the upstream error cleared before retry is meaningful.",
    });
  }

  if (run.exceptions.reviewRequired > 0 || run.exceptions.pending > 0) {
    actions.push({
      label: "Open exceptions for this workspace",
      href: "/console/exceptions",
      rationale: "Work the queue while run and proof context are still fresh.",
    });
  }

  if (
    run.compactProofSummary.proofPackages.state === "degraded" ||
    run.compactProofSummary.proofPackages.state === "setup_required"
  ) {
    actions.push({
      label: "Download proofpack from Proof & Provenance",
      href: undefined,
      rationale: "Proofpack is the portable, hash-linked record auditors and support expect.",
    });
  }

  if (run.runDelta?.newExceptionPatterns && run.runDelta.newExceptionPatterns.length > 0) {
    actions.push({
      label: "Review run delta and new patterns",
      href: undefined,
      rationale: "New patterns often indicate data or rule changes worth capturing in playbooks.",
    });
  }

  if (run.configDrift.status === "detected" || run.runDelta?.configDriftDetected) {
    actions.push({
      label: "Compare configuration to prior snapshot",
      href: undefined,
      rationale: "Drift explains variance that is not reconciliation logic.",
    });
  }

  if (actions.length === 0 && run.isTerminal && run.summary.unmatched === 0 && run.summary.conflicts === 0) {
    actions.push({
      label: "Archive evidence for close or audit",
      href: undefined,
      rationale: "Clean runs are the right time to export CSV and proofpack for the record.",
    });
  }

  return actions;
}
