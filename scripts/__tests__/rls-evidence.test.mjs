import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRlsEvidence } from "../security/rls-evidence-lib.mjs";

test("runtime confirmation upgrades evidence level from static-only", () => {
  const staticOnly = evaluateRlsEvidence({
    mode: "runtime-rls",
    verification: { status: "skipped", proofLevel: "static-only", liveDbConfigured: false },
  });
  const runtime = evaluateRlsEvidence({
    mode: "runtime-rls",
    verification: { status: "passed", proofLevel: "live-db-confirmed", liveDbConfigured: true },
  });

  assert.equal(staticOnly.evidenceLevel, "static-only");
  assert.equal(staticOnly.evidenceState, "DEGRADED");
  assert.equal(runtime.evidenceLevel, "runtime-confirmed");
  assert.equal(runtime.status, "PASS");
  assert.equal(runtime.evidenceState, "VERIFIED");
});

test("cross-tenant deny in runtime harness remains required for pass semantics", () => {
  const result = evaluateRlsEvidence({
    mode: "runtime-rls",
    verification: {
      status: "passed",
      proofLevel: "live-db-confirmed",
      liveDbConfigured: true,
      allowDenyMatrix: { sameTenantAllow: true, crossTenantDeny: true, anonymousDeny: true },
    },
  });

  assert.equal(result.status, "PASS");
  assert.equal(result.allowDenyMatrix.crossTenantDeny, true);
});
