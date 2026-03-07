const AUDIT_STATES = {
  PASS: "pass",
  FAIL: "fail",
  UNAVAILABLE_HARD: "unavailable-hard",
  UNAVAILABLE_SOFT: "unavailable-soft",
  MISCONFIGURED: "misconfigured",
};

export { AUDIT_STATES };

export function classifyAuditUnavailability(rawOutput, { timedOut = false } = {}) {
  const text = String(rawOutput || "");

  if (timedOut) {
    return { category: "timeout", detail: "pnpm audit timed out" };
  }

  if (
    text.includes("ERR_PNPM_AUDIT_BAD_RESPONSE") &&
    (text.includes("statusCode: 403") || text.includes("403"))
  ) {
    return { category: "endpoint_403", detail: "registry audit endpoint returned HTTP 403" };
  }

  if (
    text.includes("ERR_PNPM_FETCH_401") ||
    text.includes("ENEEDAUTH") ||
    text.includes("No authorization header was set")
  ) {
    return { category: "missing_auth", detail: "registry credentials are missing or invalid" };
  }

  if (
    text.includes("ETIMEDOUT") ||
    text.includes("ECONNREFUSED") ||
    text.includes("ENOTFOUND") ||
    text.includes("network")
  ) {
    return { category: "network_error", detail: "network error while contacting registry" };
  }

  if (text.includes("not supported") || text.includes("unsupported")) {
    return {
      category: "unsupported_environment",
      detail: "audit is unsupported in this environment",
    };
  }

  if (text.trim().length === 0) {
    return { category: "malformed_response", detail: "empty audit output" };
  }

  return { category: "malformed_response", detail: "audit output was not parseable JSON" };
}

export function resolveAuditState({
  auditUnavailable,
  allowUnavailable,
  misconfigured,
  thresholdFailures,
}) {
  if (misconfigured) {
    return AUDIT_STATES.MISCONFIGURED;
  }

  if (!auditUnavailable && thresholdFailures > 0) {
    return AUDIT_STATES.FAIL;
  }

  if (!auditUnavailable) {
    return AUDIT_STATES.PASS;
  }

  return allowUnavailable ? AUDIT_STATES.UNAVAILABLE_SOFT : AUDIT_STATES.UNAVAILABLE_HARD;
}
