#!/usr/bin/env node
import { spawnSync } from 'child_process';

const beforeIndex = spawnSync('git', ['status', '--short', 'docs/api/route-families.md'], { encoding: 'utf8' }).stdout;
const beforeFamilies = spawnSync('git', ['status', '--short', 'docs/api/families'], { encoding: 'utf8' }).stdout;
const gen = spawnSync('node', ['scripts/generate-api-family-docs.mjs'], { stdio: 'inherit' });
if (gen.status !== 0) process.exit(gen.status ?? 1);
const afterIndex = spawnSync('git', ['status', '--short', 'docs/api/route-families.md'], { encoding: 'utf8' }).stdout;
const afterFamilies = spawnSync('git', ['status', '--short', 'docs/api/families'], { encoding: 'utf8' }).stdout;
if (beforeIndex.trim() !== afterIndex.trim() || beforeFamilies.trim() !== afterFamilies.trim()) {
  console.error('API family docs drift detected. Run: node scripts/generate-api-family-docs.mjs');
  process.exit(1);
}
console.log('api family docs in sync');
