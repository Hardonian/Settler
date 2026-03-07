import test from "node:test";
import assert from "node:assert/strict";
import { evaluateDependencyEvidence } from "../security/dependency-evidence-lib.mjs";

const lockfiles = [{ ecosystem: "npm", path: "pnpm-lock.yaml", present: true }];

test("downgrades in standard mode when advisory auth is missing", () => {
  const result = evaluateDependencyEvidence({
    mode: "standard",
    lockfiles,
    advisory: {
      status: "unauthenticated",
      reason: "Missing token",
      nextAction: "Provide token",
    },
    audit: {
      findingsSummary: { high: 0, critical: 0 },
      finalOutcome: "passed",
      degraded: false,
    },
  });

  assert.equal(result.status, "PASS_WITH_DEGRADED_EVIDENCE");
  assert.equal(result.evidenceCompleteness, "partial");
});

test("upgrades to pass when authenticated advisory evidence exists", () => {
  const result = evaluateDependencyEvidence({
    mode: "strict",
    lockfiles,
    advisory: {
      status: "complete",
      reason: "Authenticated export",
      nextAction: null,
    },
    audit: {
      findingsSummary: { high: 0, critical: 0 },
      finalOutcome: "passed",
      degraded: false,
    },
  });

  assert.equal(result.status, "PASS");
  assert.equal(result.evidenceCompleteness, "complete");
});
