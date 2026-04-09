/**
 * Analytics Types
 *
 * Type definitions for the analytics abstraction layer.
 */

export interface AnalyticsProvider {
  /**
   * Track a page view
   */
  trackPageView: (route: string, properties?: Record<string, any>) => void | Promise<void>;

  /**
   * Track a custom event
   */
  trackEvent: (name: string, payload?: Record<string, any>) => void | Promise<void>;

  /**
   * Track an error
   */
  trackError: (error: Error | string, metadata?: Record<string, any>) => void | Promise<void>;

  /**
   * Identify a user
   */
  identify?: (userId: string, traits?: Record<string, any>) => void | Promise<void>;

  /**
   * Set user properties
   */
  setUserProperties?: (properties: Record<string, any>) => void | Promise<void>;

  /**
   * Flush pending events (where supported)
   */
  flush?: () => void | Promise<void>;

  /**
   * Initialize the provider
   */
  init?: () => void | Promise<void>;
}

export interface PageViewProperties {
  title?: string;
  path?: string;
  referrer?: string;
  search?: string;
  url?: string;
  [key: string]: any;
}

export interface EventProperties {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export interface ErrorMetadata {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

export type AnalyticsProviderType =
  | "vercel"
  | "ga4"
  | "posthog"
  | "mixpanel"
  | "segment"
  | "custom"
  | "none";
