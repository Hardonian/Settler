#!/usr/bin/env node
import { spawnSync } from 'child_process';

const [, , commandName, ...args] = process.argv;

const commandMap = {
  'demo:settler': {
    description: 'Deterministic Settler demo pipeline.',
    cmd: 'tsx',
    args: ['scripts/settler-demo-pipeline.ts'],
  },
  'simulate:settler': {
    description: 'Simulation harness for reconciliation/operator scenarios.',
    cmd: 'tsx',
    args: ['scripts/simulate-settler.ts'],
  },
  'replay:run': {
    description: 'Replay runner for deterministic run investigations.',
    cmd: 'pnpm',
    args: ['--filter', '@settler/cli', 'exec', 'tsx', 'src/tools/replay-runner.ts'],
  },
  'tenant:create': {
    description: 'Tenant bootstrap utility for local/operator workflows.',
    cmd: 'tsx',
    args: ['scripts/tenant-create.ts'],
  },
  'chaos:test': {
    description: 'Chaos/failure harness for resilience validation.',
    cmd: 'tsx',
    args: ['scripts/chaos-test.ts'],
  },
};

const spec = commandMap[commandName];
if (!spec) {
  console.error(`Unknown surface command: ${commandName}`);
  process.exit(1);
}

if (args.includes('--help')) {
  console.log(`${commandName}: ${spec.description}`);
  console.log('Usage:');
  console.log(`  pnpm run ${commandName}`);
  console.log(`  pnpm run ${commandName} -- --dry-run`);
  console.log(`  pnpm run ${commandName} -- --help`);
  process.exit(0);
}

if (args.includes('--dry-run') || process.env.SETTLER_SURFACE_SMOKE === '1') {
  console.log(`[dry-run] ${spec.cmd} ${spec.args.join(' ')}`);
  process.exit(0);
}

const passthrough = args.filter((arg) => arg !== '--dry-run');
const result = spawnSync(spec.cmd, [...spec.args, ...passthrough], { stdio: 'inherit' });
process.exit(result.status ?? 1);
