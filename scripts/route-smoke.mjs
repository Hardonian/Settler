#!/usr/bin/env node
/**
 * Minimal unauthenticated route smoke test for local prod builds.
 */

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const publicRoutes = [
  '/',
  '/pricing',
  '/support',
  '/support/contact',
  '/docs',
  '/docs/examples',
  '/docs/integrations',
  '/security',
  '/legal/privacy',
  '/legal/terms',
  '/status',
  '/roadmap',
  '/changelog',
  '/integrations/request',
  '/playground',
  '/demo',
];

const protectedRoutes = [
  '/console',
  '/console/billing',
  '/admin',
  '/dashboard',
  '/investor/reality',
];

const results = [];

async function checkRoute(path, expected) {
  const url = new URL(path, baseUrl).toString();
  const res = await fetch(url, { redirect: 'manual' });
  const status = res.status;
  const location = res.headers.get('location');
  results.push({ path, status, location, expected });
}

async function run() {
  for (const path of publicRoutes) {
    await checkRoute(path, 'public');
  }
  for (const path of protectedRoutes) {
    await checkRoute(path, 'auth');
  }

  let failed = false;
  for (const result of results) {
    if (result.expected === 'public' && result.status !== 200) {
      failed = true;
      console.error(`❌ ${result.path} expected 200, got ${result.status}`);
      continue;
    }
    if (result.expected === 'auth' && ![301, 302, 307, 308].includes(result.status)) {
      failed = true;
      console.error(`❌ ${result.path} expected redirect, got ${result.status}`);
      continue;
    }
    console.log(`✅ ${result.path} ${result.status}${result.location ? ` -> ${result.location}` : ''}`);
  }

  if (failed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('Route smoke test failed:', error);
  process.exitCode = 1;
});
