import test from "node:test";
import assert from "node:assert/strict";
import {
  AUDIT_STATES,
  classifyAuditUnavailability,
  resolveAuditState,
} from "../security/supply-chain-policy.mjs";

test("classifyAuditUnavailability distinguishes endpoint_403", () => {
  const result = classifyAuditUnavailability("ERR_PNPM_AUDIT_BAD_RESPONSE statusCode: 403");
  assert.equal(result.category, "endpoint_403");
});

test("classifyAuditUnavailability marks missing_auth", () => {
  const result = classifyAuditUnavailability("ERR_PNPM_FETCH_401 No authorization header was set");
  assert.equal(result.category, "missing_auth");
});

test("resolveAuditState selects unavailable-soft only when explicitly allowed", () => {
  const soft = resolveAuditState({
    auditUnavailable: true,
    allowUnavailable: true,
    misconfigured: false,
    thresholdFailures: 0,
  });
  assert.equal(soft, AUDIT_STATES.UNAVAILABLE_SOFT);

  const hard = resolveAuditState({
    auditUnavailable: true,
    allowUnavailable: false,
    misconfigured: false,
    thresholdFailures: 0,
  });
  assert.equal(hard, AUDIT_STATES.UNAVAILABLE_HARD);
});

test("resolveAuditState never downgrades misconfiguration", () => {
  const result = resolveAuditState({
    auditUnavailable: true,
    allowUnavailable: true,
    misconfigured: true,
    thresholdFailures: 0,
  });
  assert.equal(result, AUDIT_STATES.MISCONFIGURED);
});
