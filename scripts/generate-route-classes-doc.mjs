#!/usr/bin/env node
import fs from 'fs';

const inv = JSON.parse(fs.readFileSync('docs/api/route-inventory.json', 'utf8'));
const groups = new Map();
for (const r of inv.routes) {
  const k = r.routeGroup || 'ungrouped';
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(r);
}

function classifyBadges(route) {
  const badges = [];
  badges.push(route.authRequired ? 'auth' : 'public');
  badges.push(route.tenantScoped ? 'tenant' : 'global');
  badges.push(route.criticality || 'unknown');
  return badges.map((b) => `\`${b}\``).join(' ');
}

const lines = [];
lines.push('# API Route Classes (Auth + Tenant Taxonomy)', '');
lines.push('Generated from `docs/api/route-inventory.json`.', '');
lines.push('| Route group | Routes | Auth required | Tenant scoped | Critical routes | Example paths with badges |');
lines.push('| --- | ---: | ---: | ---: | ---: | --- |');
for (const [g, routes] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const authCount = routes.filter((r) => r.authRequired).length;
  const tenantCount = routes.filter((r) => r.tenantScoped).length;
  const criticalCount = routes.filter((r) => r.criticality === 'critical').length;
  const examples = routes
    .slice(0, 3)
    .map((r) => `${classifyBadges(r)} \`${r.path}\``)
    .join('<br/>');
  lines.push(
    `| ${g} | ${routes.length} | ${authCount}/${routes.length} | ${tenantCount}/${routes.length} | ${criticalCount}/${routes.length} | ${examples} |`
  );
}
lines.push('', '## Route access classes', '');
lines.push('- **Public:** `authRequired=false` and `tenantScoped=false`.');
lines.push('- **Authenticated global/operator:** `authRequired=true` and `tenantScoped=false`.');
lines.push('- **Tenant-scoped:** `tenantScoped=true` (auth required unless explicitly documented otherwise).');
lines.push('- **Criticality badge:** derived from route inventory (`critical`, `medium`, etc.) for endpoint risk triage.');

fs.writeFileSync('docs/api/route-classes.md', lines.join('\n'));
console.log('wrote docs/api/route-classes.md');
