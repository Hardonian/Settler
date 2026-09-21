import assert from "node:assert";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { auditSecurityClaims, findUnsupportedSecurityClaims } from "../verify-security-claims.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));

test("active buyer-facing security surfaces pass the truth check", () => {
  assert.deepStrictEqual(auditSecurityClaims(root).violations, []);
});

test("absolute security and compliance claims are rejected", () => {
  const claims = [
    "No cross-tenant data access",
    "Complete tenant isolation",
    "Cross-tenant access is mechanically prevented",
    "All queries are filtered by tenant_id",
    "GDPR compliant",
    "CCPA compliant",
    "HIPAA ready",
    "SOC 2 certified",
    "Production-ready",
    "SLA-backed support",
    "99.9% uptime",
  ];

  for (const claim of claims) {
    assert.ok(findUnsupportedSecurityClaims(claim).length > 0, `expected rejection for: ${claim}`);
  }
});

test("scoped controls and explicit evidence gaps remain allowed", () => {
  const claims = [
    "RLS definitions are present; live verification is pending.",
    "Static tenant route coverage passed.",
    "No certification is registered in the evidence room.",
    "Availability commitments require an executed agreement.",
  ];

  for (const claim of claims) {
    assert.deepStrictEqual(findUnsupportedSecurityClaims(claim), [], `expected allowed: ${claim}`);
  }
});
