import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Pages to test for visual regression
const VISUAL_TEST_PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/console', name: 'console' },
  { path: '/playground', name: 'playground' },
  { path: '/pricing', name: 'pricing' },
  { path: '/trust', name: 'trust' },
  { path: '/docs', name: 'docs' },
  { path: '/cookbook', name: 'cookbook' },
  { path: '/runbooks', name: 'runbooks' },
  { path: '/schematics', name: 'schematics' },
];

// Viewports to test
const VIEWPORTS = [
  { width: 375, height: 667, name: 'mobile' }, // iPhone SE
  { width: 768, height: 1024, name: 'tablet' }, // iPad
  { width: 1280, height: 720, name: 'desktop' }, // Desktop
];

test.describe('Visual Regression Tests', () => {
  for (const pageConfig of VISUAL_TEST_PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${pageConfig.name} - ${viewport.name} viewport`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to page
        await page.goto(`${BASE_URL}${pageConfig.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        
        // Wait for any animations to complete
        await page.waitForTimeout(1000);
        
        // Take full-page screenshot
        await expect(page).toHaveScreenshot(
          `${pageConfig.name}-${viewport.name}.png`,
          {
            fullPage: true,
            maxDiffPixels: 100,
            threshold: 0.2,
          }
        );
      });
    }
  }
  
  test('homepage - no layout shift', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Check for layout shift indicators
    const layoutShift = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          resolve(cls);
        }).observe({ type: 'layout-shift', buffered: true });
        
        // Resolve after 2 seconds
        setTimeout(() => resolve(cls), 2000);
      });
    });
    
    // CLS should be < 0.1 for good UX
    expect(layoutShift).toBeLessThan(0.1);
  });
});
