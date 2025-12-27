/**
 * Verify All Routes
 * 
 * Verifies that all API routes and pages are properly configured and accessible.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const routesToVerify = [
  // API Routes
  { path: 'packages/web/src/app/api/console/api-logs/route.ts', type: 'API', method: 'GET' },
  { path: 'packages/web/src/app/api/console/tenants/route.ts', type: 'API', method: 'GET' },
  { path: 'packages/web/src/app/api/console/health/route.ts', type: 'API', method: 'GET' },
  { path: 'packages/web/src/app/api/console/subscription-status/route.ts', type: 'API', method: 'GET' },
  
  // Pages
  { path: 'packages/web/src/app/console/api-logs/page.tsx', type: 'Page' },
  { path: 'packages/web/src/app/console/admin/tenants/page.tsx', type: 'Page' },
  
  // Components
  { path: 'packages/web/src/components/console/ApiLogsViewer.tsx', type: 'Component' },
  { path: 'packages/web/src/components/console/TenantsObservabilityDashboard.tsx', type: 'Component' },
  
  // Utilities
  { path: 'packages/web/src/lib/auth/super-admin.ts', type: 'Utility' },
  { path: 'packages/web/src/lib/auth/console-gate.ts', type: 'Utility' },
  { path: 'packages/web/src/lib/privacy/pii-filter.ts', type: 'Utility' },
  { path: 'packages/web/src/domain/console/api-logs.ts', type: 'Domain' },
  { path: 'packages/web/src/middleware/api-logger.ts', type: 'Middleware' },
  { path: 'packages/web/src/lib/security/rate-limiter.ts', type: 'Utility' },
  { path: 'packages/web/src/lib/cache/api-cache.ts', type: 'Utility' },
  { path: 'packages/web/src/lib/monitoring/health-check.ts', type: 'Utility' },
  { path: 'packages/web/src/lib/monitoring/alerts.ts', type: 'Utility' },
];

function verifyRoute(route: { path: string; type: string; method?: string }) {
  const fullPath = join(process.cwd(), route.path);
  
  if (!existsSync(fullPath)) {
    return { ...route, status: 'missing', error: 'File does not exist' };
  }
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    
    // Check for common issues
    const issues: string[] = [];
    
    if (route.type === 'API' && route.method) {
      if (!content.includes(`export const ${route.method}`) && !content.includes(`export async function ${route.method}`)) {
        issues.push(`Missing ${route.method} export`);
      }
    }
    
    if (route.type === 'Component' && !content.includes('export')) {
      issues.push('Missing export');
    }
    
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push('Contains TODO/FIXME');
    }
    
    if (content.includes('any') && route.type !== 'Utility') {
      // Allow 'any' in utilities but flag in routes/components
      const anyCount = (content.match(/\bany\b/g) || []).length;
      if (anyCount > 2) {
        issues.push(`Multiple 'any' types (${anyCount})`);
      }
    }
    
    return {
      ...route,
      status: issues.length === 0 ? 'ok' : 'warning',
      issues: issues.length > 0 ? issues : undefined,
    };
  } catch (error) {
    return {
      ...route,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function verifyAllRoutes() {
  console.log('🔍 Verifying all routes and components...\n');
  
  const results = routesToVerify.map(verifyRoute);
  
  const ok = results.filter(r => r.status === 'ok');
  const warnings = results.filter(r => r.status === 'warning');
  const errors = results.filter(r => r.status === 'error' || r.status === 'missing');
  
  console.log(`✅ OK: ${ok.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}\n`);
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(r => {
      console.log(`   ${r.path}`);
      if (r.issues) {
        r.issues.forEach(issue => console.log(`      - ${issue}`));
      }
    });
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(r => {
      console.log(`   ${r.path}: ${r.error || 'Unknown error'}`);
    });
    console.log('');
  }
  
  // Group by type
  const byType = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, typeof results>);
  
  console.log('📊 Summary by type:');
  Object.entries(byType).forEach(([type, routes]) => {
    const okCount = routes.filter(r => r.status === 'ok').length;
    console.log(`   ${type}: ${okCount}/${routes.length} OK`);
  });
  
  console.log('\n' + (errors.length === 0 ? '🎉 All routes verified!' : '⚠️  Some routes need attention'));
  
  return errors.length === 0;
}

const success = verifyAllRoutes();
process.exit(success ? 0 : 1);
