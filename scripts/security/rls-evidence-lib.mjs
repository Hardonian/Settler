export const EVIDENCE_STATES = Object.freeze({
  VERIFIED: "VERIFIED",
  DEGRADED: "DEGRADED",
  UNAVAILABLE: "UNAVAILABLE",
  SKIPPED: "SKIPPED",
  FAILED: "FAILED",
});

export function evaluateRlsEvidence({ mode, verification }) {
  const runtimeExecuted = verification?.liveDbConfigured === true;
  const staticStatus = verification?.proofLevel === "static-only" ? "PASS" : "PASS";

  const base = {
    mode,
    testedTables: verification?.testedTables || [],
    runtimeExecuted,
    fixtures: verification?.fixtures || null,
    allowDenyMatrix: verification?.allowDenyMatrix || null,
    policyPresence: verification?.policyPresence || null,
    reason: verification?.boundary || "RLS verification artifact unavailable.",
    environmentConstraints: [],
    nextOperatorAction: [],
  };

  if (!verification) {
    return {
      ...base,
      status: mode === "runtime-rls-required" ? "FAIL" : "UNAVAILABLE",
      evidenceState:
        mode === "runtime-rls-required" ? EVIDENCE_STATES.FAILED : EVIDENCE_STATES.UNAVAILABLE,
      evidenceLevel: "unavailable",
      environmentConstraints: [
        "Run `node scripts/security/verify-rls-boundary.mjs` to generate baseline artifact.",
      ],
      nextOperatorAction: [
        "Provide DB env and run `pnpm run verify:rls:live` for runtime confirmation.",
      ],
    };
  }

  if (verification.proofLevel === "live-db-confirmed" && verification.status === "passed") {
    return {
      ...base,
      status: "PASS",
      evidenceState: EVIDENCE_STATES.VERIFIED,
      evidenceLevel: "runtime-confirmed",
    };
  }

  if (verification.status === "failed") {
    return {
      ...base,
      status: "FAIL",
      evidenceState: EVIDENCE_STATES.FAILED,
      evidenceLevel:
        verification.proofLevel === "live-db-attempted-failed"
          ? "runtime-attempted-failed"
          : "static-only",
      environmentConstraints:
        verification.proofLevel === "live-db-required-missing-config"
          ? ["Live DB credentials missing while runtime RLS is required."]
          : [],
      nextOperatorAction: ["Fix DB configuration/policies and rerun `pnpm run verify:rls:live`."],
    };
  }

  if (!runtimeExecuted) {
    const required = mode === "runtime-rls-required";
    return {
      ...base,
      status: required ? "FAIL" : "PASS_WITH_DEGRADED_EVIDENCE",
      evidenceState: required ? EVIDENCE_STATES.FAILED : EVIDENCE_STATES.DEGRADED,
      evidenceLevel: "static-only",
      environmentConstraints: [
        "Runtime RLS verification not executed; only static boundary/policy checks were captured.",
      ],
      nextOperatorAction: [
        "Set DATABASE_URL (or DIRECT_URL/SUPABASE_DB_URL) and run `pnpm run verify:rls:live`.",
      ],
    };
  }

  return {
    ...base,
    status: staticStatus,
    evidenceState:
      verification?.status === "skipped" ? EVIDENCE_STATES.SKIPPED : EVIDENCE_STATES.DEGRADED,
    evidenceLevel: "static-only",
  };
}
