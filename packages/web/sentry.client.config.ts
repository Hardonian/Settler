/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for client-side error tracking.
 * It's loaded by @sentry/nextjs during webpack build.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Dynamic DSN - will use env var if available
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined,

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",

  // Performance monitoring sample rate (0-1)
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Replay configuration (if available)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Filter out non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore network errors
      if (error.message.includes("fetch") || error.message.includes("network")) {
        return null;
      }
      // Ignore cancelled requests
      if (error.message.includes("aborted") || error.message.includes("cancel")) {
        return null;
      }
    }
    return event;
  },

  // Ignore certain paths
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
  ],
});
