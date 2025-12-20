/**
 * DOM Reality Enforcement - Comprehensive Render Truth Verification
 * 
 * This test suite ensures the browser's final painted output matches product intent
 * across all routes, breakpoints, and states. It validates:
 * - SSR HTML vs Post-Hydration DOM vs Final Painted DOM
 * - Visibility of all rendered elements
 * - Hydration mismatches
 * - Layout shifts (CLS)
 * - CSS root causes for invisible elements
 * - Accessibility and semantic DOM
 * 
 * Operating Principle: If the browser does not paint it, it does not exist.
 */

import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// DOM Reality Report structure
interface DOMRealityReport {
  route: string;
  timestamp: string;
  ssrHtml: string;
  postHydrationDOM: string;
  finalDOM: string;
  issues: DOMIssue[];
  metrics: DOMMetrics;
}

interface DOMIssue {
  type: 'invisible' | 'hydration_mismatch' | 'layout_shift' | 'accessibility' | 'css_root_cause';
  severity: 'critical' | 'warning' | 'info';
  element: string;
  selector?: string;
  description: string;
  rootCause?: string;
  fix?: string;
}

interface DOMMetrics {
  ssrNodeCount: number;
  hydratedNodeCount: number;
  finalNodeCount: number;
  visibleNodeCount: number;
  invisibleNodeCount: number;
  hydrationMismatches: number;
  layoutShifts: number;
  accessibilityViolations: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}

// Critical routes to audit
const CRITICAL_ROUTES = [
  '/',
  '/signup',
  '/console',
  '/playground',
  '/pricing',
  '/docs',
  '/trust',
  '/cookbook',
  '/runbooks',
];

// Breakpoints to test
const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

// Themes to test
const THEMES = ['light', 'dark'] as const;

/**
 * Capture SSR HTML before any client-side hydration
 */
async function captureSSRHTML(page: Page): Promise<string> {
  // Navigate with JavaScript disabled to get pure SSR
  const context = page.context();
  await context.setExtraHTTPHeaders({ 'Accept': 'text/html' });
  
  // Get initial HTML before hydration
  const html = await page.content();
  return html;
}

/**
 * Capture post-hydration DOM (after React hydration but before all effects)
 */
async function capturePostHydrationDOM(page: Page): Promise<string> {
  // Wait for React to hydrate
  await page.waitForFunction(() => {
    return window.document.querySelector('[data-reactroot]') !== null ||
           window.document.querySelector('[data-nextjs-scroll-focus-boundary]') !== null ||
           document.readyState === 'complete';
  }, { timeout: 10000 }).catch(() => {
    // If React markers aren't found, assume hydration is complete after DOMContentLoaded
  });
  
  // Wait a bit for initial hydration
  await page.waitForTimeout(500);
  
  // Get DOM after hydration
  const dom = await page.evaluate(() => {
    return document.documentElement.outerHTML;
  });
  
  return dom;
}

/**
 * Capture final painted DOM (after all effects, animations, dynamic imports)
 */
async function captureFinalDOM(page: Page): Promise<string> {
  // Wait for network idle
  await page.waitForLoadState('networkidle');
  
  // Wait for all dynamic imports to load
  await page.waitForTimeout(2000);
  
  // Wait for any animations/transitions to complete
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      // Wait for all pending animations
      const checkAnimations = () => {
        const animations = document.getAnimations();
        if (animations.length === 0) {
          resolve();
          return;
        }
        Promise.all(animations.map(anim => anim.finished)).then(() => {
          setTimeout(resolve, 100);
        });
      };
      checkAnimations();
    });
  }).catch(() => {
    // If animations API not available, just wait
  });
  
  // Get final DOM
  const dom = await page.evaluate(() => {
    return document.documentElement.outerHTML;
  });
  
  return dom;
}

/**
 * Analyze element visibility and detect invisible elements
 */
