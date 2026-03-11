#!/usr/bin/env node
import { spawnSync } from 'child_process';
const before = spawnSync('git', ['status', '--short', 'docs/api/route-classes.md'], { encoding: 'utf8' }).stdout;
const gen = spawnSync('node', ['scripts/generate-route-classes-doc.mjs'], { stdio: 'inherit' });
if (gen.status !== 0) process.exit(gen.status ?? 1);
const after = spawnSync('git', ['status', '--short', 'docs/api/route-classes.md'], { encoding: 'utf8' }).stdout;
if (after.trim() !== before.trim()) {
  console.error('API route class doc drift detected. Run: node scripts/generate-route-classes-doc.mjs');
  process.exit(1);
}
console.log('route class docs in sync');
