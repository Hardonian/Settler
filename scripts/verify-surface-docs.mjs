#!/usr/bin/env node
import { spawnSync } from 'child_process';

const before = spawnSync('git', ['status', '--short', 'docs/reference/surface-area-convergence.md'], { encoding: 'utf8' }).stdout;
const gen = spawnSync('node', ['scripts/generate-surface-docs.mjs'], { stdio: 'inherit' });
if (gen.status !== 0) process.exit(gen.status ?? 1);
const after = spawnSync('git', ['status', '--short', 'docs/reference/surface-area-convergence.md'], { encoding: 'utf8' }).stdout;
if (after.trim() !== before.trim()) {
  console.error('Surface convergence doc drift detected. Run: node scripts/generate-surface-docs.mjs');
  process.exit(1);
}
console.log('surface docs in sync');
