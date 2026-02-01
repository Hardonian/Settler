/**
 * Visual Regression Test Helpers
 *
 * Shared utilities for stabilizing pages and ensuring deterministic screenshots.
 */

import { Page, Locator } from "@playwright/test";

/**
 * Configuration for visual test stabilization
 */
export interface StabilizeOptions {
  /** Hide elements matching these selectors */
  hideSelectors?: string[];
  /** Freeze time to this date */
  freezeTime?: Date;
  /** Disable all animations */
  disableAnimations?: boolean;
  /** Wait for fonts to load */
  waitForFonts?: boolean;
  /** Additional CSS to inject */
  customCSS?: string;
  /** Timeout for stabilization */
  timeout?: number;
}

/**
 * Default stabilization options
 */
export const DEFAULT_STABILIZE_OPTIONS: StabilizeOptions = {
  hideSelectors: [
    '[data-testid="timestamp"]',
    '[data-testid="dynamic-content"]',
    '[data-testid="live-indicator"]',
    "time",
    ".animate-shimmer",
    ".animate-shine",
    ".animate-pulse",
    ".typing-indicator",
  ],
  freezeTime: new Date("2024-01-15T12:00:00Z"),
  disableAnimations: true,
  waitForFonts: true,
  customCSS: "",
  timeout: 30000,
};

/**
 * CSS to disable animations and ensure visual consistency
 */
export const DISABLE_ANIMATIONS_CSS = `
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    animation-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Hide video and audio elements that may autoplay */
  video,
  audio {
    visibility: hidden !important;
  }
  
  /* Ensure consistent font rendering */
  body {
    font-feature-settings: normal !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    text-rendering: optimizeLegibility !important;
  }
  
  /* Prevent layout shifts from lazy-loaded images */
  img {
    content-visibility: auto !important;
  }
`;

/**
 * Stabilize a page for visual regression testing
 */
export async function stabilizePage(
  page: Page,
  options: Partial<StabilizeOptions> = {}
): Promise<void> {
  const config = { ...DEFAULT_STABILIZE_OPTIONS, ...options };

  // Build CSS
  let css = config.disableAnimations ? DISABLE_ANIMATIONS_CSS : "";

  // Add hiding CSS for specified selectors
  if (config.hideSelectors && config.hideSelectors.length > 0) {
    css += `\n${config.hideSelectors.join(", ")} { visibility: hidden !important; }`;
  }

  // Add custom CSS
  if (config.customCSS) {
    css += `\n${config.customCSS}`;
  }

  // Inject CSS
  if (css) {
    await page.addStyleTag({ content: css });
  }

  // Freeze time
  if (config.freezeTime) {
    const frozenTimestamp = config.freezeTime.getTime();

    await page.evaluate((timestamp) => {
      const OriginalDate = window.Date;
      const frozenDate = new OriginalDate(timestamp);

      // Override Date
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Date = class extends OriginalDate {
        constructor(...args: (string | number | Date)[]) {
          if (args.length === 0) {
            super(frozenDate);
          } else {
            super(...(args as [string | number | Date]));
          }
        }

        static now(): number {
          return timestamp;
        }
      };

      // Override performance.now()
      performance.now = () => timestamp;

      // Override requestAnimationFrame to call immediately
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = (callback: FrameRequestCallback) => {
        callback(timestamp);
        return 0;
      };

      // Clear any existing intervals/timeouts that might cause flicker
      const maxId = setTimeout(() => {}, 0);
      for (let i = 0; i < maxId; i++) {
        clearTimeout(i);
        clearInterval(i);
      }
    }, frozenTimestamp);
  }

  // Wait for fonts
  if (config.waitForFonts) {
    await page.evaluate(() => document.fonts.ready);
  }

  // Wait for images
  await page.waitForFunction(() => {
    const images = document.querySelectorAll("img");
    return Array.from(images).every((img) => img.complete);
  });

  // Wait for network to be idle
  await page.waitForLoadState("networkidle");

  // Final settle time
  await page.waitForTimeout(300);
}

/**
 * Wait for all images to load
 */
export async function waitForImages(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const images = document.querySelectorAll("img");
    return Array.from(images).every((img) => img.complete);
  });
}

/**
 * Mask dynamic elements with blur or solid color
 */
export async function maskDynamicElements(
  page: Page,
  selectors: string[],
  method: "blur" | "solid" = "blur"
): Promise<void> {
  const css = selectors
    .map((selector) => {
      if (method === "blur") {
        return `${selector} { filter: blur(8px) !important; }`;
      } else {
        return `${selector} { background: #ccc !important; color: #ccc !important; }`;
      }
    })
    .join("\n");

  await page.addStyleTag({ content: css });
}

/**
 * Scroll to element and wait for stability
 */
export async function scrollToElement(
  page: Page,
  locator: Locator | string,
  options: { offset?: number; waitFor?: number } = {}
): Promise<void> {
  const { offset = 0, waitFor = 300 } = options;

  const element = typeof locator === "string" ? page.locator(locator).first() : locator;

  await element.scrollIntoViewIfNeeded();

  if (offset !== 0) {
    await page.evaluate((scrollOffset) => {
      window.scrollBy(0, scrollOffset);
    }, offset);
  }

  await page.waitForTimeout(waitFor);
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Get element position relative to viewport
 */
export async function getElementPosition(
  page: Page,
  selector: string
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  }, selector);
}

/**
 * Force visible state on elements (useful for testing hover states)
 */
export async function forceHoverState(page: Page, selector: string): Promise<void> {
  await page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel);
    elements.forEach((el) => {
      el.classList.add("hover");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).style.cssText += "; background-color: inherit; color: inherit;";
    });
  }, selector);
}

/**
 * Remove elements from DOM (for removing dynamic content)
 */
export async function removeElements(page: Page, selectors: string[]): Promise<void> {
  await page.evaluate((sels) => {
    sels.forEach((sel) => {
      const elements = document.querySelectorAll(sel);
      elements.forEach((el) => el.remove());
    });
  }, selectors);
}

/**
 * Setup consistent test environment
 */
export async function setupTestEnvironment(page: Page): Promise<void> {
  // Set consistent viewport scale
  await page.setViewportSize({ width: 1280, height: 720 });

  // Set consistent locale and timezone
  await page.context().setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  // Disable service workers for consistency
  await page.context().addInitScript(() => {
    delete (window as typeof window & { navigator?: { serviceWorker?: unknown } }).navigator
      ?.serviceWorker;
  });
}

/**
 * Capture and log console messages during test
 */
export function captureConsoleMessages(page: Page): string[] {
  const messages: string[] = [];

  page.on("console", (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    messages.push(text);

    // Log to test output
    if (msg.type() === "error") {
      console.error(text);
    } else if (msg.type() === "warning") {
      console.warn(text);
    }
  });

  return messages;
}

/**
 * Wait for all fonts to be loaded
 */
export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);

  // Additional wait for web fonts
  await page.waitForFunction(() => {
    return document.readyState === "complete";
  });

  await page.waitForTimeout(100);
}