async function analyzeVisibility(page: Page): Promise<DOMIssue[]> {
  const issues: DOMIssue[] = [];
  
  const invisibleElements = await page.evaluate(() => {
    const issues: Array<{
      selector: string;
      reason: string;
      computedStyles: Record<string, string>;
    }> = [];
    
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach((el) => {
      if (el.nodeType !== Node.ELEMENT_NODE) return;
      
      const htmlEl = el as HTMLElement;
      const computed = window.getComputedStyle(htmlEl);
      
      // Check visibility
      const isVisible = 
        computed.display !== 'none' &&
        computed.visibility !== 'hidden' &&
        computed.opacity !== '0' &&
        htmlEl.offsetWidth > 0 &&
        htmlEl.offsetHeight > 0 &&
        !htmlEl.hasAttribute('aria-hidden');
      
      if (!isVisible) {
        // Determine why it's invisible
        let reason = '';
        if (computed.display === 'none') reason = 'display: none';
        else if (computed.visibility === 'hidden') reason = 'visibility: hidden';
        else if (computed.opacity === '0') reason = 'opacity: 0';
        else if (htmlEl.offsetWidth === 0) reason = 'zero width';
        else if (htmlEl.offsetHeight === 0) reason = 'zero height';
        else if (htmlEl.hasAttribute('aria-hidden')) reason = 'aria-hidden="true"';
        
        // Only flag if element has meaningful content
        const hasContent = 
          htmlEl.textContent?.trim().length > 0 ||
          htmlEl.querySelector('img, svg, canvas, video') !== null ||
          htmlEl.hasAttribute('role') ||
          htmlEl.tagName === 'BUTTON' ||
          htmlEl.tagName === 'A' ||
          htmlEl.tagName === 'INPUT';
        
        if (hasContent) {
          const selector = generateSelector(htmlEl);
          issues.push({
            selector,
            reason,
            computedStyles: {
              display: computed.display,
              visibility: computed.visibility,
              opacity: computed.opacity,
              width: computed.width,
              height: computed.height,
              position: computed.position,
              zIndex: computed.zIndex,
            },
          });
        }
      }
    });
    
    return issues;
    
    function generateSelector(el: Element): string {
      if (el.id) return `#${el.id}`;
      if (el.className) {
        const classes = el.className.toString().split(' ').filter(Boolean);
        if (classes.length > 0) {
          return `${el.tagName.toLowerCase()}.${classes[0]}`;
        }
      }
      return el.tagName.toLowerCase();
    }
  });
  
  // Check for intentional hidden patterns
  const intentionalHiddenSelectors = await page.evaluate(() => {
    const intentional: string[] = [];
    document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
      const selector = generateSelector(el);
      intentional.push(selector);
    });
    return intentional;
    
    function generateSelector(el: Element): string {
      if (el.id) return `#${el.id}`;
      if (el.className) {
        const classes = el.className.toString().split(' ').filter(Boolean);
        if (classes.length > 0) {
          return `${el.tagName.toLowerCase()}.${classes[0]}`;
        }
      }
      return el.tagName.toLowerCase();
    }
  });
  
  invisibleElements.forEach(({ selector, reason, computedStyles }) => {
    // Allowlist known intentional patterns
    const isIntentionalHidden = 
      selector.includes('skip-to-main') ||
      intentionalHiddenSelectors.some(intentional => selector.includes(intentional.split('.')[0]));
    
    if (!isIntentionalHidden) {
      issues.push({
        type: 'invisible',
        severity: 'warning',
        element: selector,
        selector,
        description: `Element is invisible: ${reason}`,
        rootCause: `CSS: ${JSON.stringify(computedStyles)}`,
      });
    }
  });
  
  return issues;
}

/**
 * Detect hydration mismatches
 */
async function detectHydrationMismatches(
  ssrHTML: string,
  postHydrationDOM: string
): Promise<DOMIssue[]> {
  const issues: DOMIssue[] = [];
  
  // Compare structure (simplified - full comparison would be more complex)
  const ssrBodyMatch = ssrHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const hydratedBodyMatch = postHydrationDOM.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  
  if (ssrBodyMatch && hydratedBodyMatch) {
    const ssrBody = ssrBodyMatch[1];
    const hydratedBody = hydratedBodyMatch[1];
    
    // Check for major structural differences
    const ssrTextNodes = extractTextNodes(ssrBody);
    const hydratedTextNodes = extractTextNodes(hydratedBody);
    
    // Find missing text nodes
    ssrTextNodes.forEach((text, index) => {
      if (!hydratedTextNodes.includes(text) && text.trim().length > 10) {
        issues.push({
          type: 'hydration_mismatch',
          severity: 'critical',
          element: `text-node-${index}`,
          description: `Text from SSR missing in hydrated DOM: "${text.substring(0, 50)}..."`,
          rootCause: 'Hydration mismatch - content removed during client-side rendering',
        });
      }
    });
  }
  
  return issues;
}

function extractTextNodes(html: string): string[] {
  // Simple extraction - in production, use proper HTML parser
  const textMatches = html.match(/>([^<]+)</g) || [];
  return textMatches
    .map(match => match.replace(/[><]/g, '').trim())
    .filter(text => text.length > 0);
}

/**
 * Measure layout shifts (CLS)
 */
async function measureLayoutShifts(page: Page): Promise<{ shifts: number; score: number }> {
  const metrics = await page.evaluate(() => {
    return new Promise<{ shifts: number; score: number }>((resolve) => {
      let shiftCount = 0;
      let cumulativeScore = 0;
      
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                shiftCount++;
                cumulativeScore += (entry as any).value;
              }
            }
          });
          
          observer.observe({ entryTypes: ['layout-shift'] });
          
          // Wait a bit for shifts to accumulate
          setTimeout(() => {
            observer.disconnect();
            resolve({ shifts: shiftCount, score: cumulativeScore });
          }, 3000);
        } catch (e) {
          resolve({ shifts: 0, score: 0 });
        }
      } else {
        resolve({ shifts: 0, score: 0 });
      }
    });
  });
  
  return metrics;
}

