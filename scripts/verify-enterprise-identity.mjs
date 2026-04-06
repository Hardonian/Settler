#!/usr/bin/env node
/**
 * Enterprise OIDC env-contract verification (configuration surface only).
 *
 * This does not prove IdP interoperability, token exchange, or callback wiring at runtime.
 *
 * Verdict semantics (stdout ends with single-line JSON):
 * - verified_pass: all supported providers have ISSUER, CLIENT_ID, CLIENT_SECRET
 * - verified_degraded: zero or partial provider configuration (expected in many dev/staging envs)
 * - failed: SETTLER_REQUIRE_OIDC_GA=true but contract incomplete; or internal error
 *
 * Exit codes:
 * - 0: verified_pass
 * - 2: verified_degraded (not a failure — do not treat as green production proof)
 * - 1: failed
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const providers = [
  { key: 'okta', prefix: 'SSO_OIDC_OKTA' },
  { key: 'entra', prefix: 'SSO_OIDC_ENTRA' },
  { key: 'google_workspace', prefix: 'SSO_OIDC_GOOGLE' },
];

const required = ['ISSUER', 'CLIENT_ID', 'CLIENT_SECRET'];

function readEnv(name) {
  const v = process.env[name];
  if (!v) return '';
  const t = v.trim();
  return t;
}

const results = providers.map(({ key, prefix }) => {
  const missing = required.map((suffix) => `${prefix}_${suffix}`).filter((name) => !readEnv(name));

  return {
    provider: key,
    state: missing.length === 0 ? 'configured' : 'degraded',
    missing,
  };
});

const configuredCount = results.filter((item) => item.state === 'configured').length;
const allConfigured = configuredCount === providers.length;

let verdict;
let exitCode;

if ((process.env.SETTLER_REQUIRE_OIDC_GA || '').toLowerCase() === 'true' && !allConfigured) {
  verdict = {
    script: 'verify-enterprise-identity',
    verdict: 'failed',
    summary:
      'SETTLER_REQUIRE_OIDC_GA=true requires Okta, Entra, and Google Workspace OIDC env contracts to be complete.',
    providers: results,
    configuredCount,
  };
  exitCode = 1;
} else if (allConfigured) {
  verdict = {
    script: 'verify-enterprise-identity',
    verdict: 'verified_pass',
    summary:
      'All three OIDC provider env contracts are present. This validates configuration keys only — not end-to-end SSO or tenant mapping at an IdP.',
    providers: results,
    configuredCount,
  };
  exitCode = 0;
} else {
  verdict = {
    script: 'verify-enterprise-identity',
    verdict: 'verified_degraded',
    summary:
      configuredCount === 0
        ? 'No IdP OIDC env contract is complete. SSO remains configuration-gated; do not imply operational enterprise SSO without IdP-specific runtime proof.'
        : `Partial OIDC configuration (${configuredCount}/${providers.length} providers). Interoperability remains unproven by this script.`,
    providers: results,
    configuredCount,
    boundary:
      'Product, docs, and admin surfaces must not read “SSO ready” from this script alone when verdict is verified_degraded.',
  };
  exitCode = 2;
}

const outPath = process.env.SETTLER_VERIFIER_JSON_OUT?.trim();
if (outPath) {
  try {
    writeFileSync(resolve(outPath), `${JSON.stringify(verdict, null, 2)}\n`, 'utf8');
  } catch (err) {
    console.error('❌ Failed to write SETTLER_VERIFIER_JSON_OUT:', err?.message || err);
    process.exit(1);
  }
}

console.log('Enterprise OIDC env-contract verification (not runtime SSO proof)');
for (const result of results) {
  if (result.state === 'configured') {
    console.log(`✅ ${result.provider}: configured`);
  } else {
    console.log(`⚠️ ${result.provider}: degraded (missing ${result.missing.join(', ')})`);
  }
}

console.log(`verdict=${verdict.verdict}`);
console.log(verdict.summary);
console.log(JSON.stringify(verdict));

process.exit(exitCode);
