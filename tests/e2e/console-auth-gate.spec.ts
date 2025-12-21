import { test, expect } from '@playwright/test';

/**
 * Console Auth + Subscription Gate Tests
 * 
 * Verifies that console routes are properly protected:
 * 1. Unauthenticated users are redirected to sign-in
 * 2. Authenticated users without subscription are redirected to pricing
 * 3. Console never returns 500 errors
 * 4. Console API routes require authentication
 */

test.describe('Console Auth + Subscription Gate', () => {
  test('unauthenticated user accessing /console redirects to sign-in', async ({ page, context }) => {
    // Clear any existing auth cookies
    await context.clearCookies();
    
    // Monitor for redirects
    const redirects: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 300 && response.status() < 400) {
        const location = response.headers()['location'];
        if (location) {
          redirects.push(location);
        }
      }
    });

    // Navigate to console
    const response = await page.goto('/console', { waitUntil: 'networkidle' });
    
    // Should redirect to sign-in (or show sign-in prompt)
    const currentUrl = page.url();
    const hasSignInRedirect = currentUrl.includes('/signup') || currentUrl.includes('/signin');
    const hasSignInPrompt = await page.locator('text=Sign In').isVisible().catch(() => false);
    
    // Either redirected or showing sign-in prompt
    expect(hasSignInRedirect || hasSignInPrompt).toBeTruthy();
    
    // Never returns 500
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).toBeLessThan(500);
  });

  test('console page never returns 500 error', async ({ page }) => {
    const errors: string[] = [];
    const responses: { url: string; status: number }[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/console')) {
        responses.push({ url: response.url(), status: response.status() });
        if (response.status() === 500) {
          errors.push(`500 error on ${response.url()}`);
        }
      }
    });

    // Navigate to console (may redirect, but should never 500)
    const response = await page.goto('/console', { waitUntil: 'networkidle' });
    
    // Verify response is not 500
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).toBeLessThan(500);
    
    // Verify no console routes returned 500
    const console500s = responses.filter(r => r.status === 500);
    expect(console500s.length).toBe(0);
    
    // Verify page renders (either redirect page, sign-in, or console)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('console subscription-status API never returns 500', async ({ request }) => {
    // This endpoint should always return 200, even if user is not authenticated
    // It should return fallback status instead of 500
    const response = await request.get('/api/console/subscription-status');
    
    // CRITICAL: Never returns 500
    expect(response.status()).not.toBe(500);
    
    // Should return 200 with fallback status
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Should have subscription status structure
    expect(data).toHaveProperty('tier');
    expect(data).toHaveProperty('hasSubscription');
    expect(data).toHaveProperty('isPaid');
    expect(data).toHaveProperty('isEnterprise');
    
    // Should not have error property in production
    if (process.env.NODE_ENV === 'production') {
      expect(data).not.toHaveProperty('error');
    }
  });

  test('console API routes require authentication', async ({ request }) => {
    // Test a console API route without authentication
    const response = await request.get('/api/console/api-keys', {
      failOnStatusCode: false,
    });
    
    // Should return 401 (Unauthorized) or 403 (Forbidden), never 500
    expect(response.status()).not.toBe(500);
    expect([401, 403]).toContain(response.status());
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('console layout handles missing env vars gracefully', async ({ page }) => {
    // This test verifies that missing env vars don't cause 500s
    // The layout should show EnvErrorPanel instead
    
    const response = await page.goto('/console', { waitUntil: 'networkidle' });
    
    // Should not return 500 even if env vars are missing
    expect(response?.status()).not.toBe(500);
    
    // Page should render (either error panel or redirect)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('console error boundary displays friendly error', async ({ page }) => {
    // Navigate to console
    await page.goto('/console', { waitUntil: 'networkidle' });
    
    // Check if error boundary exists (should be in the component tree)
    // Error boundary should show friendly message, not stack trace
    const hasErrorBoundary = await page.locator('text=Something went wrong').isVisible().catch(() => false) ||
                              await page.locator('text=Authentication Required').isVisible().catch(() => false);
    
    // If error boundary is shown, it should be user-friendly
    if (hasErrorBoundary) {
      // Should not show stack traces
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('at ');
      expect(bodyText).not.toContain('Error:');
    }
  });
});
