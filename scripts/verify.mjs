#!/usr/bin/env node

import { spawnSync } from 'child_process';

const rootDir = process.cwd();
const checks = [
  ['Conflict markers', ['run', 'verify:conflict-markers']],
  ['Lint', ['run', 'lint']],
  ['Typecheck', ['run', 'typecheck']],
  ['Unit/integration tests', ['run', 'test']],
  ['Build', ['run', 'build']],
  ['M1 smoke', ['run', 'smoke:m1']],
  ['Boundary linter', ['run', 'lint:boundaries']],
  ['Audit (high/critical threshold)', ['audit', '--audit-level=high', '--prod']],
];

const args = new Set(process.argv.slice(2));
if (args.has('--skip-audit')) {
  checks.pop();
}

const failures = [];

for (const [name, pnpmArgs] of checks) {
  console.log(`\n▶ ${name}`);
  const result = spawnSync('pnpm', pnpmArgs, {
    cwd: rootDir,
    stdio: 'pipe',
    encoding: 'utf-8',
    env: process.env,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const auditNetworkFailure =
    name.startsWith('Audit') &&
    (combined.includes('ERR_PNPM_AUDIT_BAD_RESPONSE') ||
      combined.includes('ERR_PNPM_FETCH') ||
      combined.includes('Forbidden'));

  if (auditNetworkFailure && process.env.CI_STRICT_AUDIT !== '1') {
    console.warn('⚠️  Audit endpoint unavailable; treating as warning (set CI_STRICT_AUDIT=1 to fail).');
    continue;
  }

  if (result.status !== 0) failures.push(name);
}

if (failures.length > 0) {
  console.error(`\n❌ verify failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log('\n✅ verify passed: lint + typecheck + test + build + smoke:m1 + boundary linter');
