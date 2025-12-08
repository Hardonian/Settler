/**
 * Google Analytics 4 Provider
 * 
 * Integration with Google Analytics 4 (gtag)
 */

import type { AnalyticsProvider } from '../types';

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set' | 'js',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

class GA4Provider implements AnalyticsProvider {
  private measurementId: string;
  private initialized = false;

  constructor(measurementId?: string) {
    this.measurementId = measurementId || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
  }

  init() {
    if (typeof window === 'undefined' || !this.measurementId) return;
    if (this.initialized) return;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      page_path: window.location.pathname,
    });

    this.initialized = true;
  }

  trackPageView(route: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'page_view', {
      page_path: route,
      page_title: properties?.title || document.title,
      ...properties,
    });
  }

  trackEvent(name: string, payload?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', name, payload || {});
  }

  trackError(error: Error | string, metadata?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    window.gtag('event', 'exception', {
      description: errorMessage,
      fatal: false,
      ...metadata,
    });
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('set', 'user_id', userId);
    if (traits) {
      window.gtag('set', 'user_properties', traits);
    }
  }

  setUserProperties(properties: Record<string, any>) {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('set', 'user_properties', properties);
  }
}

export const createGA4Provider = (measurementId?: string): GA4Provider => {
  return new GA4Provider(measurementId);
};
