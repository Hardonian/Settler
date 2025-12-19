/**
 * Smoke Test Script
 * 
 * Tests critical routes to ensure no 500 errors.
 * Run this after deployment to verify basic functionality.
 */

import { safeFetch } from '../packages/web/src/lib/safe-helpers';

interface TestResult {
  name: string;
  passed: boolean;
  status?: number;
  error?: string;
}

const results: TestResult[] = [];
const baseUrl = process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testRoute(name: string, path: string, expectedStatus = 200) {
  const url = `${baseUrl}${path}`;
  const result = await safeFetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/json',
    },
  });

  if (!result.success || !result.data) {
    results.push({
      name,
      passed: false,
      error: result.error || 'Request failed',
    });
    return false;
  }

  const status = result.data.status;
  const passed = status === expectedStatus || (expectedStatus === 200 && status < 400);

  results.push({
    name,
    passed,
    status,
    error: passed ? undefined : `Expected ${expectedStatus}, got ${status}`,
  });

  return passed;
}

async function testApiRoute(name: string, path: string, expectedStatus = 200) {
  const url = `${baseUrl}${path}`;
  const result = await safeFetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!result.success || !result.data) {
    results.push({
      name,
      passed: false,
      error: result.error || 'Request failed',
    });
    return false;
  }

  const status = result.data.status;
  const passed = status === expectedStatus || (expectedStatus === 200 && status < 400);

  results.push({
    name,
    passed,
    status,
    error: passed ? undefined : `Expected ${expectedStatus}, got ${status}`,
  });

  return passed;
}

async function main() {
  console.log(`🧪 Running smoke tests against ${baseUrl}\n`);

  // Test public pages (should return 200)
  await testRoute('Landing Page', '/');
  await testRoute('Pricing Page', '/pricing');
  await testRoute('Docs Page', '/docs');
  await testRoute('Status Page', '/status');

  // Test API routes (should return 200 or 401/403 if auth required)
  await testApiRoute('Health Check', '/api/status/health');
  await testApiRoute('Status API', '/api/status');

  // Test Console health check endpoint
  await testApiRoute('Console Health Check', '/api/health/console', 200); // Should always return 200

  // Test protected routes (should return 200 with auth prompt, NOT 500)
  // Console should gracefully handle unauthenticated access
  const consoleResult = await testRoute('Console (unauthenticated)', '/console', 200); // Should return 200, not 500
  if (!consoleResult) {
    console.error('⚠️  Console route returned error - this should never 500!');
  }
  
  await testRoute('Dashboard (protected)', '/dashboard', 401); // May redirect or 401

  // Test 404 page
  await testRoute('404 Page', '/this-page-does-not-exist', 404);

  // Summary
  console.log('\n📊 Test Results:');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    const statusText = result.status ? ` (${result.status})` : '';
    const errorText = result.error ? ` - ${result.error}` : '';
    console.log(`${icon} ${result.name}${statusText}${errorText}`);
  });

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total: ${results.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some smoke tests failed. Review the results above.');
    process.exit(1);
  } else {
    console.log('\n✅ All smoke tests passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Smoke test script error:', error);
  process.exit(1);
});
