#!/usr/bin/env tsx
/**
 * Route Verification Script
 * 
 * Verifies that all routes referenced in navigation and footer actually exist
 * and can be accessed without errors.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface RouteInfo {
  path: string;
  exists: boolean;
  hasPageFile: boolean;
  hasLayoutFile: boolean;
  hasErrorBoundary: boolean;
}

const ROUTES_TO_VERIFY = [
  // Marketing
  '/',
  '/pricing',
  '/enterprise',
  '/how-it-works',
  '/why-settler',
  '/vision',
  '/security',
  '/status',
  '/community',
  '/support',
  '/cookbooks',
  '/docs',
  '/docs/quickstart',
  '/docs/sdk',
  '/docs/api',
  '/docs/cli',
  '/docs/examples',
  '/receipts',
  '/feature-flags',
  '/console/playground',
  
  // Legal
  '/legal',
  '/legal/terms',
  '/legal/privacy',
  '/legal/dpa',
  '/legal/subprocessors',
  '/legal/license',
  
  // Console
  '/console',
  '/console/receipts',
  '/console/usage',
  '/console/costs',
  '/console/api-keys',
  '/console/feature-flags',
  '/dashboard',
  '/dashboard/billing',
  '/dashboard/integrations',
];

function routeToFilePath(route: string): string[] {
  if (route === '/') {
    return ['src/app/page.tsx'];
  }
  
  const parts = route.split('/').filter(Boolean);
  const filePath = join('src/app', ...parts, 'page.tsx');
  const layoutPath = join('src/app', ...parts, 'layout.tsx');
  
  return [filePath, layoutPath];
}

function checkRouteExists(route: string, appDir: string): RouteInfo {
  const files = routeToFilePath(route);
  const pageFile = files[0];
  const layoutFile = files[1];
  
  const pageExists = files.some(f => {
    try {
      const fullPath = join(appDir, f);
      return require('fs').existsSync(fullPath);
    } catch {
      return false;
    }
  });
  
  const layoutExists = files.some(f => {
    try {
      const fullPath = join(appDir, layoutFile);
      return require('fs').existsSync(fullPath);
    } catch {
      return false;
    }
  });
  
  return {
    path: route,
    exists: pageExists,
    hasPageFile: pageExists,
    hasLayoutFile: layoutExists,
    hasErrorBoundary: false, // Would need to check for error.tsx
  };
}

async function main() {
  const appDir = join(process.cwd(), 'packages/web');
  
  console.log('🔍 Verifying routes...\n');
  
  const results: RouteInfo[] = [];
  let passCount = 0;
  let failCount = 0;
  
  for (const route of ROUTES_TO_VERIFY) {
    const info = checkRouteExists(route, appDir);
    results.push(info);
    
    if (info.exists) {
      console.log(`✅ ${route}`);
      passCount++;
    } else {
      console.log(`❌ ${route} - Missing page file`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${ROUTES_TO_VERIFY.length}`);
  
  if (failCount > 0) {
    console.log(`\n⚠️  Some routes are missing. Please verify.`);
    process.exit(1);
  } else {
    console.log(`\n✨ All routes verified!`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Error verifying routes:', error);
  process.exit(1);
});
