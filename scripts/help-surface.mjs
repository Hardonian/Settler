#!/usr/bin/env node
import fs from 'fs';

const registry = JSON.parse(fs.readFileSync('docs/reference/capability-surface.registry.json', 'utf8'));

console.log('Settler Surface Help\n');
console.log('Canonical workflows:');
for (const cmd of registry.canonicalCommands) console.log(`  - ${cmd}`);
console.log('\nCapabilities:');
for (const c of registry.capabilities) {
  console.log(`\n• ${c.name} [${c.maturity}]`);
  console.log(`  CLI: ${c.cli.join(' | ')}`);
  console.log(`  UI: ${c.ui.join(' | ')}`);
  console.log(`  API: ${c.api.join(' | ')}`);
  console.log(`  Visibility: ${c.visibility}`);
  console.log(`  Gating: ${c.gating}`);
}
