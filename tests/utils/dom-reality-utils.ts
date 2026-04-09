/**
 * DOM Reality Utilities
 *
 * Helper functions for analyzing DOM rendering, CSS root causes, and generating reports.
 */

import { Page } from "@playwright/test";

export interface ElementAnalysis {
  selector: string;
  tagName: string;
  isVisible: boolean;
  computedStyles: Record<string, string>;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  rootCause?: string;
  cssSource?: string;
}

/**
 * Analyze a specific element's rendering state
 */
export async function analyzeElement(page: Page, selector: string): Promise<ElementAnalysis> {
  return await page.evaluate(
    ({ selector }) => {
      const el = document.querySelector(selector) as HTMLElement;
      if (!el) {
        return {
          selector,
          tagName: "UNKNOWN",
          isVisible: false,
          computedStyles: {},
          boundingBox: null,
          rootCause: "Element not found in DOM",
        };
      }

      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Determine root cause if invisible
      let rootCause: string | undefined;
      if (
        computed.display === "none" ||
        computed.visibility === "hidden" ||
        computed.opacity === "0" ||
        rect.width === 0 ||
        rect.height === 0
      ) {
        if (computed.display === "none") rootCause = "display: none";
        else if (computed.visibility === "hidden") rootCause = "visibility: hidden";
        else if (computed.opacity === "0") rootCause = "opacity: 0";
        else if (rect.width === 0) rootCause = "zero width (likely collapsed flex/grid)";
        else if (rect.height === 0) rootCause = "zero height (likely collapsed flex/grid)";
      }

      // Try to find CSS source
      let cssSource: string | undefined;
      try {
        const sheet = (computed as any).parentRule?.parentStyleSheet;
        if (sheet) {
          cssSource = sheet.href || "inline";
        }
      } catch {
        // Can't access stylesheet
      }

      return {
        selector,
        tagName: el.tagName,
        isVisible:
          computed.display !== "none" &&
          computed.visibility !== "hidden" &&
          computed.opacity !== "0" &&
          rect.width > 0 &&
          rect.height > 0,
        computedStyles: {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          position: computed.position,
          zIndex: computed.zIndex,
          width: computed.width,
          height: computed.height,
          overflow: computed.overflow,
          clip: computed.clip,
          clipPath: computed.clipPath,
        },
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        rootCause,
        cssSource,
      };
    },
    { selector }
  );
}

/**
 * Find all elements with specific CSS issues
 */
export async function findElementsWithCSSIssues(
  page: Page
): Promise<Array<{ selector: string; issue: string; styles: Record<string, string> }>> {
  return await page.evaluate(() => {
    const issues: Array<{ selector: string; issue: string; styles: Record<string, string> }> = [];

    document.querySelectorAll("*").forEach((el) => {
      if (el.nodeType !== Node.ELEMENT_NODE) return;
      const htmlEl = el as HTMLElement;
      const computed = window.getComputedStyle(htmlEl);

      // Check for problematic CSS patterns
      if (
        computed.position === "absolute" &&
        !computed.top &&
        !computed.bottom &&
        !computed.left &&
        !computed.right
      ) {
        issues.push({
          selector: generateSelector(htmlEl),
          issue: "absolute positioning without anchor (top/left/right/bottom)",
          styles: {
            position: computed.position,
            top: computed.top,
            left: computed.left,
          },
        });
      }

      if (
        computed.position === "fixed" &&
        !computed.top &&
        !computed.bottom &&
        !computed.left &&
        !computed.right
      ) {
        issues.push({
          selector: generateSelector(htmlEl),
          issue: "fixed positioning without anchor",
          styles: {
            position: computed.position,
            top: computed.top,
            left: computed.left,
          },
        });
      }

      if (computed.zIndex && parseInt(computed.zIndex) > 1000) {
        issues.push({
          selector: generateSelector(htmlEl),
          issue: "excessive z-index (potential stacking context issue)",
          styles: {
            zIndex: computed.zIndex,
            position: computed.position,
          },
        });
      }

      if (computed.overflow === "hidden" && htmlEl.scrollHeight > htmlEl.clientHeight) {
        issues.push({
          selector: generateSelector(htmlEl),
          issue: "overflow: hidden clipping content",
          styles: {
            overflow: computed.overflow,
            height: computed.height,
          },
        });
      }
    });

    return issues;

    function generateSelector(el: Element): string {
      if (el.id) return `#${el.id}`;
      const path: string[] = [];
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.className) {
          const classes = el.className.toString().split(" ").filter(Boolean);
          if (classes.length > 0) {
            selector += "." + classes[0];
          }
        }
        path.unshift(selector);
        el = el.parentElement as Element;
        if (path.length > 3) break; // Limit depth
      }
      return path.join(" > ");
    }
  });
}

