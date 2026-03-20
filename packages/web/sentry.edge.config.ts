/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for edge runtime error tracking.
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
});
