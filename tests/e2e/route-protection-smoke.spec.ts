import { expect, test } from '@playwright/test';

const MARKETING_ROUTES = ['/', '/pricing', '/trust', '/contact'] as const;

test.describe('route protection smoke', () => {
  for (const route of MARKETING_ROUTES) {
    test(`marketing route ${route} renders without 500 or hydration errors`, async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('pageerror', (error) => {
        consoleErrors.push(`pageerror: ${error.message}`);
      });

      page.on('console', (message) => {
        const text = message.text();
        if (message.type() === 'error' || /hydration/i.test(text)) {
          consoleErrors.push(text);
        }
      });

      const response = await page.goto(route, { waitUntil: 'networkidle' });

      expect(response, `expected HTTP response for ${route}`).not.toBeNull();
      expect(response!.status(), `${route} should return 200`).toBe(200);
      await expect(page.locator('body')).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });
  }

  test('/app redirects unauthenticated users to login with next param', async ({ page }) => {
    const response = await page.goto('/app', { waitUntil: 'networkidle' });

    expect(response, 'expected HTTP response for /app').not.toBeNull();
    expect(response!.status(), '/app should not 500').toBeLessThan(500);
    await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
  });
});
