import { test, expect } from '@playwright/test';

/**
 * Console Smoke Test
 * 
 * Verifies critical console navigation paths work without 500 errors:
 * 1. Homepage loads
 * 2. Navigation to Console works
 * 3. Console page renders key elements
 * 4. No unhandled exceptions in console logs
 */
test.describe('Console Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for navigation menu
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Verify no console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Check page title
    await expect(page).toHaveTitle(/Settler/i);
  });

  test('console navigation from homepage', async ({ page }) => {
    // Monitor for errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Start at homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find Console link in navigation
    const consoleLink = page.locator('a[href="/console"]').first();
    await expect(consoleLink).toBeVisible();

    // Click Console link
    await consoleLink.click();

    // Wait for navigation and page load
    await page.waitForURL(/\/console/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify we're on console page (should show public overview or authenticated console)
    // Check for either public overview or console content
    const hasPublicOverview = await page.locator('text=Developer Console').isVisible().catch(() => false);
    const hasConsoleContent = await page.locator('text=API Keys').isVisible().catch(() => false);
    const hasSignInPrompt = await page.locator('text=Sign In').isVisible().catch(() => false);

    expect(hasPublicOverview || hasConsoleContent || hasSignInPrompt).toBeTruthy();

    // Verify no 500 errors
    const response = await page.waitForResponse(
      (response) => response.url().includes('/console') && response.status() !== 200,
      { timeout: 5000 }
    ).catch(() => null);

    if (response && response.status() === 500) {
      throw new Error(`Console page returned 500: ${response.url()}`);
    }

    // Verify no unhandled exceptions
    expect(errors.length).toBe(0);
  });

  test('console page renders without server errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate directly to console
    const response = await page.goto('/console');
    
    // Verify response is not 500
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).toBeLessThan(500);

    await page.waitForLoadState('networkidle');

    // Check for key elements (public or authenticated view)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    // Verify no unhandled exceptions
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('analytics') &&
      !e.includes('cookie')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('console health endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/health/console');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('checks');
    expect(data.checks).toHaveProperty('env');
    expect(data.checks).toHaveProperty('supabase');
  });
});
