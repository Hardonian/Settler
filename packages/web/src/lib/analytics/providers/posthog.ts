/**
 * PostHog Analytics Provider
 * 
 * Integration with PostHog
 */

import type { AnalyticsProvider } from '../types';

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
      identify: (userId: string, properties?: Record<string, any>) => void;
      reset: () => void;
      isFeatureEnabled: (key: string) => boolean;
      onFeatureFlags: (callback: () => void) => void;
    };
  }
}

class PostHogProvider implements AnalyticsProvider {
  private apiKey: string;
  private apiHost: string;
  private initialized = false;

  constructor(apiKey?: string, apiHost?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
    this.apiHost = apiHost || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  }

  init() {
    if (typeof window === 'undefined' || !this.apiKey) return;
    if (this.initialized) return;

    // Load PostHog script
    const script = document.createElement('script');
    script.async = true;
    script.innerHTML = `
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${this.apiKey}',{api_host:'${this.apiHost}'})
    `;
    document.head.appendChild(script);

    this.initialized = true;
  }

  trackPageView(route: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.posthog) return;
    
    window.posthog.capture('$pageview', {
      $current_url: route,
      ...properties,
    });
  }

  trackEvent(name: string, payload?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.posthog) return;
    
    window.posthog.capture(name, payload || {});
  }

  trackError(error: Error | string, metadata?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.posthog) return;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    window.posthog.capture('$exception', {
      $exception_message: errorMessage,
      $exception_stack: errorStack,
      ...metadata,
    });
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.posthog) return;
    
    window.posthog.identify(userId, traits);
  }

  setUserProperties(properties: Record<string, any>) {
    if (typeof window === 'undefined' || !window.posthog) return;
    
    // PostHog uses identify for setting user properties
    if (window.posthog.identify) {
      window.posthog.identify(undefined, properties);
    }
  }

  flush() {
    // PostHog handles flushing automatically
  }
}

export const createPostHogProvider = (apiKey?: string, apiHost?: string): PostHogProvider => {
  return new PostHogProvider(apiKey, apiHost);
};
