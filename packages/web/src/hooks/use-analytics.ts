/**
 * Analytics Hook
 * 
 * React hook for tracking analytics events.
 */

import { useCallback } from 'react';
import { analytics } from '@/lib/analytics';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Hook to track page views automatically
 */
export function usePageView(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname, {
        title: document.title,
        referrer: document.referrer,
      });
    }
  }, [pathname]);
}

/**
 * Hook for tracking custom events
 */
export function useAnalytics(): {
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  trackError: (error: Error | string, metadata?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
} {
  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    analytics.trackEvent(name, properties);
  }, []);

  const trackError = useCallback((error: Error | string, metadata?: Record<string, any>) => {
    analytics.trackError(error, metadata);
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    analytics.identify(userId, traits);
  }, []);

  return {
    trackEvent,
    trackError,
    identify,
  };
}
