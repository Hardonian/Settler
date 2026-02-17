import { expect, test } from '@playwright/test';

test('security headers are present on marketing route', async ({ request }) => {
  const response = await request.get('/');

  expect(response.status()).toBeLessThan(500);
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(response.headers()['permissions-policy']).toContain('camera=()');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect(response.headers()['content-security-policy-report-only']).toContain("default-src 'self'");
});
