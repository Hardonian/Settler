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

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const verdict = {
  script: 'verify-scim-posture',
  verdict: 'not_applicable',
  summary:
    'SCIM (System for Cross-domain Identity Management) user lifecycle routes are not implemented in this repository. Enterprise identity scope remains manual provisioning plus config-gated OIDC env contracts.',
  claim_boundary:
    'Do not imply SCIM provisioning, JIT deprovisioning, or directory sync as operational without a separate shipped SCIM surface and tests.',
  verificationPath: ['pnpm run verify:scim-posture', 'packages/web/src/__tests__/enterprise/capability-truth.test.ts'],
};

const outPath = process.env.SETTLER_VERIFIER_JSON_OUT?.trim();
if (outPath) {
  try {
    writeFileSync(resolve(outPath), `${JSON.stringify(verdict, null, 2)}\n`, 'utf8');
  } catch (err) {
    console.error('❌ Failed to write SETTLER_VERIFIER_JSON_OUT:', err?.message || err);
    process.exit(1);
  }
}

console.log('SCIM posture verification');
console.log(`verdict=${verdict.verdict}`);
console.log(verdict.summary);
console.log(JSON.stringify(verdict));
