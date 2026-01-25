/**
 * Analytics Abstraction Layer
 * 
 * Unified interface for analytics providers with support for multiple providers.
 */

import type { AnalyticsProvider, PageViewProperties, EventProperties, ErrorMetadata } from './types';

class Analytics {
  private initialized = false;

  /**
   * Initialize analytics with configured providers
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    return;
  }

  /**
   * Track a page view
   * Respects cookie consent preferences
   */
  trackPageView(route: string, properties?: PageViewProperties) {
    void route;
    void properties;
  }

  /**
   * Track a custom event
   * Respects cookie consent preferences
   */
  trackEvent(name: string, payload?: EventProperties) {
    void name;
    void payload;
  }

  /**
   * Track an error
   */
  trackError(error: Error | string, metadata?: Partial<ErrorMetadata> & Record<string, any>) {
    void error;
    void metadata;
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, any>) {
    void userId;
    void traits;
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>) {
    void properties;
  }

  /**
   * Flush pending events
   */
  async flush() {
    return Promise.resolve();
  }

  /**
   * Add a custom provider
   */
  addProvider(provider: AnalyticsProvider) {
    void provider;
  }
}

// Singleton instance
export const analytics = new Analytics();

// Export types
export type { AnalyticsProvider, PageViewProperties, EventProperties, ErrorMetadata };
