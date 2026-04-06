#!/usr/bin/env node
/**
 * Aggregate enterprise boundary checks (identity env contract, SCIM honesty, Helm packaging).
 *
 * Exit code = worst of child scripts (numeric max): failure(1) wins over degraded(2) is wrong —
 * we use: any 1 => 1; else any 2 => 2; else 0.
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function runNodeScript(relPath) {
  const r = spawnSync(process.execPath, [resolve(root, relPath)], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
    env: process.env,
  });
  return r.status ?? 1;
}

console.log('\n=== verify:scim-posture ===\n');
const scim = runNodeScript('scripts/verify-scim-posture.mjs');

console.log('\n=== verify:helm-packaging ===\n');
const helm = runNodeScript('scripts/verify-helm-packaging.mjs');

console.log('\n=== verify:enterprise-identity ===\n');
const oidc = runNodeScript('scripts/verify-enterprise-identity.mjs');

if (scim !== 0) {
  console.error('\n❌ Unexpected: verify-scim-posture should exit 0 (not_applicable).');
  process.exit(1);
}

let code = 0;
if (helm === 1 || oidc === 1) code = 1;
else if (helm === 2 || oidc === 2) code = 2;
else if (helm !== 0 || oidc !== 0) code = 1;

console.log('\n--- verify-enterprise-posture summary ---');
console.log(`scim_exit=${scim} helm_exit=${helm} oidc_exit=${oidc} aggregate_exit=${code}`);
console.log(
  code === 0
    ? '✅ Aggregate: OIDC env contracts complete; Helm packaging verified.'
    : code === 2
      ? '⚠️ Aggregate: degraded (partial OIDC env and/or Helm missing — see logs). Not production SSO proof.'
      : '❌ Aggregate: failure (Helm lint/template error and/or SETTLER_REQUIRE_OIDC_GA violation).'
);

process.exit(code);
