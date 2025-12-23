/**
 * Analytics Tracking
 * 
 * Unified analytics interface for GTM events.
 * Abstracts over multiple providers (GA4, PostHog, etc.)
 */

let analyticsProvider: {
  trackEvent: (name: string, properties?: Record<string, unknown>) => void;
  trackPageView: (path: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
} | null = null;

/**
 * Initialize analytics provider
 */
export async function initAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Try GA4 first
    const { createGA4Provider } = await import('@/lib/analytics/providers/ga4');
    const provider = createGA4Provider();
    provider.init();
    
    analyticsProvider = {
      trackEvent: (name, properties) => provider.trackEvent(name, properties),
      trackPageView: (path, properties) => provider.trackPageView(path, properties),
      identify: (userId, traits) => provider.identify(userId, traits),
    };
  } catch (error) {
    console.warn('[Analytics] Failed to initialize:', error);
  }
}

/**
 * Track an event
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  
  if (!analyticsProvider) {
    initAnalytics().catch(console.error);
    return;
  }

  try {
    analyticsProvider.trackEvent(name, properties);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(
  path: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  
  if (!analyticsProvider) {
    initAnalytics().catch(console.error);
    return;
  }

  try {
    analyticsProvider.trackPageView(path, properties);
  } catch (error) {
    console.error('[Analytics] Failed to track page view:', error);
  }
}

/**
 * Identify user
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  
  if (!analyticsProvider) {
    initAnalytics().catch(console.error);
    return;
  }

  try {
    analyticsProvider.identify(userId, traits);
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
}
