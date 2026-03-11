import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const required = ['demo:settler', 'simulate:settler', 'replay:run', 'tenant:create', 'chaos:test', 'help:surface'];
const smokeable = ['demo:settler', 'simulate:settler', 'replay:run', 'tenant:create', 'chaos:test'];

for (const scriptName of required) {
  test(`script ${scriptName} is registered`, () => {
    assert.ok(pkg.scripts[scriptName], `${scriptName} missing in package scripts`);
  });
}

test('surface registry references existing command scripts', () => {
  const registry = JSON.parse(fs.readFileSync('docs/reference/capability-surface.registry.json', 'utf8'));
  for (const cmd of registry.canonicalCommands) {
    const normalized = cmd.startsWith('pnpm run ') ? cmd.replace('pnpm run ', '') : cmd.replace('pnpm ', '');
    const scriptName = normalized.split(' ')[0];
    if (scriptName.includes(':') || scriptName === 'doctor' || scriptName === 'benchmark') {
      const checkName = scriptName.includes(':') ? scriptName : null;
      if (checkName) assert.ok(pkg.scripts[checkName], `canonical command missing script: ${checkName}`);
    }
  }
});

for (const scriptName of smokeable) {
  test(`${scriptName} supports --help`, () => {
    const res = spawnSync('pnpm', ['run', scriptName, '--', '--help'], { encoding: 'utf8', timeout: 20000 });
    assert.equal(res.status, 0, `--help failed for ${scriptName}: ${res.stderr || res.stdout}`);
  });

  test(`${scriptName} supports --dry-run`, () => {
    const res = spawnSync('pnpm', ['run', scriptName, '--', '--dry-run'], { encoding: 'utf8', timeout: 20000 });
    assert.equal(res.status, 0, `--dry-run failed for ${scriptName}: ${res.stderr || res.stdout}`);
    assert.match(res.stdout, /dry-run/i, `--dry-run output missing marker for ${scriptName}`);
  });
}
