/**
 * Vercel Analytics Provider
 * 
 * Integration with @vercel/analytics
 */

import type { AnalyticsProvider } from '../types';

class VercelAnalyticsProvider implements AnalyticsProvider {
  init() {
    if (typeof window === 'undefined') return;
    
    // Vercel Analytics is initialized via the Analytics component in layout
    // This provider just wraps the API
  }

  trackPageView(route: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined') return;
    
    // Vercel Analytics automatically tracks page views via the Analytics component
    // For custom page view tracking, we can use the track function
    if (properties && typeof window !== 'undefined' && 'va' in window) {
      try {
        // @ts-ignore - Vercel Analytics global
        window.va?.('track', {
          name: 'page_view',
          properties: {
            route,
            ...properties,
          },
        });
      } catch (error) {
        // Silently fail if va is not available
      }
    }
  }

  trackEvent(name: string, payload?: Record<string, any>) {
    if (typeof window === 'undefined') return;
    
    if (typeof window !== 'undefined' && 'va' in window) {
      // @ts-ignore - Vercel Analytics global
      window.va?.('track', {
        name,
        properties: payload || {},
      });
    }
  }

  trackError(error: Error | string, metadata?: Record<string, any>) {
    if (typeof window === 'undefined') return;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    if (typeof window !== 'undefined' && 'va' in window) {
      // @ts-ignore - Vercel Analytics global
      window.va?.('track', {
        name: 'error',
        properties: {
          message: errorMessage,
          stack: errorStack,
          ...metadata,
        },
      });
    }
  }

  flush() {
    // Vercel Analytics handles flushing automatically
  }
}

export const vercelProvider = new VercelAnalyticsProvider();
