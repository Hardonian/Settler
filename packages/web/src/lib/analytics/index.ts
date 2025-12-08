/**
 * Analytics Abstraction Layer
 * 
 * Unified interface for analytics providers with support for multiple providers.
 */

import type { AnalyticsProvider, AnalyticsProviderType, PageViewProperties, EventProperties, ErrorMetadata } from './types';
import { vercelProvider } from './providers/vercel';
import { createGA4Provider } from './providers/ga4';
import { createPostHogProvider } from './providers/posthog';
import { createCustomProvider } from './providers/custom';

class Analytics {
  private providers: AnalyticsProvider[] = [];
  private initialized = false;

  /**
   * Initialize analytics with configured providers
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;

    const providerTypes = this.getProviderTypes();

    for (const type of providerTypes) {
      try {
        let provider: AnalyticsProvider | null = null;

        switch (type) {
          case 'vercel':
            provider = vercelProvider;
            break;
          case 'ga4':
            provider = createGA4Provider();
            break;
          case 'posthog':
            provider = createPostHogProvider();
            break;
          case 'custom':
            const customEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
            if (customEndpoint) {
              provider = createCustomProvider({
                endpoint: customEndpoint,
                headers: {
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_ANALYTICS_TOKEN || ''}`,
                },
              });
            }
            break;
        }

        if (provider) {
          provider.init?.();
          this.providers.push(provider);
        }
      } catch (error) {
        console.warn(`Failed to initialize analytics provider ${type}:`, error);
      }
    }

    this.initialized = true;
  }

  /**
   * Get enabled provider types from environment
   */
  private getProviderTypes(): AnalyticsProviderType[] {
    const providersEnv = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDERS || 'vercel';
    const providers = providersEnv.split(',').map((p) => p.trim()) as AnalyticsProviderType[];
    
    // Filter out 'none'
    return providers.filter((p) => p !== 'none');
  }

  /**
   * Track a page view
   */
  trackPageView(route: string, properties?: PageViewProperties) {
    if (!this.initialized) this.init();

    this.providers.forEach((provider) => {
      try {
        provider.trackPageView(route, properties);
      } catch (error) {
        console.warn('Failed to track page view:', error);
      }
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(name: string, payload?: EventProperties) {
    if (!this.initialized) this.init();

    this.providers.forEach((provider) => {
      try {
        provider.trackEvent(name, payload);
      } catch (error) {
        console.warn('Failed to track event:', error);
      }
    });
  }

  /**
   * Track an error
   */
  trackError(error: Error | string, metadata?: ErrorMetadata) {
    if (!this.initialized) this.init();

    const errorMetadata: ErrorMetadata = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    this.providers.forEach((provider) => {
      try {
        provider.trackError(error, errorMetadata);
      } catch (err) {
        console.warn('Failed to track error:', err);
      }
    });
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.initialized) this.init();

    this.providers.forEach((provider) => {
      try {
        provider.identify?.(userId, traits);
      } catch (error) {
        console.warn('Failed to identify user:', error);
      }
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) this.init();

    this.providers.forEach((provider) => {
      try {
        provider.setUserProperties?.(properties);
      } catch (error) {
        console.warn('Failed to set user properties:', error);
      }
    });
  }

  /**
   * Flush pending events
   */
  async flush() {
    await Promise.all(
      this.providers.map((provider) => {
        try {
          return provider.flush?.();
        } catch (error) {
          console.warn('Failed to flush analytics:', error);
        }
      })
    );
  }

  /**
   * Add a custom provider
   */
  addProvider(provider: AnalyticsProvider) {
    this.providers.push(provider);
    if (this.initialized) {
      provider.init?.();
    }
  }
}

// Singleton instance
export const analytics = new Analytics();

// Initialize on client-side
if (typeof window !== 'undefined') {
  analytics.init();
}

// Export types
export type { AnalyticsProvider, AnalyticsProviderType, PageViewProperties, EventProperties, ErrorMetadata };
