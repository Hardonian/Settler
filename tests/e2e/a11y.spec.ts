import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Core pages to test for accessibility
const A11Y_TEST_PAGES = [
  '/',
  '/console',
  '/playground',
  '/pricing',
  '/trust',
  '/docs',
];

test.describe('Accessibility Tests', () => {
  for (const path of A11Y_TEST_PAGES) {
    test(`${path} should have no serious accessibility violations`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      // Wait for page to be fully interactive
      await page.waitForTimeout(1000);
      
      // Run axe-core accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
        .analyze();
      
      // Filter to only serious/critical violations
      const seriousViolations = accessibilityScanResults.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical'
      );
      
      if (seriousViolations.length > 0) {
        console.error(`\n❌ Found ${seriousViolations.length} serious accessibility violation(s) on ${path}:\n`);
        seriousViolations.forEach((violation) => {
          console.error(`  [${violation.impact}] ${violation.id}: ${violation.description}`);
          console.error(`    Help: ${violation.helpUrl}`);
          if (violation.nodes.length > 0) {
            violation.nodes.forEach((node) => {
              console.error(`    - ${node.html}`);
            });
          }
        });
      }
      
      // Fail on serious/critical violations
      expect(seriousViolations.length).toBe(0);
    });
    
    test(`${path} should have proper heading hierarchy`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      // Check for h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThan(0);
      expect(h1Count).toBeLessThanOrEqual(1); // Should have exactly one h1
      
      // Check heading hierarchy (no skipping levels)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      let lastLevel = 0;
      
      for (const heading of headings) {
        const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
        const level = parseInt(tagName.charAt(1));
        
        // First heading should be h1
        if (lastLevel === 0) {
          expect(level).toBe(1);
        } else {
          // Should not skip levels (e.g., h1 -> h3)
          expect(level).toBeLessThanOrEqual(lastLevel + 1);
        }
        
        lastLevel = level;
      }
    });
    
    test(`${path} should have proper form labels`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      // Find all inputs without labels
      const inputsWithoutLabels = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        return inputs.filter((input) => {
          const id = input.id;
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          
          return !ariaLabel && !ariaLabelledBy && !label;
        }).map((input) => ({
          tag: input.tagName.toLowerCase(),
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name') || '',
        }));
      });
      
      if (inputsWithoutLabels.length > 0) {
        console.warn(`\n⚠️  Found ${inputsWithoutLabels.length} input(s) without labels on ${path}:`);
        inputsWithoutLabels.forEach((input) => {
          console.warn(`  - ${input.tag}[type="${input.type}" name="${input.name}"]`);
        });
      }
      
      // Allow some inputs without labels (e.g., search boxes with placeholder)
      // But fail if there are many
      expect(inputsWithoutLabels.length).toBeLessThan(5);
    });
  }
});
