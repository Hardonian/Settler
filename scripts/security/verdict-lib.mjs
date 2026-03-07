const BLOCKING = new Set(["FAIL"]);

function dim(status, evidenceLevel, blocking, reason, nextAction = []) {
  return { status, evidenceLevel, blocking, reason, nextAction };
}

export function computeSecurityVerdict(inputs) {
  const dependency = inputs.dependencyEvidence;
  const rls = inputs.rlsEvidence;
  const headerProbe = inputs.headerProbe;
  const crossTenant = inputs.crossTenant;

  const dimensions = {
    code_security_status:
      headerProbe?.counts?.failedBlocking > 0
        ? dim("FAIL", "runtime-probed", true, "Blocking header/CSP contract failures found.")
        : dim(
            "PASS",
            headerProbe?.degraded ? "degraded" : "runtime-probed",
            false,
            "Header contract checks passed without blocking failures."
          ),

    dependency_evidence_status: dim(
      dependency?.status || "UNAVAILABLE",
      dependency?.evidenceCompleteness || "unavailable",
      true,
      dependency?.reason || "Dependency evidence artifact unavailable.",
      dependency?.nextOperatorAction || []
    ),

    advisory_completeness_status: dim(
      dependency?.advisoryCompleteness?.status === "complete" ? "PASS" : "CONDITIONAL",
      dependency?.advisoryCompleteness?.status || "unavailable",
      false,
      dependency?.advisoryCompleteness?.reason ||
        "Authenticated advisory completeness unavailable.",
      dependency?.nextOperatorAction || []
    ),

    tenant_isolation_status:
      crossTenant?.status === "passed"
        ? dim("PASS", "runtime-api", false, "Cross-tenant runtime denial checks passed.")
        : dim(
            "CONDITIONAL",
            "runtime-api-missing",
            false,
            "Cross-tenant runtime denial evidence missing or not passing."
          ),

    runtime_probe_status:
      rls?.evidenceLevel === "runtime-confirmed"
        ? dim("PASS", "runtime-confirmed", false, "RLS runtime allow/deny matrix confirmed.")
        : rls?.status === "FAIL"
          ? dim(
              "FAIL",
              rls?.evidenceLevel || "unavailable",
              true,
              rls?.reason || "RLS runtime verification failed.",
              rls?.nextOperatorAction || []
            )
          : dim(
              "CONDITIONAL",
              rls?.evidenceLevel || "static-only",
              false,
              rls?.reason || "RLS runtime verification not executed.",
              rls?.nextOperatorAction || []
            ),

    tenant_isolation_rls_status: dim(
      rls?.status || "UNAVAILABLE",
      rls?.evidenceLevel || "unavailable",
      rls?.status === "FAIL",
      rls?.reason || "RLS evidence artifact unavailable.",
      rls?.nextOperatorAction || []
    ),
  };

  const blockingFails = Object.values(dimensions).filter(
    (d) => d.blocking && BLOCKING.has(d.status)
  );

  const overall_development_safe = blockingFails.length === 0 ? "YES" : "NO";
  const launchBlocking = [
    dimensions.code_security_status,
    dimensions.dependency_evidence_status,
    dimensions.tenant_isolation_rls_status,
  ].some((d) => d.status === "FAIL");
  const launchDegraded = [
    dimensions.dependency_evidence_status,
    dimensions.runtime_probe_status,
  ].some((d) => ["CONDITIONAL", "PASS_WITH_DEGRADED_EVIDENCE"].includes(d.status));

  const overall_launch_safe = launchBlocking ? "NO" : launchDegraded ? "CONDITIONAL" : "YES";

  const enterpriseRequiresFull =
    dimensions.advisory_completeness_status.status === "PASS" &&
    dimensions.runtime_probe_status.status === "PASS" &&
    !launchBlocking;

  const overall_enterprise_review_safe = enterpriseRequiresFull ? "YES" : "IMPROVED_NOT_COMPLETE";

  return {
    reportVersion: "2026-03-09.1",
    generatedAt: new Date().toISOString(),
    dimensions,
    overall: {
      overall_development_safe,
      overall_launch_safe,
      overall_enterprise_review_safe,
    },
  };
}
