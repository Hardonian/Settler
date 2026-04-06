#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const tracingFile = path.join(root, 'packages/api/src/infrastructure/observability/tracing.ts');
const auditRoute = path.join(root, 'packages/api/src/routes/v1/audit-trail.ts');

const tracingSource = fs.readFileSync(tracingFile, 'utf8');
const auditSource = fs.readFileSync(auditRoute, 'utf8');

const checks = [
  {
    label: 'OTEL endpoint gate present',
    ok: tracingSource.includes('OTLP_ENDPOINT not set, tracing disabled'),
  },
  {
    label: 'Optional OTEL dependency fallback present',
    ok: tracingSource.includes('OpenTelemetry packages not installed, tracing disabled'),
  },
  {
    label: 'Tenant context usage in audit route',
    ok: auditSource.includes('req.tenantId!'),
  },
];

let failed = false;
for (const check of checks) {
  if (check.ok) {
    console.log(`✅ ${check.label}`);
  } else {
    console.error(`❌ ${check.label}`);
    failed = true;
  }
}

if (failed) process.exit(1);
