/**
 * DOM Reality Optimization Utilities
 * 
 * Performance optimizations and best practices for DOM reality testing.
 */

import { Page } from 'playwright';

/**
 * Optimized DOM capture with caching
 */
export class OptimizedDOMCapture {
  private cache = new Map<string, string>();
  
  /**
   * Capture DOM with caching for repeated routes
   */
  async captureDOM(page: Page, route: string, useCache = true): Promise<string> {
    if (useCache && this.cache.has(route)) {
      return this.cache.get(route)!;
    }
    
    const dom = await page.evaluate(() => {
      return document.documentElement.outerHTML;
    });
    
    if (useCache) {
      this.cache.set(route, dom);
    }
    
    return dom;
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Batch element analysis for performance
 */
export async function batchAnalyzeElements(
  page: Page,
  selectors: string[]
): Promise<Array<{ selector: string; isVisible: boolean; boundingBox: any }>> {
  return await page.evaluate((selectors) => {
    return selectors.map(selector => {
      const el = document.querySelector(selector) as HTMLElement;
      if (!el) {
        return { selector, isVisible: false, boundingBox: null };
      }
      
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      
      const isVisible = 
        computed.display !== 'none' &&
        computed.visibility !== 'hidden' &&
        computed.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0;
      
      return {
        selector,
        isVisible,
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      };
    });
  }, selectors);
}

/**
 * Optimized visibility check using Intersection Observer
 */
export async function optimizedVisibilityCheck(page: Page): Promise<Array<{
  selector: string;
  isVisible: boolean;
  intersectionRatio: number;
}>> {
  return await page.evaluate(() => {
    return new Promise<Array<{ selector: string; isVisible: boolean; intersectionRatio: number }>>((resolve) => {
      const results: Array<{ selector: string; isVisible: boolean; intersectionRatio: number }> = [];
      const elements = document.querySelectorAll('*');
      
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const selector = generateSelector(entry.target as Element);
            results.push({
              selector,
              isVisible: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
            });
          });
        }, {
          threshold: [0, 0.1, 0.5, 1.0],
        });
        
        elements.forEach(el => {
          if (el.nodeType === Node.ELEMENT_NODE) {
            observer.observe(el);
          }
        });
        
        // Wait a bit for observations
        setTimeout(() => {
          observer.disconnect();
          resolve(results);
        }, 1000);
      } else {
        // Fallback to manual check
        elements.forEach(el => {
          if (el.nodeType === Node.ELEMENT_NODE) {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            const rect = htmlEl.getBoundingClientRect();
            
            const isVisible = 
              computed.display !== 'none' &&
              computed.visibility !== 'hidden' &&
              computed.opacity !== '0' &&
              rect.width > 0 &&
              rect.height > 0;
            
            results.push({
              selector: generateSelector(el),
              isVisible,
              intersectionRatio: isVisible ? 1 : 0,
            });
          }
        });
        resolve(results);
      }
      
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
  });
}

/**
 * Debounce function for rapid DOM changes
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance monitoring
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
