/**
 * Analytics Abstraction Layer
 *
 * Unified interface for analytics providers with support for multiple providers.
 * Events are dispatched to all registered providers. When no providers are
 * configured the class is a safe no-op — analytics failures never break the app.
 */

import type { AnalyticsProvider, PageViewProperties, EventProperties, ErrorMetadata } from './types';

class Analytics {
  private initialized = false;
  private providers: AnalyticsProvider[] = [];
  private debugMode = false;

  /**
   * Initialize analytics with configured providers
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    this.debugMode = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
    for (const provider of this.providers) {
      try {
        provider.init?.();
      } catch {
        // Provider init failure must not block the app
      }
    }
  }

  private dispatch(method: keyof AnalyticsProvider, args: unknown[]) {
    if (this.debugMode && typeof console !== 'undefined') {
      console.debug(`[analytics] ${String(method)}`, ...args);
    }
    for (const provider of this.providers) {
      try {
        const fn = provider[method];
        if (typeof fn === 'function') {
          (fn as (...a: unknown[]) => void).apply(provider, args);
        }
      } catch {
        // Analytics dispatch failure must not break the app
      }
    }
  }

  /**
   * Track a page view
   */
  trackPageView(route: string, properties?: PageViewProperties) {
    this.dispatch('trackPageView', [route, properties]);
  }

  /**
   * Track a custom event
   */
  trackEvent(name: string, payload?: EventProperties) {
    this.dispatch('trackEvent', [name, payload]);
  }

  /**
   * Track an error
   */
  trackError(error: Error | string, metadata?: Partial<ErrorMetadata> & Record<string, any>) {
    this.dispatch('trackError', [error, metadata]);
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, any>) {
    this.dispatch('identify', [userId, traits]);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>) {
    this.dispatch('setUserProperties', [properties]);
  }

  /**
   * Flush pending events
   */
  async flush() {
    const promises = this.providers
      .filter((p) => typeof p.flush === 'function')
      .map((p) => {
        try { return p.flush!(); } catch { return Promise.resolve(); }
      });
    await Promise.allSettled(promises);
  }

  /**
   * Add a custom provider
   */
  addProvider(provider: AnalyticsProvider) {
    this.providers.push(provider);
    if (this.initialized) {
      try { provider.init?.(); } catch { /* safe */ }
    }
  }
}

// Singleton instance
export const analytics = new Analytics();

// Export types
export type { AnalyticsProvider, PageViewProperties, EventProperties, ErrorMetadata };
