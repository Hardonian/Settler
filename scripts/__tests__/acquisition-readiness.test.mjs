import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditAcquisitionReadiness,
  findUnsupportedClaims,
} from "../verify-acquisition-readiness.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));

test("active acquisition packet passes the truth check", () => {
  assert.deepStrictEqual(auditAcquisitionReadiness(root).violations, []);
});

test("unsupported commercial and diligence claims are rejected", () => {
  const claims = [
    "Real Results from Beta Customers",
    "99.4% average match accuracy",
    "Freedom to operate confirmed",
    "Current Team Size: 5 people",
    "Valuation Range: $50M-$200M",
    "Current: [Tracked in Mixpanel]",
    "SOC 2 Type II certified",
    "GDPR compliant",
    "HIPAA ready",
    "Why Stripe & PayPal Compete to Own Settler",
    "SOX-compliant approvals",
    "Calculate Recoverable ROI",
    "Institutional Payment Leakage & ROI Engine",
    "absolute precision and audit-ready certainty",
    "Zero Cross-Tenant Leakage Guaranteed",
  ];

  for (const claim of claims) {
    assert.ok(findUnsupportedClaims(claim).length > 0, `expected rejection for: ${claim}`);
  }
});

test("targets and explicit evidence boundaries remain allowed", () => {
  const allowed = [
    "Target: five paying production customers",
    "SOC 2 readiness is not certification",
    "Missing external evidence",
    "OIDC is configuration-gated",
  ];

  for (const claim of allowed) {
    assert.deepStrictEqual(findUnsupportedClaims(claim), [], `expected allowed: ${claim}`);
  }
});

test("command-line verifier exits successfully", () => {
  const result = spawnSync(
    process.execPath,
    [resolve(root, "scripts/verify-acquisition-readiness.mjs")],
    { cwd: root, encoding: "utf8" }
  );
  assert.strictEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /truth check passed/i);
});