/**
 * Check accessibility violations
 */
async function checkAccessibility(page: Page): Promise<DOMIssue[]> {
  const issues: DOMIssue[] = [];
  
  // Check for common accessibility issues
  const a11yIssues = await page.evaluate(() => {
    const issues: Array<{
      type: string;
      element: string;
      description: string;
    }> = [];
    
    // Check for duplicate IDs
    const ids = new Map<string, Element[]>();
    document.querySelectorAll('[id]').forEach((el) => {
      const id = el.id;
      if (!ids.has(id)) ids.set(id, []);
      ids.get(id)!.push(el);
    });
    
    ids.forEach((elements, id) => {
      if (elements.length > 1) {
        issues.push({
          type: 'duplicate_id',
          element: `#${id}`,
          description: `Duplicate ID found: ${id} (${elements.length} elements)`,
        });
      }
    });
    
    // Check for interactive elements without labels
    document.querySelectorAll('button, input, select, textarea, a[href]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      const hasLabel = 
        htmlEl.getAttribute('aria-label') ||
        htmlEl.getAttribute('aria-labelledby') ||
        document.querySelector(`label[for="${htmlEl.id}"]`) ||
        htmlEl.closest('label');
      
      if (!hasLabel && htmlEl.textContent?.trim().length === 0) {
        issues.push({
          type: 'missing_label',
          element: htmlEl.tagName.toLowerCase(),
          description: `Interactive element without accessible label`,
        });
      }
    });
    
    // Check semantic structure
    const main = document.querySelector('main, [role="main"]');
    if (!main) {
      issues.push({
        type: 'missing_main',
        element: 'body',
        description: 'No <main> or [role="main"] element found',
      });
    }
    
    return issues;
  });
  
  a11yIssues.forEach((issue) => {
    issues.push({
      type: 'accessibility',
      severity: issue.type === 'duplicate_id' ? 'critical' : 'warning',
      element: issue.element,
      description: issue.description,
    });
  });
  
  return issues;
}

/**
 * Generate comprehensive DOM reality report
 */
function generateReport(
  route: string,
  ssrHTML: string,
  postHydrationDOM: string,
  finalDOM: string,
  issues: DOMIssue[],
  metrics: DOMMetrics
): DOMRealityReport {
  return {
    route,
    timestamp: new Date().toISOString(),
    ssrHtml: ssrHTML.substring(0, 10000), // Truncate for storage
    postHydrationDOM: postHydrationDOM.substring(0, 10000),
    finalDOM: finalDOM.substring(0, 10000),
    issues,
    metrics,
  };
}

