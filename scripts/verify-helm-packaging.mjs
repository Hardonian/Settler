#!/usr/bin/env node
/**
 * Self-hosted Helm chart — packaging verification only (no cluster runtime proof).
 *
 * Verdict semantics:
 * - verified_pass: helm present; lint + template succeed
 * - blocked_missing_env: helm binary not installed (tooling missing — not a silent pass)
 * - failed: helm errors
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const chartDir = 'deploy/helm/settler';

function helmAvailable() {
  const r = spawnSync('helm', ['version', '--short'], { encoding: 'utf8' });
  return r.status === 0;
}

let verdict;
let exitCode = 0;

if (!helmAvailable()) {
  verdict = {
    script: 'verify-helm-packaging',
    verdict: 'blocked_missing_env',
    reason: 'helm_cli_missing',
    summary:
      'Helm CLI is not on PATH. Chart packaging was not linted or templated. Self-hosted claims must stay limited to "packaging verified when helm is available" unless a separate cluster smoke proves runtime.',
    chartDir,
  };
  exitCode = 1;
} else {
  const lint = spawnSync('helm', ['lint', chartDir], { encoding: 'utf8', stdio: 'pipe' });
  const tmpl = spawnSync(
    'helm',
    ['template', 'settler-packaging-smoke', chartDir, '--set', 'secrets.DATABASE_URL=postgresql://user:pass@db:5432/app'],
    { encoding: 'utf8', stdio: 'pipe' }
  );

  if (lint.status !== 0 || tmpl.status !== 0) {
    verdict = {
      script: 'verify-helm-packaging',
      verdict: 'failed',
      summary: 'Helm lint or template failed.',
      chartDir,
      lint: { code: lint.status, stderr: lint.stderr?.slice(0, 2000) },
      template: { code: tmpl.status, stderr: tmpl.stderr?.slice(0, 2000) },
    };
    exitCode = 1;
  } else {
    verdict = {
      script: 'verify-helm-packaging',
      verdict: 'verified_pass',
      summary:
        'Helm chart lint and template render succeeded. This verifies packaging only — not production cluster health, ingress, or image pull secrets.',
      chartDir,
    };
  }
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

console.log('Helm packaging verification (no cluster runtime proof)');
console.log(`verdict=${verdict.verdict}`);
console.log(verdict.summary);
console.log(JSON.stringify(verdict));

process.exit(exitCode);
