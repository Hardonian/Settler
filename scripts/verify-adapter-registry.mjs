#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'marketplace/adapters/registry.json');
const examplesRoot = path.join(root, 'examples/external-integration');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
if (!Array.isArray(registry) || registry.length === 0) {
  console.error('❌ Adapter registry must contain at least one entry.');
  process.exit(1);
}

let failed = false;
for (const item of registry) {
  const name = item?.name;
  if (typeof name !== 'string' || !name.trim()) {
    console.error('❌ Adapter registry entry missing valid name.');
    failed = true;
    continue;
  }

  const exampleDir = path.join(examplesRoot, name);
  if (!fs.existsSync(exampleDir)) {
    console.error(`❌ ${name}: missing integration example directory ${path.relative(root, exampleDir)}`);
    failed = true;
    continue;
  }

  const hasReadme = fs.existsSync(path.join(exampleDir, 'README.md'));
  if (!hasReadme) {
    console.error(`❌ ${name}: missing README in ${path.relative(root, exampleDir)}`);
    failed = true;
    continue;
  }

  console.log(`✅ ${name}: registry entry and executable example present`);
}

if (failed) process.exit(1);
