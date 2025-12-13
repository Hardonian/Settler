/**
 * Next.js Instrumentation
 * 
 * Initializes observability tools and performance monitoring.
 */

export async function register(): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side initialization
    return;
  }

  // Initialize analytics
  const { analytics } = await import('@/lib/analytics');
  analytics.init();

  // Initialize session replay
  const { sessionReplay } = await import('@/lib/session/session-replay');
  sessionReplay.init();

  // Initialize Web Vitals
  const { initWebVitals } = await import('@/lib/performance/web-vitals');
  initWebVitals();

  // Initialize Sentry if enabled
  const { initSentry } = await import('@/lib/monitoring/sentry');
  await initSentry();
}
