/**
 * DOM Reality Inspector - Comprehensive Render Truth Verification
 * 
 * This script performs deep DOM analysis to ensure browser-rendered output
 * matches product intent. It captures SSR HTML, post-hydration DOM, and
 * final painted DOM, then compares them to identify discrepancies.
 * 
 * Operating Principle: If the browser does not paint it, it does not exist.
 */

import { chromium, Browser, Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import type { 
  DOMRealityReport, 
  DOMIssue, 
  DOMMetrics, 
  InspectionConfig 
} from './dom-reality-types';

// Load environment variables from .env files (same as Playwright config)
const envFiles = [
  resolve(__dirname, '..', '.env.local'),
  resolve(__dirname, '..', '.env.development'),
  resolve(__dirname, '..', '.env'),
  resolve(__dirname, '..', 'packages/web/.env.local'),
  resolve(__dirname, '..', 'packages/web/.env.development'),
  resolve(__dirname, '..', 'packages/web/.env'),
];

envFiles.forEach((file) => {
  if (existsSync(file)) {
    config({ path: file, override: false });
  }
});

/**
 * Capture SSR HTML (before any client-side hydration)
 */
async function captureSSRHTML(page: Page): Promise<string> {
  // Get initial HTML immediately after navigation
  const html = await page.content();
  return html;
}

/**
 * Capture post-hydration DOM (after React hydration but before all effects)
 */
async function capturePostHydrationDOM(page: Page): Promise<string> {
  // Wait for React to hydrate
  await page.waitForFunction(() => {
    return (
      document.readyState === 'complete' &&
      (window as any).__NEXT_DATA__ !== undefined
    );
  }, { timeout: 10000 }).catch(() => {
    // If Next.js markers aren't found, assume hydration is complete
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
      const checkAnimations = () => {
        const animations = document.getAnimations();
        if (animations.length === 0) {
          setTimeout(resolve, 200);
          return;
        }
        Promise.all(animations.map(anim => anim.finished)).then(() => {
          setTimeout(resolve, 200);
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
      tagName: string;
      hasContent: boolean;
      textContent: string;
    }> = [];
    
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach((el) => {
      if (el.nodeType !== Node.ELEMENT_NODE) return;
      
      const htmlEl = el as HTMLElement;
      const computed = window.getComputedStyle(htmlEl);
      const rect = htmlEl.getBoundingClientRect();
      
      // Check visibility
      const isVisible = 
        computed.display !== 'none' &&
        computed.visibility !== 'hidden' &&
        computed.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0 &&
        !htmlEl.hasAttribute('aria-hidden');
      
      if (!isVisible) {
        // Determine why it's invisible
        let reason = '';
        if (computed.display === 'none') reason = 'display: none';
        else if (computed.visibility === 'hidden') reason = 'visibility: hidden';
        else if (computed.opacity === '0') reason = 'opacity: 0';
        else if (rect.width === 0) reason = 'zero width';
        else if (rect.height === 0) reason = 'zero height';
        else if (htmlEl.hasAttribute('aria-hidden')) reason = 'aria-hidden="true"';
        
        // Check if element has meaningful content
        const textContent = htmlEl.textContent?.trim() || '';
        const hasContent = 
          textContent.length > 0 ||
          htmlEl.querySelector('img, svg, canvas, video, iframe') !== null ||
          htmlEl.hasAttribute('role') ||
          ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(htmlEl.tagName) ||
          htmlEl.hasAttribute('aria-label') ||
          htmlEl.hasAttribute('aria-labelledby');
        
        if (hasContent) {
          const selector = generateSelector(htmlEl);
          issues.push({
            selector,
            reason,
            tagName: htmlEl.tagName,
            computedStyles: {
              display: computed.display,
              visibility: computed.visibility,
              opacity: computed.opacity,
              width: computed.width,
              height: computed.height,
              position: computed.position,
              zIndex: computed.zIndex,
              overflow: computed.overflow,
            },
            hasContent: true,
            textContent: textContent.substring(0, 100),
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
  
  invisibleElements.forEach(({ selector, reason, computedStyles, tagName, textContent }) => {
    // Allowlist known intentional patterns
    const isIntentionalHidden = 
      selector.includes('skip-to-main') ||
      selector.includes('hidden') ||
      tagName === 'SCRIPT' ||
      tagName === 'STYLE' ||
      tagName === 'NOSCRIPT' ||
      intentionalHiddenSelectors.some(intentional => selector.includes(intentional.split('.')[0]));
    
    if (!isIntentionalHidden) {
      issues.push({
        type: 'invisible',
        severity: textContent.length > 20 ? 'critical' : 'warning',
        element: selector,
        selector,
        description: `Element is invisible: ${reason}. Content: "${textContent.substring(0, 50)}..."`,
        rootCause: `CSS: ${JSON.stringify(computedStyles)}`,
        computedStyles,
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
  
  // Compare structure
  const ssrBodyMatch = ssrHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const hydratedBodyMatch = postHydrationDOM.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  
  if (ssrBodyMatch && hydratedBodyMatch) {
    const ssrBody = ssrBodyMatch[1];
    const hydratedBody = hydratedBodyMatch[1];
    
    // Extract text nodes
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
    
    // Check for structural differences
    const ssrElementCount = (ssrBody.match(/<[^>]+>/g) || []).length;
    const hydratedElementCount = (hydratedBody.match(/<[^>]+>/g) || []).length;
    
    if (Math.abs(ssrElementCount - hydratedElementCount) > 10) {
      issues.push({
        type: 'hydration_mismatch',
        severity: 'warning',
        element: 'body',
        description: `Significant DOM structure change: SSR has ${ssrElementCount} elements, hydrated has ${hydratedElementCount}`,
        rootCause: 'DOM structure changed during hydration',
      });
    }
  }
  
  return issues;
}

function extractTextNodes(html: string): string[] {
  const textMatches = html.match(/>([^<]+)</g) || [];
  return textMatches
    .map(match => match.replace(/[><]/g, '').trim())
    .filter(text => text.length > 0 && !text.match(/^\s*$/));
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
        htmlEl.closest('label') ||
        htmlEl.textContent?.trim().length > 0;
      
      if (!hasLabel && htmlEl.tagName === 'BUTTON' && !htmlEl.getAttribute('aria-hidden')) {
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
 * Inspect a single route
 */
async function inspectRoute(
  browser: Browser,
  route: string,
  config: InspectionConfig,
  viewport: { name: string; width: number; height: number },
  theme?: string
): Promise<DOMRealityReport> {
  const page = await browser.newPage();
  
  try {
    // Set viewport
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    // Set theme if provided
    if (theme) {
      await page.addInitScript((theme) => {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.add(theme);
      }, theme);
    }
    
    const issues: DOMIssue[] = [];
    let ssrHTML = '';
    let postHydrationDOM = '';
    let finalDOM = '';
    
    // Navigate to route
    await page.goto(`${config.baseURL}${route}`, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    // Capture SSR HTML
    ssrHTML = await captureSSRHTML(page);
    
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
        const rect = htmlEl.getBoundingClientRect();
        return (
          computed.display !== 'none' &&
          computed.visibility !== 'hidden' &&
          computed.opacity !== '0' &&
          rect.width > 0 &&
          rect.height > 0
        );
      }).length;
    });
    
    // Capture performance metrics
    const perfMetrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        firstContentfulPaint: perf?.domContentLoadedEventEnd,
        timeToInteractive: perf?.domInteractive,
      };
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
      firstContentfulPaint: perfMetrics.firstContentfulPaint,
      timeToInteractive: perfMetrics.timeToInteractive,
    };
    
    // Generate report
    const report: DOMRealityReport = {
      route,
      timestamp: new Date().toISOString(),
      viewport: { width: viewport.width, height: viewport.height },
      theme,
      ssrHtml: ssrHTML.substring(0, 50000), // Truncate for storage
      postHydrationDOM: postHydrationDOM.substring(0, 50000),
      finalDOM: finalDOM.substring(0, 50000),
      issues,
      metrics,
    };
    
    return report;
  } finally {
    await page.close();
  }
}

/**
 * Main inspection function
 */
export async function inspectDOMReality(config: InspectionConfig): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    mkdirSync(config.outputDir, { recursive: true });
    
    const allReports: DOMRealityReport[] = [];
    
    for (const route of config.routes) {
      console.log(`Inspecting route: ${route}`);
      
      for (const viewport of config.viewports) {
        const themes = config.themes || ['light'];
        
        for (const theme of themes) {
          const report = await inspectRoute(
            browser,
            route,
            config,
            viewport,
            theme
          );
          
          allReports.push(report);
          
          // Save individual report
          const reportPath = join(
            config.outputDir,
            `${route.replace(/\//g, '_')}_${viewport.name}_${theme}_${Date.now()}.json`
          );
          writeFileSync(reportPath, JSON.stringify(report, null, 2));
        }
      }
    }
    
    // Generate summary report
    const summary = {
      timestamp: new Date().toISOString(),
      totalRoutes: config.routes.length,
      totalReports: allReports.length,
      criticalIssues: allReports.reduce((sum, r) => 
        sum + r.issues.filter(i => i.severity === 'critical').length, 0
      ),
      warnings: allReports.reduce((sum, r) => 
        sum + r.issues.filter(i => i.severity === 'warning').length, 0
      ),
      routes: allReports.map(r => ({
        route: r.route,
        criticalIssues: r.issues.filter(i => i.severity === 'critical').length,
        warnings: r.issues.filter(i => i.severity === 'warning').length,
        metrics: r.metrics,
      })),
    };
    
    const summaryPath = join(config.outputDir, 'summary.json');
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`\n✅ Inspection complete!`);
    console.log(`   Total routes inspected: ${config.routes.length}`);
    console.log(`   Critical issues: ${summary.criticalIssues}`);
    console.log(`   Warnings: ${summary.warnings}`);
    console.log(`   Reports saved to: ${config.outputDir}`);
  } finally {
    await browser.close();
  }
}

// CLI entry point
if (require.main === module) {
  const config: InspectionConfig = {
    routes: [
      '/',
      '/signup',
      '/pricing',
      '/docs',
      '/console',
      '/playground',
      '/trust',
    ],
    viewports: [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'desktop', width: 1280, height: 720 },
    ],
    themes: ['light', 'dark'],
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    outputDir: join(process.cwd(), 'test-results', 'dom-reality-reports'),
  };
  
  inspectDOMReality(config).catch((error) => {
    console.error('DOM Reality Inspection failed:', error);
    process.exit(1);
  });
}
