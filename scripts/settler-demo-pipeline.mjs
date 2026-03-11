#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const outDir = path.resolve('examples/demo-output');
const fixtureDir = path.resolve('examples/demo-output-fixtures/demo-run-1');
const artifactsPath = path.join(outDir, 'operator-demo-artifacts.json');
const datasetPath = path.resolve('examples/demo-data/dataset.json');

const seededDataset = {
  stripe: [
    { id: 'st_1', invoice_number: 'INV-100', amount: 101.0 },
    { id: 'st_2', invoice_number: 'INV-101', amount: 205.75 },
    { id: 'st_3', invoice_number: 'INV-102', amount: 310.25 },
  ],
  quickbooks: [
    { id: 'qb_1', invoice_number: 'INV-100', amount: 101.01 },
    { id: 'qb_2', invoice_number: 'INV-101', amount: 205.7 },
    { id: 'qb_3', invoice_number: 'INV-102', amount: 299.0 },
  ],
};

const tryCommand = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  return result.status === 0;
};

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

console.log('\n▶ Settler operator demo pipeline\n');
console.log('1) load sample dataset');
await fs.mkdir(path.dirname(datasetPath), { recursive: true });
await fs.writeFile(datasetPath, JSON.stringify(seededDataset, null, 2));

console.log('2) execute reconciliation');
await fs.mkdir(outDir, { recursive: true });
let executionMode = 'runtime';
let degradedReason = null;

const demoRan = tryCommand('pnpm', ['run', 'demo']);
if (!demoRan) {
  executionMode = 'fixture-fallback';
  degradedReason = 'pnpm run demo unavailable in current environment; copied deterministic fixture artifacts';
  for (const file of ['run.json', 'results.json', 'evidence.json']) {
    await fs.copyFile(path.join(fixtureDir, file), path.join(outDir, file));
  }
}

const runEnvelope = await readJson(path.join(outDir, 'run.json'));
const results = await readJson(path.join(outDir, 'results.json'));
const output = results.output ?? {};
const matched = Number(output.matches ?? 0);
const mismatches = Number(output.mismatches ?? 0);
const reviewQueue = Number(output.reviewQueue ?? 0);
const total = matched + mismatches + reviewQueue;
const matchRate = total > 0 ? (matched / total) * 100 : 0;

console.log('3) generate runtime events');
const alerts = [
  {
    id: 'match-rate-drop',
    severity: 'warning',
    type: 'match_rate_drop',
    message: `Synthetic anomaly: match rate dropped to ${Math.min(matchRate, 94.5).toFixed(2)}%.`,
    triggeredAt: new Date().toISOString(),
  },
  {
    id: 'api-error-spike',
    severity: 'critical',
    type: 'api_error_spike',
    message: 'Synthetic API error spike triggered for operator demo.',
    triggeredAt: new Date().toISOString(),
  },
];

console.log('4) produce alerts');
alerts.forEach((alert) => console.log(`   [${alert.severity.toUpperCase()}] ${alert.type} :: ${alert.message}`));

console.log('5) allow run inspection');
console.log(`   runId: ${String(runEnvelope.runId ?? 'demo-run-1')}`);
console.log(`   recordsProcessed: ${total}`);
console.log(`   matchRate: ${matchRate.toFixed(2)}%`);

console.log('6) allow replay');
const replayRan = tryCommand('pnpm', ['exec', 'tsx', 'scripts/settler-replay.ts', 'examples/demo-output/evidence.json']);
if (!replayRan) {
  executionMode = 'fixture-fallback';
  degradedReason = degradedReason ?? 'tsx replay unavailable in current environment; using fixture replay evidence';
  console.log('   replayStatus: degraded-fixture-evidence');
} else {
  console.log('   replayStatus: verified');
}

console.log('7) show policy simulation');
const policySimulation = {
  policy: 'review-queue-cap',
  threshold: 2,
  observedReviewQueue: reviewQueue,
  verdict: reviewQueue > 2 ? 'escalate' : 'pass',
};
console.log(`   policy=${policySimulation.policy} verdict=${policySimulation.verdict}`);

await fs.writeFile(
  artifactsPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      executionMode,
      degradedReason,
      run: { runId: String(runEnvelope.runId ?? 'demo-run-1'), recordsProcessed: total, matchRate },
      alerts,
      policySimulation,
    },
    null,
    2
  )
);

console.log('\nGuided next steps:');
console.log('Open Run Explorer');
console.log('Inspect reconciliation results');
console.log('Replay run');
console.log('Trigger policy simulation');
console.log(`\n✅ Demo artifacts saved: ${artifactsPath}`);
