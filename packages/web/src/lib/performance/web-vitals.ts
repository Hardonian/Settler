/**
 * Web Vitals Collection
 * 
 * Captures Core Web Vitals and performance metrics.
 */

import { analytics } from '../analytics';
import { logger } from '../logging/logger';

export interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
}

/**
 * Get rating for a metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vital metric
 */
export function reportWebVital(metric: WebVitalMetric) {
  const { name, value, rating, id, delta, navigationType } = metric;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    logger.info(`Web Vital: ${name}`, {
      value,
      rating,
      delta,
      navigationType,
    });
  }

  // Track in analytics
  analytics.trackEvent('web_vital', {
    name,
    value: Math.round(value),
    rating,
    delta: Math.round(delta),
    navigationType,
    id,
  });

  // Log poor ratings
  if (rating === 'poor') {
    logger.warn(`Poor Web Vital: ${name} = ${value}ms`, {
      value,
      rating,
      navigationType,
    });
  }
}

/**
 * Initialize Web Vitals collection (Next.js)
 */
export function reportWebVitals(metric: any) {
  const { name, value, id, delta, navigationType } = metric;

  reportWebVital({
    name,
    value,
    id,
    delta,
    rating: getRating(name, value),
    navigationType,
  });
}

/**
 * Manual Web Vitals collection (non-Next.js)
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // LCP - Largest Contentful Paint
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      reportWebVital({
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime,
        id: lastEntry.id,
        delta: lastEntry.renderTime || lastEntry.loadTime,
        rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
      });
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    // PerformanceObserver not supported
  }

  // FID - First Input Delay
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        
        reportWebVital({
          name: 'FID',
          value: fid,
          id: entry.name,
          delta: fid,
          rating: getRating('FID', fid),
        });
      }
    }).observe({ type: 'first-input', buffered: true });
  } catch (error) {
    // PerformanceObserver not supported
  }

  // TTFB - Time to First Byte
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      
      reportWebVital({
        name: 'TTFB',
        value: ttfb,
        id: 'ttfb',
        delta: ttfb,
        rating: getRating('TTFB', ttfb),
      });
    }
  } catch (error) {
    // Not supported
  }
}
