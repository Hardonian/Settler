#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const registryPath = path.join(root, 'docs/reference/capability-surface.registry.json');
const outPath = path.join(root, 'docs/reference/surface-area-convergence.md');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const lines = [];
lines.push('# Surface Area Convergence Matrix (CLI / UI / API / Capability Status)', '');
lines.push('Generated from `docs/reference/capability-surface.registry.json`. Edit the registry and regenerate docs.', '');
lines.push('## Capability Surface Matrix', '');
lines.push('| Capability | Real implementation evidence | CLI surface | UI surface | API surface | Docs surface | OSS vs Enterprise visibility | Availability / gating truth | Maturity |');
lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const c of registry.capabilities) {
  lines.push(`| ${c.name} | ${c.evidence.join('<br/>')} | ${c.cli.join('<br/>')} | ${c.ui.join('<br/>')} | ${c.api.join('<br/>')} | ${c.docs.join('<br/>')} | ${c.visibility} | ${c.gating} | ${c.maturity} |`);
}
lines.push('', '## Canonical CLI Workflows (OSS-first)', '');
for (const cmd of registry.canonicalCommands) lines.push(`- \`${cmd}\``);
lines.push('', '## Cross-Surface Workflows', '');
for (const w of registry.workflows) {
  lines.push(`### ${w.name}`);
  for (const step of w.steps) lines.push(`- ${step}`);
  lines.push('');
}
lines.push('## Terminology Normalization (canonical terms)', '');
for (const t of registry.terminology) lines.push(`- **${t}**`);
lines.push('');

fs.writeFileSync(outPath, `${lines.join('\n')}`);
console.log(`wrote ${path.relative(root, outPath)}`);
