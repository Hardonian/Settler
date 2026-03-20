/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for server-side error tracking.
 * It's loaded by @sentry/nextjs during webpack build.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Dynamic DSN - will use env var if available
  dsn: process.env.SENTRY_DSN || undefined,

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",

  // Performance monitoring sample rate (0-1)
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Server-side integrations
  integrations: [
    // Enable HTTP tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Filter out non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore certain server-specific errors
      if (error.message.includes("Connection refused")) {
        return null;
      }
    }
    return event;
  },
});
