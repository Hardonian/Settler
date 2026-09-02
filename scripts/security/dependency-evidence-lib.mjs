export const DEPENDENCY_EVIDENCE_MODES = new Set(["standard", "strict"]);

export const EVIDENCE_STATES = Object.freeze({
  VERIFIED: "VERIFIED",
  DEGRADED: "DEGRADED",
  UNAVAILABLE: "UNAVAILABLE",
  SKIPPED: "SKIPPED",
  FAILED: "FAILED",
});

export function summarizeLockfiles(lockfiles) {
  const present = lockfiles.filter((item) => item.present);
  return {
    total: lockfiles.length,
    presentCount: present.length,
    ecosystems: [...new Set(present.map((item) => item.ecosystem))].sort(),
    complete: present.length > 0,
  };
}

export function evaluateDependencyEvidence({ mode, audit, advisory, lockfiles }) {
  if (!DEPENDENCY_EVIDENCE_MODES.has(mode)) {
    throw new Error(`Unsupported dependency evidence mode: ${mode}`);
  }

  const reasons = [];
  const environmentConstraints = [];
  const nextActions = [];

  const localAuditKnown = Boolean(audit?.findingsSummary);
  const localAuditPass =
    localAuditKnown &&
    (audit.findingsSummary.high || 0) + (audit.findingsSummary.critical || 0) === 0 &&
    !String(audit.finalOutcome || "").startsWith("failed");

  if (!localAuditKnown) {
    reasons.push("Local dependency audit artifact was not available.");
    environmentConstraints.push("Run `pnpm run audit:deps` to capture local audit state.");
    nextActions.push("Run `pnpm run audit:deps` before release verification.");
  }

  if (audit?.degraded) {
    reasons.push(
      `Local dependency audit was degraded: ${(audit.degradedReasons || []).join(", ") || "unknown"}.`
    );
    environmentConstraints.push("Package registry audit backend/tooling degraded.");
    nextActions.push("Restore registry audit connectivity/auth and rerun `pnpm run audit:deps`.");
  }

  const advisoryState = advisory?.status || "unavailable";
  if (advisoryState !== "complete") {
    reasons.push(`Authenticated advisory completeness is ${advisoryState}.`);
    environmentConstraints.push(
      advisory?.reason || "Authenticated GitHub advisory evidence unavailable."
    );
    if (advisory?.nextAction) {
      nextActions.push(advisory.nextAction);
    }
  }

  const lockSummary = summarizeLockfiles(lockfiles);
  if (!lockSummary.complete) {
    reasons.push("No supported lockfile found; package inventory completeness is unavailable.");
    nextActions.push("Commit lockfile(s) for each ecosystem to improve inventory completeness.");
  }

  let status = "PASS";
  let evidenceCompleteness = "complete";

  if (localAuditKnown && !localAuditPass) {
    status = mode === "strict" ? "FAIL" : "PASS_WITH_DEGRADED_EVIDENCE";
    evidenceCompleteness = "partial";
  }

  if (!localAuditKnown) {
    status = mode === "strict" ? "FAIL" : "PASS_WITH_DEGRADED_EVIDENCE";
    evidenceCompleteness = "degraded";
  }

  if (advisoryState !== "complete" && status !== "FAIL") {
    status = mode === "strict" ? "FAIL" : "PASS_WITH_DEGRADED_EVIDENCE";
    evidenceCompleteness = "partial";
  }

  if (audit?.degraded && status !== "FAIL") {
    status = mode === "strict" ? "FAIL" : "PASS_WITH_DEGRADED_EVIDENCE";
    evidenceCompleteness = "degraded";
  }

  let evidenceState = EVIDENCE_STATES.VERIFIED;
  if (!localAuditKnown && !lockSummary.complete) evidenceState = EVIDENCE_STATES.UNAVAILABLE;
  if (advisoryState !== "complete" || audit?.degraded) evidenceState = EVIDENCE_STATES.DEGRADED;
  if (status === "FAIL") evidenceState = EVIDENCE_STATES.FAILED;

  return {
    mode,
    status,
    evidenceState,
    evidenceCompleteness,
    localAudit: {
      available: localAuditKnown,
      pass: localAuditPass,
      degraded: Boolean(audit?.degraded),
      summary: audit?.findingsSummary || null,
      outcome: audit?.finalOutcome || "unavailable",
    },
    advisory,
    lockfiles,
    lockSummary,
    reason: reasons.join(" "),
    environmentConstraints: [...new Set(environmentConstraints)],
    nextActions: [...new Set(nextActions)],
  };
}
