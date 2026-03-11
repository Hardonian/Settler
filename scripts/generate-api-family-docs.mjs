#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const inv = JSON.parse(fs.readFileSync('docs/api/route-inventory.json', 'utf8'));
const outDir = 'docs/api/families';
fs.mkdirSync(outDir, { recursive: true });

const groups = new Map();
for (const r of inv.routes) {
  const g = r.routeGroup || 'ungrouped';
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push(r);
}

const index = [];
index.push('# API Route Families (Generated)', '');
index.push('Generated from `docs/api/route-inventory.json`.', '');
index.push('| Family | Routes | Critical | Auth required | Tenant scoped | Doc |');
index.push('| --- | ---: | ---: | ---: | ---: | --- |');

for (const [group, routes] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const slug = group.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const file = `${slug}.md`;
  const critical = routes.filter((r) => r.criticality === 'critical').length;
  const auth = routes.filter((r) => r.authRequired).length;
  const tenant = routes.filter((r) => r.tenantScoped).length;

  index.push(`| ${group} | ${routes.length} | ${critical}/${routes.length} | ${auth}/${routes.length} | ${tenant}/${routes.length} | [${file}](./families/${file}) |`);

  const lines = [];
  lines.push(`# API Family: ${group}`, '');
  lines.push(`Generated from route inventory. Routes: **${routes.length}**.`, '');
  lines.push('| Method | Path | Criticality | Auth | Tenant | Test | Source |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const r of routes) {
    lines.push(`| ${r.method} | \`${r.path}\` | ${r.criticality} | ${r.authRequired ? 'yes' : 'no'} | ${r.tenantScoped ? 'yes' : 'no'} | ${r.testStatus} | \`${r.source}\` |`);
  }
  fs.writeFileSync(path.join(outDir, file), lines.join('\n'));
}

fs.writeFileSync('docs/api/route-families.md', index.join('\n'));
console.log('wrote docs/api/route-families.md and family docs');
