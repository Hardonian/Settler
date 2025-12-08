/**
 * Route Transition Metrics
 * 
 * Tracks navigation performance, hydration, and client bundle load times.
 */

import { analytics } from '../analytics';
import { logger } from '../logging/logger';

interface RouteMetrics {
  route: string;
  transitionStart: number;
  transitionEnd?: number;
  hydrationStart?: number;
  hydrationEnd?: number;
  bundleLoadStart?: number;
  bundleLoadEnd?: number;
}

class RouteMetricsCollector {
  private metrics: Map<string, RouteMetrics> = new Map();
  private currentRoute?: string;

  /**
   * Start tracking a route transition
   */
  startTransition(route: string) {
    this.currentRoute = route;
    this.metrics.set(route, {
      route,
      transitionStart: performance.now(),
    });

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Route transition started: ${route}`);
    }
  }

  /**
   * Mark transition end
   */
  endTransition(route: string) {
    const metric = this.metrics.get(route);
    if (!metric) return;

    metric.transitionEnd = performance.now();
    const transitionTime = metric.transitionEnd - metric.transitionStart;

    analytics.trackEvent('route_transition', {
      route,
      duration: Math.round(transitionTime),
    });

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Route transition completed: ${route} (${Math.round(transitionTime)}ms)`);
    }
  }

  /**
   * Mark hydration start
   */
  startHydration(route: string) {
    const metric = this.metrics.get(route);
    if (!metric) {
      this.startTransition(route);
      this.metrics.get(route)!.hydrationStart = performance.now();
      return;
    }

    metric.hydrationStart = performance.now();
  }

  /**
   * Mark hydration end
   */
  endHydration(route: string) {
    const metric = this.metrics.get(route);
    if (!metric) return;

    metric.hydrationEnd = performance.now();
    const hydrationTime = (metric.hydrationEnd || 0) - (metric.hydrationStart || 0);

    analytics.trackEvent('route_hydration', {
      route,
      duration: Math.round(hydrationTime),
    });

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Route hydrated: ${route} (${Math.round(hydrationTime)}ms)`);
    }

    // Warn on slow hydration
    if (hydrationTime > 1000) {
      logger.warn(`Slow hydration detected: ${route} (${Math.round(hydrationTime)}ms)`);
    }
  }

  /**
   * Track bundle load time
   */
  trackBundleLoad(route: string, startTime: number, endTime: number) {
    const metric = this.metrics.get(route);
    if (!metric) {
      this.startTransition(route);
      const newMetric = this.metrics.get(route)!;
      newMetric.bundleLoadStart = startTime;
      newMetric.bundleLoadEnd = endTime;
      return;
    }

    metric.bundleLoadStart = startTime;
    metric.bundleLoadEnd = endTime;

    const loadTime = endTime - startTime;

    analytics.trackEvent('bundle_load', {
      route,
      duration: Math.round(loadTime),
    });

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Bundle loaded: ${route} (${Math.round(loadTime)}ms)`);
    }
  }

  /**
   * Get metrics for a route
   */
  getMetrics(route: string): RouteMetrics | undefined {
    return this.metrics.get(route);
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics.clear();
  }
}

export const routeMetrics = new RouteMetricsCollector();

// Track Next.js route changes
if (typeof window !== 'undefined') {
  let lastRoute = window.location.pathname;

  // Track initial route
  routeMetrics.startTransition(lastRoute);

  // Track route changes
  const observer = new MutationObserver(() => {
    const currentRoute = window.location.pathname;
    if (currentRoute !== lastRoute) {
      routeMetrics.endTransition(lastRoute);
      routeMetrics.startTransition(currentRoute);
      lastRoute = currentRoute;
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
