#!/usr/bin/env tsx
/**
 * Production Readiness Check
 * 
 * Comprehensive check to ensure the application is ready for production.
 * 
 * Usage: tsx scripts/check-production-readiness.ts
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const checks: CheckResult[] = [];

/**
 * Check if environment variables are documented
 */
function checkEnvVars(): CheckResult {
  const envExample = existsSync(join(process.cwd(), '.env.example'));
  const envDocs = existsSync(join(process.cwd(), 'docs', 'environment-variables.md'));
  
  if (!envExample && !envDocs) {
    return {
      name: 'Environment Variables Documentation',
      status: 'warning',
      message: 'No .env.example or environment variables documentation found',
    };
  }
  
  return {
    name: 'Environment Variables Documentation',
    status: 'pass',
    message: 'Environment variables are documented',
  };
}

/**
 * Check if health endpoints exist
 */
function checkHealthEndpoints(): CheckResult {
  const healthRoute = existsSync(join(process.cwd(), 'packages/web/src/app/api/health/route.ts'));
  const consoleHealthRoute = existsSync(join(process.cwd(), 'packages/web/src/app/api/health/console/route.ts'));
  
  if (!healthRoute || !consoleHealthRoute) {
    return {
      name: 'Health Endpoints',
      status: 'fail',
      message: 'Health endpoints are missing',
    };
  }
  
  return {
    name: 'Health Endpoints',
    status: 'pass',
    message: 'Health endpoints are configured',
  };
}

/**
 * Check if legal pages exist
 */
function checkLegalPages(): CheckResult {
  const legalPages = [
    'packages/web/src/app/legal/terms/page.tsx',
    'packages/web/src/app/legal/privacy/page.tsx',
    'packages/web/src/app/legal/cookies/page.tsx',
    'packages/web/src/app/legal/aup/page.tsx',
  ];
  
  const missing = legalPages.filter(page => !existsSync(join(process.cwd(), page)));
  
  if (missing.length > 0) {
    return {
      name: 'Legal Pages',
      status: 'fail',
      message: `Missing legal pages: ${missing.join(', ')}`,
    };
  }
  
  return {
    name: 'Legal Pages',
    status: 'pass',
    message: 'All legal pages are present',
  };
}

/**
 * Check if cookie consent is implemented
 */
function checkCookieConsent(): CheckResult {
  const consentComponent = existsSync(join(process.cwd(), 'packages/web/src/components/consent/CookieConsent.tsx'));
  
  if (!consentComponent) {
    return {
      name: 'Cookie Consent',
      status: 'fail',
      message: 'Cookie consent component is missing',
    };
  }
  
  return {
    name: 'Cookie Consent',
    status: 'pass',
    message: 'Cookie consent is implemented',
  };
}

/**
 * Check if error handling is in place
 */
function checkErrorHandling(): CheckResult {
  const errorHandler = existsSync(join(process.cwd(), 'packages/web/src/lib/api/error-handler.ts'));
  
  if (!errorHandler) {
    return {
      name: 'Error Handling',
      status: 'warning',
      message: 'Unified error handler not found',
    };
  }
  
  return {
    name: 'Error Handling',
    status: 'pass',
    message: 'Error handling is configured',
  };
}

/**
 * Check if tests exist
 */
function checkTests(): CheckResult {
  const smokeTests = existsSync(join(process.cwd(), 'tests/e2e/console-smoke.spec.ts'));
  
  if (!smokeTests) {
    return {
      name: 'Smoke Tests',
      status: 'warning',
      message: 'Smoke tests not found',
    };
  }
  
  return {
    name: 'Smoke Tests',
    status: 'pass',
    message: 'Smoke tests are configured',
  };
}

/**
 * Check if runbook exists
 */
function checkRunbook(): CheckResult {
  const runbook = existsSync(join(process.cwd(), 'docs/runbook/production-deployment.md'));
  
  if (!runbook) {
    return {
      name: 'Deployment Runbook',
      status: 'warning',
      message: 'Deployment runbook not found',
    };
  }
  
  return {
    name: 'Deployment Runbook',
    status: 'pass',
    message: 'Deployment runbook exists',
  };
}

/**
 * Check workspace integrity
 */
function checkWorkspaceIntegrity(): CheckResult {
  // This is a simplified check - full check runs via npm run check:workspace
  const workspaceCheckScript = existsSync(join(process.cwd(), 'scripts/check-workspace-integrity.ts'));
  
  if (!workspaceCheckScript) {
    return {
      name: 'Workspace Integrity Script',
      status: 'fail',
      message: 'Workspace integrity check script not found',
    };
  }
  
  return {
    name: 'Workspace Integrity Script',
    status: 'pass',
    message: 'Workspace integrity check script exists (run npm run check:workspace for full check)',
  };
}

/**
 * Run all checks
 */
async function runChecks(): Promise<void> {
  console.log('🔍 Running production readiness checks...\n');

  checks.push(checkEnvVars());
  checks.push(checkHealthEndpoints());
  checks.push(checkLegalPages());
  checks.push(checkCookieConsent());
  checks.push(checkErrorHandling());
  checks.push(checkTests());
  checks.push(checkRunbook());
  checks.push(checkWorkspaceIntegrity());

  // Print results
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning').length;

  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.message}`);
  });

  console.log(`\n📊 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`);

  if (failed > 0) {
    console.error('\n❌ Production readiness check failed');
    process.exit(1);
  }

  if (warnings > 0) {
    console.warn('\n⚠️  Production readiness check passed with warnings');
    process.exit(0);
  }

  console.log('\n✅ Production readiness check passed');
  process.exit(0);
}

runChecks().catch((error) => {
  console.error('Fatal error during production readiness check:', error);
  process.exit(1);
});
