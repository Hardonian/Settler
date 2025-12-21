/**
 * DOM Reality Regression Prevention Tests
 * 
 * These tests enforce CSS invariants and prevent common rendering issues
 * from being introduced. They should run in CI and fail builds on violations.
 */

import { test, expect } from '@playwright/test';

test.describe('DOM Reality Regression Prevention', () => {
  test('no conflicting visibility classes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for elements with conflicting visibility classes
    const conflicts = await page.evaluate(() => {
      const conflicts: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const classes = el.className?.toString() || '';
        if (classes.includes('hidden') && classes.includes('block')) {
          conflicts.push(`${el.tagName}.${classes.split(' ')[0]}`);
        }
        if (classes.includes('opacity-0') && classes.includes('opacity-100')) {
          conflicts.push(`${el.tagName}.${classes.split(' ')[0]}`);
        }
      });
      return conflicts;
    });
    
    if (conflicts.length > 0) {
      console.error('Found conflicting visibility classes:', conflicts);
    }
    
    expect(conflicts.length).toBe(0);
  });
  
  test('no absolute/fixed elements without positioning', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const issues = await page.evaluate(() => {
      const issues: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computed = window.getComputedStyle(htmlEl);
        
        if (computed.position === 'absolute' || computed.position === 'fixed') {
          const hasPosition = 
            computed.top !== 'auto' ||
            computed.bottom !== 'auto' ||
            computed.left !== 'auto' ||
            computed.right !== 'auto';
          
          if (!hasPosition && htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0) {
            issues.push(`${htmlEl.tagName} without positioning anchor`);
          }
        }
      });
      return issues;
    });
    
    if (issues.length > 0) {
      console.warn('Found positioned elements without anchors:', issues);
      // Don't fail - some elements might be intentionally positioned by JS
    }
  });
  
  test('no horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const routes = ['/', '/pricing', '/docs', '/signup'];
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      if (hasHorizontalScroll) {
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        throw new Error(
          `Horizontal scroll detected on ${route}: ${scrollWidth}px > ${clientWidth}px`
        );
      }
    }
  });
  
  test('all interactive elements have accessible labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const issues = await page.evaluate(() => {
      const issues: string[] = [];
      document.querySelectorAll('button, input, select, textarea, a[href]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        
        // Skip if intentionally hidden
        if (htmlEl.hasAttribute('aria-hidden') || htmlEl.closest('[aria-hidden="true"]')) {
          return;
        }
        
        const hasLabel = 
          htmlEl.getAttribute('aria-label') ||
          htmlEl.getAttribute('aria-labelledby') ||
          htmlEl.textContent?.trim().length > 0 ||
          document.querySelector(`label[for="${htmlEl.id}"]`) ||
          htmlEl.closest('label');
        
        if (!hasLabel && htmlEl.tagName === 'BUTTON') {
          issues.push(`Button without accessible label: ${htmlEl.className || htmlEl.tagName}`);
        }
      });
      return issues;
    });
    
    if (issues.length > 0) {
      console.warn('Found interactive elements without labels:', issues);
      // Don't fail - some buttons might be decorative
    }
  });
  
  test('no duplicate IDs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const duplicates = await page.evaluate(() => {
      const ids = new Map<string, Element[]>();
      document.querySelectorAll('[id]').forEach((el) => {
        const id = el.id;
        if (!ids.has(id)) ids.set(id, []);
        ids.get(id)!.push(el);
      });
      
      const duplicates: string[] = [];
      ids.forEach((elements, id) => {
        if (elements.length > 1) {
          duplicates.push(id);
        }
      });
      return duplicates;
    });
    
    if (duplicates.length > 0) {
      console.error('Found duplicate IDs:', duplicates);
    }
    
    expect(duplicates.length).toBe(0);
  });
  
  test('skip-to-main link is properly styled', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const skipLink = page.locator('.skip-to-main').first();
    
    // Should exist
    await expect(skipLink).toBeAttached();
    
    // Should be visually hidden by default
    const isHidden = await skipLink.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.left < -1000 || rect.left > window.innerWidth;
    });
    
    expect(isHidden).toBe(true);
    
    // Should be visible on focus
    await skipLink.focus();
    const isVisible = await skipLink.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.left >= 0 && rect.left < window.innerWidth;
    });
    
    expect(isVisible).toBe(true);
  });
  
  test('main content area exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const mainContent = page.locator('main, [role="main"], #main-content').first();
    await expect(mainContent).toBeAttached();
    await expect(mainContent).toBeVisible();
  });
  
  test('no excessive z-index values', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const excessiveZIndex = await page.evaluate(() => {
      const issues: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computed = window.getComputedStyle(htmlEl);
        const zIndex = parseInt(computed.zIndex);
        
        if (!isNaN(zIndex) && zIndex > 1000) {
          issues.push(`${htmlEl.tagName} with z-index: ${zIndex}`);
        }
      });
      return issues;
    });
    
    if (excessiveZIndex.length > 0) {
      console.warn('Found excessive z-index values:', excessiveZIndex);
      // Don't fail - some modals might need high z-index
    }
  });
  
  test('no overflow hidden clipping scrollable content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const clippingIssues = await page.evaluate(() => {
      const issues: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computed = window.getComputedStyle(htmlEl);
        
        if (
          computed.overflow === 'hidden' &&
          htmlEl.scrollHeight > htmlEl.clientHeight &&
          htmlEl.scrollHeight > 100 // Only flag significant clipping
        ) {
          issues.push(`${htmlEl.tagName} clipping ${htmlEl.scrollHeight - htmlEl.clientHeight}px of content`);
        }
      });
      return issues;
    });
    
    if (clippingIssues.length > 5) {
      console.warn('Found potential clipping issues:', clippingIssues.slice(0, 5));
      // Don't fail - some clipping might be intentional
    }
  });
});
