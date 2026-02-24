#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredRoutes = [
  'packages/web/src/app/platform/page.tsx',
  'packages/web/src/app/pricing/page.tsx',
  'packages/web/src/app/security/page.tsx',
  'packages/web/src/app/docs/page.tsx',
  'packages/web/src/app/about/page.tsx',
  'packages/web/src/app/contact/page.tsx',
  'packages/web/src/app/privacy/page.tsx',
  'packages/web/src/app/terms/page.tsx',
  'packages/web/src/app/login/page.tsx',
  'packages/web/src/app/signup/page.tsx',
  'packages/web/src/app/app/layout.tsx',
  'packages/web/src/app/app/page.tsx',
  'packages/web/src/lib/routing/route-groups.ts',
];

for (const file of requiredRoutes) {
  if (!existsSync(resolve(process.cwd(), file))) {
    console.error(`❌ Route boundary smoke check failed: missing ${file}`);
    process.exit(1);
  }
}

const routeGatingSource = readFileSync(resolve(process.cwd(), 'packages/web/src/lib/auth/route-gating.ts'), 'utf-8');
if (!routeGatingSource.includes('export const APP_AUTH_PREFIXES = APP_ROUTE_PREFIXES;')) {
  console.error('❌ Route boundary smoke check failed: APP auth prefixes are not derived from route-group architecture.');
  process.exit(1);
}

const middlewareSource = readFileSync(resolve(process.cwd(), 'packages/web/middleware.ts'), 'utf-8');
if (!middlewareSource.includes('isAppAuthRequiredRoute(pathname)')) {
  console.error('❌ Route boundary smoke check failed: middleware is not using app-only route gating helper.');
  process.exit(1);
}

console.log('✅ Route boundary smoke check passed.');
