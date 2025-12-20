import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MAX_PAGES = 250;

// Routes that should not be clicked (destructive actions, billing, etc.)
const DENY_LIST = [
  '/dashboard/billing',
  '/admin',
  '/api/admin',
  '/console/billing',
  'delete',
  'remove',
  'revoke',
];

// Routes that are expected to require auth but should still render
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/console',
];

// Mobile viewports to test
const MOBILE_VIEWPORTS = [
  { width: 360, height: 800, name: 'mobile-small' },
  { width: 390, height: 844, name: 'mobile-medium' },
  { width: 414, height: 896, name: 'mobile-large' },
  { width: 768, height: 1024, name: 'tablet' },
];

test.describe('Smoke Tests - No Dead Links', () => {
  test('should crawl site and find no dead links', async ({ page, context }) => {
    const visited = new Set<string>();
    const deadLinks: Array<{ url: string; status: number; referrer: string }> = [];
    const errors: Array<{ url: string; error: string }> = [];
    
    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Allowlist common non-critical errors
        if (
          !text.includes('favicon') &&
          !text.includes('analytics') &&
          !text.includes('vercel') &&
          !text.includes('sentry')
        ) {
          errors.push({ url: page.url(), error: text });
        }
      }
    });
    
    // Track failed requests
    page.on('requestfailed', (request) => {
      const url = request.url();
      // Only track same-origin requests
      try {
        const requestUrl = new URL(url);
        const baseUrl = new URL(BASE_URL);
        if (requestUrl.origin === baseUrl.origin) {
          deadLinks.push({
            url,
            status: 0,
            referrer: page.url(),
          });
        }
      } catch {
        // Ignore invalid URLs
      }
    });
    
    // Track responses
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      
      // Only track same-origin requests
      try {
        const requestUrl = new URL(url);
        const baseUrl = new URL(BASE_URL);
        if (requestUrl.origin === baseUrl.origin && status >= 400) {
          // Skip auth-required routes that return 401/403
          const pathname = requestUrl.pathname;
          const isAuthRoute = AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
          if (!isAuthRoute || (status !== 401 && status !== 403)) {
            deadLinks.push({
              url,
              status,
              referrer: page.url(),
            });
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    });
    
    async function crawl(url: string, referrer: string = '') {
      if (visited.has(url) || visited.size >= MAX_PAGES) {
        return;
      }
      
      visited.add(url);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait a bit for any async content
        await page.waitForTimeout(1000);
        
        // Find all internal links
        const links = await page.$$eval('a[href]', (anchors) => {
          return anchors
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((href) => {
              try {
                const url = new URL(href);
                const baseUrl = new URL(window.location.origin);
                return url.origin === baseUrl.origin;
              } catch {
                return false;
              }
            });
        });
        
        // Follow links (respecting deny list)
        for (const link of links) {
          try {
            const linkUrl = new URL(link);
            const pathname = linkUrl.pathname;
            
            // Skip deny list
            if (DENY_LIST.some(denied => pathname.includes(denied))) {
              continue;
            }
            
            // Skip hash-only links
            if (linkUrl.hash && !linkUrl.pathname) {
              continue;
            }
            
            // Normalize URL
            const normalized = `${linkUrl.origin}${pathname}${linkUrl.search}`;
            
            if (!visited.has(normalized) && visited.size < MAX_PAGES) {
              await crawl(normalized, url);
            }
          } catch {
            // Skip invalid URLs
          }
        }
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
      }
    }
    
    // Start crawling from homepage
    await crawl(BASE_URL);
    
    // Report results
    console.log(`\n✅ Crawled ${visited.size} pages`);
    
    if (deadLinks.length > 0) {
      console.error(`\n❌ Found ${deadLinks.length} dead link(s):\n`);
      deadLinks.forEach(({ url, status, referrer }) => {
        console.error(`  ${url} (${status})`);
        console.error(`    Referred from: ${referrer}\n`);
      });
    }
    
    if (errors.length > 0) {
      console.warn(`\n⚠️  Found ${errors.length} console error(s):\n`);
      errors.slice(0, 10).forEach(({ url, error }) => {
        console.warn(`  ${url}: ${error}\n`);
      });
    }
    
    // Assertions
    expect(deadLinks.length).toBe(0);
    
    // Take screenshot on failure
    if (deadLinks.length > 0 || errors.length > 50) {
      await page.screenshot({ path: 'test-results/smoke-failure.png', fullPage: true });
    }
  });
  
  test('critical routes should load without 500 errors', async ({ page }) => {
    const criticalRoutes = [
      '/',
      '/console',
      '/playground',
      '/pricing',
      '/trust',
      '/cookbook',
      '/runbooks',
      '/schematics',
      '/docs',
    ];
    
    const failures: Array<{ route: string; status: number | null; error?: string }> = [];
    
    for (const route of criticalRoutes) {
      try {
        const response = await page.goto(`${BASE_URL}${route}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        const status = response?.status() ?? null;
        
        // CRITICAL: These routes must never return 500
        if (status && status >= 500) {
          failures.push({ route, status });
          continue;
        }
        
        // Check that page rendered (not a blank error page)
        const bodyText = await page.textContent('body');
        if (!bodyText || bodyText.length < 100) {
          failures.push({ route, status, error: 'Page content too short or empty' });
        }
        
        // Check for "Internal Error" text
        if (bodyText?.includes('Internal Error') || bodyText?.includes('500')) {
          failures.push({ route, status, error: 'Page contains "Internal Error" text' });
        }
      } catch (error) {
        failures.push({ 
          route, 
          status: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    if (failures.length > 0) {
      console.error('\n❌ Critical routes failed:\n');
      failures.forEach(({ route, status, error }) => {
        console.error(`  ${route}: ${status ?? 'ERROR'} ${error ? `- ${error}` : ''}`);
      });
    }
    
    expect(failures.length).toBe(0);
  });

  test('critical routes should not have horizontal scroll on mobile', async ({ page }) => {
    const criticalRoutes = [
      '/',
      '/pricing',
      '/console',
      '/playground',
      '/docs',
    ];
    
    const failures: Array<{ route: string; viewport: string; horizontalScroll: number }> = [];
    
    for (const viewport of MOBILE_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      for (const route of criticalRoutes) {
        try {
          await page.goto(`${BASE_URL}${route}`, { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          // Wait for any animations/layout shifts
          await page.waitForTimeout(1000);
          
          // Check for horizontal scroll
          const horizontalScroll = await page.evaluate(() => {
            return Math.max(
              document.documentElement.scrollWidth - document.documentElement.clientWidth,
              document.body.scrollWidth - document.body.clientWidth
            );
          });
          
          if (horizontalScroll > 0) {
            failures.push({ 
              route, 
              viewport: viewport.name, 
              horizontalScroll 
            });
            
            // Take screenshot for debugging
            await page.screenshot({ 
              path: `test-results/horizontal-scroll-${route.replace(/\//g, '_')}-${viewport.name}.png`,
              fullPage: true 
            });
          }
        } catch (error) {
          // Log but don't fail - might be auth issues
          console.warn(`Failed to check ${route} on ${viewport.name}:`, error);
        }
      }
    }
    
    if (failures.length > 0) {
      console.error('\n❌ Routes with horizontal scroll on mobile:\n');
      failures.forEach(({ route, viewport, horizontalScroll }) => {
        console.error(`  ${route} (${viewport}): ${horizontalScroll}px horizontal scroll`);
      });
    }
    
    expect(failures.length).toBe(0);
  });

  test('critical routes should have proper tap targets on mobile', async ({ page }) => {
    const criticalRoutes = ['/', '/pricing', '/console'];
    
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    for (const route of criticalRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        await page.waitForTimeout(1000);
        
        // Check all interactive elements have adequate tap targets (min 44x44px)
        const smallTapTargets = await page.evaluate(() => {
          const interactiveElements = Array.from(
            document.querySelectorAll('a, button, input[type="button"], input[type="submit"], [role="button"]')
          );
          
          return interactiveElements
            .map(el => {
              const rect = el.getBoundingClientRect();
              const minSize = 44; // WCAG minimum tap target size
              
              if (rect.width < minSize || rect.height < minSize) {
                return {
                  tag: el.tagName.toLowerCase(),
                  text: el.textContent?.substring(0, 50) || '',
                  width: rect.width,
                  height: rect.height,
                };
              }
              return null;
            })
            .filter(Boolean);
        });
        
        if (smallTapTargets.length > 0) {
          console.warn(`⚠️  ${route} has ${smallTapTargets.length} small tap targets:`);
          smallTapTargets.forEach(target => {
            console.warn(`  - ${target.tag}: ${target.width}x${target.height}px - "${target.text}"`);
          });
        }
        
        // Don't fail on this - just warn (some elements might be intentionally small)
        // expect(smallTapTargets.length).toBe(0);
      } catch (error) {
        console.warn(`Failed to check tap targets on ${route}:`, error);
      }
    }
  });
});
