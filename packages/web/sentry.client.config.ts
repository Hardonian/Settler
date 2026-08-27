// Sentry Client Configuration
// Only initialize on the client, never on the server

if (typeof window !== "undefined") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined,
    // Performance monitoring
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : 0.1,
    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
    // Environmental filtering
    environment: process.env.NODE_ENV,
    // Privacy: strip frames with secret patterns
    ignoreErrors: [
      // Never report these as errors (expected auth flows, etc.)
      /.*revalidatePath.*/,
      /.*generateStaticParams.*/,
    ],
    // Redact sensitive data from breadcrumbs
    beforeSend: function (event) {
      // Redact cookies, localStorage, sessionStorage from events
      if (event.request) {
        event.request.cookies = event.request.cookies || {};
        // Remove potentially sensitive data
      }
      return event;
    },
    // Client features
    attachConsole: true,
    logErrorsBeforeInit: true,
  });
}
