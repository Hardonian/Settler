# Observability Quick Start

Quick reference guide for using the observability system.

## Setup

1. **Configure Environment Variables**

Add to `.env.local`:

```bash
# Enable analytics providers
NEXT_PUBLIC_ANALYTICS_PROVIDERS=vercel,ga4

# Optional: Add GA4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Enable Sentry
NEXT_PUBLIC_ENABLE_SENTRY=true
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional: Enable session replay
NEXT_PUBLIC_ENABLE_SESSION_REPLAY=true
NEXT_PUBLIC_SESSION_REPLAY_PROVIDER=hotjar
NEXT_PUBLIC_SESSION_REPLAY_SITE_ID=1234567
```

2. **Import and Use**

```typescript
import { analytics, logger, telemetry } from "@/lib/observability";
```

## Common Patterns

### Track Page Views

```typescript
import { usePageView } from '@/hooks/use-analytics';

function MyPage() {
  usePageView(); // Automatically tracks page views
  return <div>...</div>;
}
```

### Track Events

```typescript
import { analytics } from "@/lib/analytics";

analytics.trackEvent("button_click", {
  button_name: "Sign Up",
  location: "header",
});
```

### Track Errors

```typescript
import { analytics } from "@/lib/analytics";

try {
  // ... code
} catch (error) {
  analytics.trackError(error, {
    component: "CheckoutForm",
    action: "submit",
  });
}
```

### Use Telemetry Hooks

```typescript
import { useTrackCTA, useTrackForm } from '@/lib/telemetry/hooks';

function MyComponent() {
  const trackCTA = useTrackCTA();
  const { start, submit } = useTrackForm('checkout');

  return (
    <button onClick={() => trackCTA('Sign Up')}>
      Sign Up
    </button>
  );
}
```

### Defensive API Calls

```typescript
import { defensiveFetch, fetchJSON, fetchWithFallback } from "@/lib/api/client";

// With retries
const response = await defensiveFetch("/api/data", {
  retries: 3,
  timeout: 5000,
});

// With fallback
const data = await fetchWithFallback("/api/data", defaultData);
```

### Error Boundaries

```typescript
import { ErrorBoundary } from '@/components/ui/error-boundary';

<ErrorBoundary componentName="MyComponent">
  <MyComponent />
</ErrorBoundary>
```

### Logging

```typescript
import { logger } from "@/lib/logging/logger";

logger.debug("Debug message", { context: "value" });
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message", error);
logger.critical("Critical error", error);
```

## Automatic Tracking

The following are tracked automatically:

- ✅ Page views (via template.tsx)
- ✅ Web Vitals (via report-web-vitals.ts)
- ✅ Route transitions
- ✅ Scroll depth
- ✅ Dead clicks
- ✅ Rage clicks
- ✅ Layout shifts
- ✅ Slow API responses
- ✅ Fetch failures

## Next Steps

- Read [Observability Architecture](/docs/observability-architecture.md) for detailed information
- Check [Event Catalog](/docs/event-catalog.md) for all trackable events
- Review [Diagnostics Playbook](/docs/diagnostics-playbook.md) for debugging