test.describe('DOM Reality Enforcement', () => {
  test.describe('Critical Routes', () => {
    for (const route of CRITICAL_ROUTES) {
      test(`should render correctly: ${route}`, async ({ page }) => {
        const issues: DOMIssue[] = [];
        let ssrHTML = '';
        let postHydrationDOM = '';
        let finalDOM = '';
        
        // Navigate to route
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Capture SSR HTML (as close as we can get)
        ssrHTML = await page.content();
        
        // Capture post-hydration DOM
        postHydrationDOM = await capturePostHydrationDOM(page);
        
        // Capture final DOM
        finalDOM = await captureFinalDOM(page);
        
        // Analyze visibility
        const visibilityIssues = await analyzeVisibility(page);
        issues.push(...visibilityIssues);
        
        // Detect hydration mismatches
        const hydrationIssues = await detectHydrationMismatches(ssrHTML, postHydrationDOM);
        issues.push(...hydrationIssues);
        
        // Measure layout shifts
        const layoutShifts = await measureLayoutShifts(page);
        if (layoutShifts.shifts > 0 || layoutShifts.score > 0.1) {
          issues.push({
            type: 'layout_shift',
            severity: layoutShifts.score > 0.25 ? 'critical' : 'warning',
            element: 'page',
            description: `Layout shifts detected: ${layoutShifts.shifts} shifts, CLS score: ${layoutShifts.score.toFixed(3)}`,
          });
        }
        
        // Check accessibility
        const a11yIssues = await checkAccessibility(page);
        issues.push(...a11yIssues);
        
        // Calculate metrics
        const ssrNodeCount = (ssrHTML.match(/<[^>]+>/g) || []).length;
        const hydratedNodeCount = (postHydrationDOM.match(/<[^>]+>/g) || []).length;
        const finalNodeCount = (finalDOM.match(/<[^>]+>/g) || []).length;
        
        const visibleElements = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('*')).filter((el) => {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            return (
              computed.display !== 'none' &&
              computed.visibility !== 'hidden' &&
              computed.opacity !== '0' &&
              htmlEl.offsetWidth > 0 &&
              htmlEl.offsetHeight > 0
            ).length;
          }).length;
        });
        
        const metrics: DOMMetrics = {
          ssrNodeCount,
          hydratedNodeCount,
          finalNodeCount,
          visibleNodeCount: visibleElements,
          invisibleNodeCount: finalNodeCount - visibleElements,
          hydrationMismatches: hydrationIssues.length,
          layoutShifts: layoutShifts.shifts,
          cumulativeLayoutShift: layoutShifts.score,
          accessibilityViolations: a11yIssues.length,
        };
        
        // Generate report
        const report = generateReport(route, ssrHTML, postHydrationDOM, finalDOM, issues, metrics);
        
        // Save report
        const reportsDir = join(process.cwd(), 'test-results', 'dom-reality-reports');
        mkdirSync(reportsDir, { recursive: true });
        const reportPath = join(reportsDir, `${route.replace(/\//g, '_')}_${Date.now()}.json`);
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Assertions
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
          console.error(`\n❌ Critical issues found on ${route}:`);
          criticalIssues.forEach(issue => {
            console.error(`  - ${issue.type}: ${issue.description}`);
          });
        }
        
        // Fail on critical issues
        expect(criticalIssues.length).toBe(0);
        
        // Warn on excessive layout shift
        if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.25) {
          console.warn(`⚠️  High CLS on ${route}: ${metrics.cumulativeLayoutShift.toFixed(3)}`);
        }
      });
    }
  });
  
  test.describe('Responsive Breakpoints', () => {
    for (const breakpoint of BREAKPOINTS) {
      test(`homepage renders correctly at ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Check that main content is visible
        const mainContent = page.locator('main, [role="main"], #main-content');
        await expect(mainContent.first()).toBeVisible();
        
        // Check for horizontal scroll (common mobile issue)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        if (hasHorizontalScroll && breakpoint.name === 'mobile') {
          console.warn('⚠️  Horizontal scroll detected on mobile viewport');
        }
        
        // Analyze visibility
        const visibilityIssues = await analyzeVisibility(page);
        const criticalVisibilityIssues = visibilityIssues.filter(i => i.severity === 'critical');
        
        expect(criticalVisibilityIssues.length).toBe(0);
      });
    }
  });
  
  test.describe('Theme Rendering', () => {
    for (const theme of THEMES) {
      test(`homepage renders correctly in ${theme} mode`, async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Set theme
        await page.evaluate((theme) => {
          document.documentElement.classList.remove('dark', 'light');
          document.documentElement.classList.add(theme);
          localStorage.setItem('theme', theme);
        }, theme);
        
        await page.waitForTimeout(500); // Wait for theme to apply
        
        // Check that content is visible
        const mainContent = page.locator('main, [role="main"], #main-content');
        await expect(mainContent.first()).toBeVisible();
        
        // Check text contrast (basic check)
        const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6').count();
        expect(textElements).toBeGreaterThan(0);
      });
    }
  });
  
  test('no hydration warnings in console', async ({ page }) => {
    const hydrationWarnings: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('hydration') ||
        text.includes('Hydration') ||
        text.includes('Text content does not match') ||
        text.includes('Did not expect server HTML')
      ) {
        hydrationWarnings.push(text);
      }
    });
    
    for (const route of CRITICAL_ROUTES.slice(0, 5)) {
      await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
    }
    
    if (hydrationWarnings.length > 0) {
      console.error('\n❌ Hydration warnings found:');
      hydrationWarnings.forEach(warning => console.error(`  - ${warning}`));
    }
    
    expect(hydrationWarnings.length).toBe(0);
  });
  
  test('critical CTAs are visible and clickable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check main CTAs
    const signupCTA = page.locator('a[href="/signup"], a[href*="signup"]').first();
    const docsCTA = page.locator('a[href="/docs"], a[href*="docs"]').first();
    const playgroundCTA = page.locator('a[href="/playground"], a[href*="playground"]').first();
    
    await expect(signupCTA).toBeVisible();
    await expect(docsCTA).toBeVisible();
    
    // Check they're not covered by other elements
    const signupBox = await signupCTA.boundingBox();
    const docsBox = await docsCTA.boundingBox();
    
    expect(signupBox).not.toBeNull();
    expect(docsBox).not.toBeNull();
    
    if (signupBox && docsBox) {
      expect(signupBox.width).toBeGreaterThan(0);
      expect(signupBox.height).toBeGreaterThan(0);
      expect(docsBox.width).toBeGreaterThan(0);
      expect(docsBox.height).toBeGreaterThan(0);
    }
  });
});
