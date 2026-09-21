#!/usr/bin/env node
/**
 * SCIM posture verifier — executable truth for buyer/operator surfaces.
 *
 * Verdict semantics (stdout JSON on last line):
 * - not_applicable: SCIM is intentionally not implemented in application code; no env can fix this in-repo.
 *
 * Exit codes:
 * - 0: not_applicable (expected default — documents honest boundary)
 * - 1: failed (internal error)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const verdict = {
  script: "verify-scim-posture",
  verdict: "not_applicable",
  summary:
    "SCIM (System for Cross-domain Identity Management) user lifecycle routes are not implemented in this repository. Enterprise identity scope remains manual provisioning plus config-gated OIDC env contracts.",
  claim_boundary:
    "Do not imply SCIM provisioning, JIT deprovisioning, or directory sync as operational without a separate shipped SCIM surface and tests.",
  verificationPath: [
    "pnpm run verify:scim-posture",
    "packages/web/src/__tests__/enterprise/capability-truth.test.ts",
  ],
};

const claimSurfaces = [
  "INVESTOR_OVERVIEW.md",
  "docs/STAKEHOLDER_READINESS.md",
  "packages/web/src/app/console/settings/page.tsx",
  "packages/web/src/app/console/settings/security/page.tsx",
];
const unsupportedClaims = [
  /SCIM is ready for integration/i,
  /Configure .*SCIM directory (syncing|provisioning)/i,
  /Manage SSO\s*&\s*SCIM/i,
  /Enterprise tier[^\n]*SCIM provisioning/i,
  /\| Enterprise \|[^\n]*\bSCIM\b/i,
];

const violations = [];
for (const relPath of claimSurfaces) {
  const content = readFileSync(resolve(root, relPath), "utf8");
  for (const pattern of unsupportedClaims) {
    if (pattern.test(content)) violations.push(`${relPath}: ${pattern}`);
  }
}

if (violations.length > 0) {
  console.error("SCIM posture verification failed: unsupported operational claims found.");
  for (const violation of violations) console.error(` - ${violation}`);
  process.exit(1);
}

const outPath = process.env.SETTLER_VERIFIER_JSON_OUT?.trim();
if (outPath) {
  try {
    writeFileSync(resolve(outPath), `${JSON.stringify(verdict, null, 2)}\n`, "utf8");
  } catch (err) {
    console.error("❌ Failed to write SETTLER_VERIFIER_JSON_OUT:", err?.message || err);
    process.exit(1);
  }
}

console.log("SCIM posture verification");
console.log(`verdict=${verdict.verdict}`);
console.log(verdict.summary);
console.log(JSON.stringify(verdict));
