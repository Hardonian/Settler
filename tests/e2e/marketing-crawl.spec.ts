import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/platform',
  '/integrations',
  '/trust',
  '/contact',
  '/privacy',
  '/terms',
  '/status',
] as const;

test.describe('marketing crawl regression guard', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`renders ${route} without 500s or hydration issues`, async ({ page }) => {
      const consoleIssues: string[] = [];

      page.on('console', (message) => {
        const text = message.text();
        const type = message.type();
        if (type === 'error' || /hydration/i.test(text)) {
          consoleIssues.push(`${type}: ${text}`);
        }
      });

      const response = await page.goto(route, { waitUntil: 'networkidle' });

      expect(response, `missing response for route ${route}`).not.toBeNull();
      expect(response!.status(), `route ${route} returned non-success`).toBeLessThan(500);

      await expect(page.locator('body')).toBeVisible();
      expect(consoleIssues, `console issues detected for route ${route}`).toEqual([]);
    });
  }
});
