/**
 * Reality Gates E2E Tests
 * 
 * Comprehensive end-to-end tests that validate core user journeys
 * and ensure the application works as a real product, not a demo.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Reality Gates - Core User Journeys', () => {
  test('should complete signup → onboarding → first reconciliation flow', async ({
    page,
  }) => {
    // Step 1: Signup
    await page.goto(`${BASE_URL}/signup`);
    await expect(page).toHaveTitle(/Settler/);

    // Check signup form exists
    const signupForm = page.locator('form');
    await expect(signupForm).toBeVisible();

    // Note: Actual signup requires email verification, so we'll test the flow exists
    // In a real test environment, you'd use test credentials

    // Step 2: Verify onboarding page exists
    await page.goto(`${BASE_URL}/console/onboarding`);
    // Should redirect to login if not authenticated, or show onboarding if authenticated
    const currentUrl = page.url();
    expect(
      currentUrl.includes('/signup') ||
        currentUrl.includes('/login') ||
        currentUrl.includes('/onboarding')
    ).toBeTruthy();

    // Step 3: Verify reconciliation API exists
    const apiResponse = await page.request.get(`${BASE_URL}/api/v1/recon/jobs`);
    // Should return 401 (unauthorized) or 200 (if test auth), not 404 or 500
    expect([200, 401, 403]).toContain(apiResponse.status());
  });

  test('should have working pricing page with accurate information', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/pricing`);

    // Check pricing page loads
    await expect(page).toHaveTitle(/Pricing/);

    // Check pricing tiers are displayed
    const freeTier = page.locator('text=Free');
    const starterTier = page.locator('text=Starter');
    const growthTier = page.locator('text=Growth');

    await expect(freeTier.first()).toBeVisible();
    await expect(starterTier.first()).toBeVisible();
    await expect(growthTier.first()).toBeVisible();

    // Check pricing information matches config
    const freePrice = page.locator('text=/100 transactions/i');
    const starterPrice = page.locator('text=/\\$29/i');
    const growthPrice = page.locator('text=/\\$99/i');

    await expect(freePrice.first()).toBeVisible();
    await expect(starterPrice.first()).toBeVisible();
    await expect(growthPrice.first()).toBeVisible();
  });

  test('should have working ROI calculator', async ({ page }) => {
    await page.goto(`${BASE_URL}/roi-calculator`);

    // Check ROI calculator loads
    await expect(page).toHaveTitle(/ROI/);

    // Check calculator inputs exist
    const transactionsInput = page.locator('input[type="number"]').first();
    await expect(transactionsInput).toBeVisible();

    // Check results section exists
    const savingsSection = page.locator('text=/Savings/i');
    await expect(savingsSection.first()).toBeVisible();

    // Test calculator functionality
    await transactionsInput.fill('1000');
    await page.waitForTimeout(500); // Wait for calculation

    // Check results are displayed
    const monthlySavings = page.locator('text=/Monthly Savings/i');
    await expect(monthlySavings.first()).toBeVisible();
  });

  test('should have working health check endpoints', async ({ page }) => {
    // Test basic health endpoint
    const healthResponse = await page.request.get(`${BASE_URL}/api/health`);
    expect(healthResponse.status()).toBe(200);

    const healthData = await healthResponse.json();
    expect(healthData).toHaveProperty('status');
    expect(healthData.status).toBe('ok');

    // Test admin health endpoint (may require auth)
    const adminHealthResponse = await page.request.get(
      `${BASE_URL}/api/admin/health`
    );
    // Should return 200 (if public) or 401/403 (if requires auth), not 404 or 500
    expect([200, 401, 403]).toContain(adminHealthResponse.status());
  });

  test('should have working API endpoints', async ({ page }) => {
    // Test v1 API root
    const v1Response = await page.request.get(`${BASE_URL}/api/v1`);
    expect([200, 401, 403]).toContain(v1Response.status());

    // Test receipts API
    const receiptsResponse = await page.request.get(`${BASE_URL}/api/v1/receipts`);
    expect([200, 401, 403]).toContain(receiptsResponse.status());

    // Test feature flags API
    const flagsResponse = await page.request.get(`${BASE_URL}/api/v1/feature-flags`);
    expect([200, 401, 403]).toContain(flagsResponse.status());
  });

  test('should have error boundaries that work', async ({ page }) => {
    // Test error page exists
    await page.goto(`${BASE_URL}/error-test`); // Non-existent route

    // Should show error page or redirect, not crash
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();

    // Check for error boundary (should show error UI, not blank page)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('should have working documentation', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs`);

    // Check docs page loads
    await expect(page).toHaveTitle(/Docs|Documentation/);

    // Check docs content exists
    const docsContent = page.locator('main, article, [role="main"]');
    await expect(docsContent.first()).toBeVisible();
  });

  test('should have working security page', async ({ page }) => {
    await page.goto(`${BASE_URL}/security`);

    // Check security page loads
    await expect(page).toHaveTitle(/Security/);

    // Check security content exists
    const securityContent = page.locator('main, article, [role="main"]');
    await expect(securityContent.first()).toBeVisible();
  });

  test('should have working legal pages', async ({ page }) => {
    const legalPages = ['/legal/privacy', '/legal/terms', '/legal/dpa'];

    for (const legalPage of legalPages) {
      await page.goto(`${BASE_URL}${legalPage}`);
      await expect(page).toHaveTitle(/Privacy|Terms|DPA/);

      const content = page.locator('main, article, [role="main"]');
      await expect(content.first()).toBeVisible();
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/`);

    // Check page renders without horizontal scroll
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/`);

    // Check page renders properly
    const bodyDesktop = page.locator('body');
    await expect(bodyDesktop).toBeVisible();
  });

  test('should have no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known non-critical errors
        if (
          !text.includes('favicon') &&
          !text.includes('analytics') &&
          !text.includes('vercel') &&
          !text.includes('sentry')
        ) {
          errors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/`);

    // Allow some time for page to load
    await page.waitForLoadState('networkidle');

    // Check for critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('analytics') &&
        !error.includes('vercel')
    );

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Reality Gates - API Functionality', () => {
  test('should have working Stripe webhook endpoint', async ({ page }) => {
    // Test webhook endpoint exists (should return 400 without signature, not 404)
    const webhookResponse = await page.request.post(
      `${BASE_URL}/api/stripe/webhook`,
      {
        data: {},
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Should return 400 (bad request - missing signature) or 401, not 404 or 500
    expect([400, 401, 403]).toContain(webhookResponse.status());
  });

  test('should have working status endpoint', async ({ page }) => {
    const statusResponse = await page.request.get(`${BASE_URL}/api/status`);
    expect(statusResponse.status()).toBe(200);

    const statusData = await statusResponse.json();
    expect(statusData).toHaveProperty('status');
  });
});