/**
 * Check for Tailwind utility conflicts
 */
export async function detectTailwindConflicts(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const conflicts: string[] = [];

    document
      .querySelectorAll(
        '[class*="hidden"][class*="block"], [class*="opacity-0"][class*="opacity-100"]'
      )
      .forEach((el) => {
        const classes = el.className.toString();
        if (classes.includes("hidden") && classes.includes("block")) {
          conflicts.push(`Conflicting visibility classes: ${classes}`);
        }
        if (classes.includes("opacity-0") && classes.includes("opacity-100")) {
          conflicts.push(`Conflicting opacity classes: ${classes}`);
        }
      });

    return conflicts;
  });
}

/**
 * Measure paint timing metrics
 */
export async function measurePaintMetrics(page: Page): Promise<{
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
}> {
  return await page.evaluate(() => {
    return new Promise<{
      firstContentfulPaint?: number;
      largestContentfulPaint?: number;
      firstInputDelay?: number;
    }>((resolve) => {
      const metrics: {
        firstContentfulPaint?: number;
        largestContentfulPaint?: number;
        firstInputDelay?: number;
      } = {};

      if ("PerformanceObserver" in window) {
        try {
          // FCP
          const fcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === "first-contentful-paint") {
                metrics.firstContentfulPaint = entry.startTime;
              }
            }
          });
          fcpObserver.observe({ entryTypes: ["paint"] });

          // LCP
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
          });
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

          // FID
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
            }
          });
          fidObserver.observe({ entryTypes: ["first-input"] });

          setTimeout(() => {
            fcpObserver.disconnect();
            lcpObserver.disconnect();
            fidObserver.disconnect();
            resolve(metrics);
          }, 5000);
        } catch {
          resolve(metrics);
        }
      } else {
        resolve(metrics);
      }
    });
  });
}

/**
 * Generate selector for an element
 */
export function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();

    if (current.className) {
      const classes = current.className.toString().split(" ").filter(Boolean);
      if (classes.length > 0) {
        selector += "." + classes[0];
      }
    }

    // Add nth-child if needed for uniqueness
    const siblings = Array.from(current.parentElement?.children || []);
    const index = siblings.indexOf(current);
    if (siblings.length > 1) {
      selector += `:nth-child(${index + 1})`;
    }

    path.unshift(selector);
    current = current.parentElement;

    if (path.length > 5) break; // Limit depth
  }

  return path.join(" > ");
}

/**
 * Compare two DOM structures
 */
export function compareDOM(
  dom1: string,
  dom2: string
): {
  added: string[];
  removed: string[];
  changed: string[];
} {
  // Simplified comparison - in production, use proper HTML diffing
  const nodes1 = extractNodeSignatures(dom1);
  const nodes2 = extractNodeSignatures(dom2);

  const added = nodes2.filter((n) => !nodes1.includes(n));
  const removed = nodes1.filter((n) => !nodes2.includes(n));
  const changed: string[] = []; // Would need more sophisticated diffing

  return { added, removed, changed };
}

function extractNodeSignatures(html: string): string[] {
  const signatures: string[] = [];
  const tagMatches = html.match(/<(\w+)([^>]*)>/g) || [];

  tagMatches.forEach((tag) => {
    const idMatch = tag.match(/id="([^"]+)"/);
    const classMatch = tag.match(/class="([^"]+)"/);
    const tagNameMatch = tag.match(/<(\w+)/);

    if (idMatch) {
      signatures.push(`#${idMatch[1]}`);
    } else if (classMatch && tagNameMatch) {
      const firstClass = classMatch[1].split(" ")[0];
      signatures.push(`${tagNameMatch[1]}.${firstClass}`);
    } else if (tagNameMatch) {
      signatures.push(tagNameMatch[1]);
    }
  });

  return signatures;
}
