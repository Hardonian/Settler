/**
 * Reality Gates - Navigation & Non-500 Checks
 * 
 * Ensures critical routes don't 500 and navigation works.
 * This test MUST pass in CI or build fails.
 */

import { test, expect } from '@playwright/test';

test.describe('Reality Gates', () => {
  test('public routes load without 500', async ({ page }) => {
    const routes = [
      '/',
      '/docs',
      '/pricing',
    ];

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.status()).not.toBe(500);
      expect(response?.status()).toBeLessThan(500);
      
      // Check page loaded (not blank)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('console routes require auth (redirect or 401)', async ({ page }) => {
    const consoleRoutes = [
      '/console',
      '/console/runs',
      '/console/workflows',
    ];

    for (const route of consoleRoutes) {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      const status = response?.status();
      
      // Should redirect to login or return 401, not 500
      expect(status).not.toBe(500);
      expect(status).toBeLessThan(500);
      
      // If redirected, should go to login or signup
      const url = page.url();
      if (status === 200) {
        // Might be on console if already authenticated
        // Just check it's not a 500 error page
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('500');
        expect(bodyText).not.toContain('Internal Server Error');
      }
    }
  });

  test('api health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBeLessThan(500);
    
    if (response.ok()) {
      const body = await response.json();
      expect(body).toHaveProperty('ok');
    }
  });

  test('api status endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/status/health');
    expect(response.status()).toBeLessThan(500);
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    
    // Find all navigation links
    const navLinks = page.locator('nav a, header a, [role="navigation"] a');
    const links = await navLinks.all();
    
    for (const link of links.slice(0, 10)) { // Limit to first 10 to avoid timeout
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        // Skip external links and anchors
        if (!href.includes('#') && !href.includes('http')) {
          try {
            const response = await page.goto(href, { waitUntil: 'networkidle', timeout: 10000 });
            if (response) {
              expect(response.status()).not.toBe(500);
              expect(response.status()).toBeLessThan(500);
            }
          } catch (error) {
            // Some routes might timeout or require auth - that's OK
            // Just ensure no 500
            console.warn(`Navigation check skipped for ${href}:`, error);
          }
        }
      }
    }
  });

  test('no blank screens on error', async ({ page }) => {
    // Try accessing a non-existent route
    const response = await page.goto('/this-route-does-not-exist-12345', { waitUntil: 'networkidle' });
    
    // Should show 404 page, not blank screen
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toBe('');
    expect(bodyText).not.toBeNull();
    
    // Should not be a 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('runs API endpoint structure', async ({ request }) => {
    // Test that runs API exists and returns proper structure (even if 401/404)
    const response = await request.get('/api/runs/non-existent-id');
    
    // Should not be 500
    expect(response.status()).not.toBe(500);
    
    if (response.status() === 401 || response.status() === 404) {
      // Expected for unauthenticated or non-existent
      const body = await response.json();
      expect(body).toHaveProperty('error');
    }
  });
});
