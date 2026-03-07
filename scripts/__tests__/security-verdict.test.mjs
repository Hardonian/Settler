import test from "node:test";
import assert from "node:assert/strict";
import { computeSecurityVerdict } from "../security/verdict-lib.mjs";

test("verdict is conditional when advisory completeness missing", () => {
  const verdict = computeSecurityVerdict({
    dependencyEvidence: {
      status: "PASS_WITH_DEGRADED_EVIDENCE",
      evidenceCompleteness: "partial",
      reason: "No advisory auth",
      advisoryCompleteness: { status: "unauthenticated", reason: "missing auth" },
      nextOperatorAction: ["provide auth"],
    },
    rlsEvidence: {
      status: "PASS_WITH_DEGRADED_EVIDENCE",
      evidenceLevel: "static-only",
      reason: "not run",
    },
    headerProbe: { counts: { failedBlocking: 0 }, degraded: false },
    crossTenant: { status: "passed" },
  });

  assert.equal(verdict.overall.overall_launch_safe, "CONDITIONAL");
  assert.equal(verdict.overall.overall_enterprise_review_safe, "IMPROVED_NOT_COMPLETE");
  assert.equal(verdict.overall.launch_safe, "CONDITIONAL");
});
