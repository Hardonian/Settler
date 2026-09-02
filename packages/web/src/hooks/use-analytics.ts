/**
 * Analytics Hook
 *
 * React hook for tracking analytics events and automatic page/CTA instrumentation.
 */

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { trackConversion } from "@/lib/analytics/conversion";

/**
 * Hook to track page views automatically
 */
export function usePageView(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname, {
        title: typeof document !== "undefined" ? document.title : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });
    }
  }, [pathname]);
}

/**
 * Global analytics runtime hook — initializes provider, tracks route changes,
 * and intercepts data-analytics / data-cta click events across the app.
 */
export function useGlobalAnalyticsTracker(): void {
  const pathname = usePathname();

  useEffect(() => {
    analytics.init();
  }, []);

  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname, {
        title: typeof document !== "undefined" ? document.title : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });
    }
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest(
        "[data-analytics], [data-cta]"
      ) as HTMLElement | null;

      if (!target) return;

      const eventName =
        target.getAttribute("data-analytics") ||
        `cta_click_${target.getAttribute("data-cta") || "unknown"}`;
      const ctaType = target.getAttribute("data-cta") || undefined;
      const href = target.getAttribute("href") || undefined;
      const text = target.textContent?.trim().slice(0, 60) || undefined;

      analytics.trackEvent(eventName, {
        cta: ctaType,
        href,
        text,
        path: window.location.pathname,
      });

      trackConversion(eventName, {
        cta: ctaType,
        href,
        text,
      }).catch(() => {});
    }

    document.addEventListener("click", handleClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);
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
