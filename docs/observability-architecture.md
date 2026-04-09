# Observability Architecture

Comprehensive guide to the observability, analytics, error reporting, and monitoring infrastructure.

## Table of Contents

1. [Overview](#overview)
2. [Analytics Architecture](#analytics-architecture)
3. [Error Pipeline](#error-pipeline)
4. [Session Replay](#session-replay)
5. [Performance Instrumentation](#performance-instrumentation)
6. [Logging Specifications](#logging-specifications)
7. [Telemetry System](#telemetry-system)
8. [Configuration](#configuration)

## Overview

The observability system provides comprehensive monitoring, analytics, error tracking, and performance measurement across the entire front-end application. It's designed to be:

- **Provider-agnostic**: Works with multiple analytics and monitoring providers
- **Non-blocking**: Never blocks rendering or user interactions
- **Configurable**: Enabled/disabled via environment variables
- **Privacy-conscious**: Respects user preferences and regulations

## Analytics Architecture

### Abstraction Layer

The analytics system uses a unified abstraction layer (`/lib/analytics/index.ts`) that supports multiple providers simultaneously.

**Supported Providers:**

- Vercel Analytics (built-in)
- Google Analytics 4 (GA4)
- PostHog
- Custom endpoint
- Multiple providers simultaneously

### Provider Configuration

Providers are configured via environment variables:

```bash
# Comma-separated list of providers
NEXT_PUBLIC_ANALYTICS_PROVIDERS=vercel,ga4

# GA4 Configuration
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Custom Analytics Endpoint
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://api.example.com/analytics
NEXT_PUBLIC_ANALYTICS_TOKEN=your-token
```

### Usage

```typescript
import { analytics } from "@/lib/analytics";

// Track page view
analytics.trackPageView("/dashboard", {
  title: "Dashboard",
  referrer: document.referrer,
});

// Track custom event
analytics.trackEvent("button_click", {
  button_name: "Sign Up",
  location: "header",
});

// Track error
analytics.trackError(error, {
  component: "CheckoutForm",
  user_id: "123",
});

// Identify user
analytics.identify("user-123", {
  email: "user@example.com",
  plan: "pro",
});
```

## Error Pipeline

### Error Boundaries

Multiple layers of error boundaries catch errors at different levels:

1. **Global Error Handler** (`/app/global-error.tsx`)
   - Catches errors in root layout
   - Last resort error handler

2. **Route Error Handler** (`/app/error.tsx`)
   - Catches errors in route segments
   - Provides reset functionality

3. **Component Error Boundary** (`/components/ui/error-boundary.tsx`)
   - Wraps specific components
   - Provides component-level error recovery

### Error Reporting

Errors are automatically:

1. Logged via the logging system
2. Tracked in analytics
3. Sent to diagnostics system
4. Optionally sent to Sentry (if configured)

### Sentry Integration

Sentry provides advanced error tracking and monitoring:

```bash
NEXT_PUBLIC_ENABLE_SENTRY=true
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Features:**

- Error tracking with stack traces
- Session replay for errors
- Performance monitoring
- User context tracking

## Session Replay

### Supported Providers

- **Hotjar**: Heatmaps and session recordings
- **FullStory**: Advanced session replay
- **Microsoft Clarity**: Free session replay

### Configuration

```bash
# Enable session replay
NEXT_PUBLIC_ENABLE_SESSION_REPLAY=true

# Provider selection
NEXT_PUBLIC_SESSION_REPLAY_PROVIDER=hotjar

# Provider-specific configuration
NEXT_PUBLIC_SESSION_REPLAY_SITE_ID=1234567
```

### Privacy Considerations

- Session replay is opt-in via environment variable
- User identification is optional
- Respects user privacy preferences
- Can be disabled per user via consent management

## Performance Instrumentation

### Web Vitals

Automatically tracks Core Web Vitals:

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **INP** (Interaction to Next Paint)
- **TTFB** (Time to First Byte)

### Route Transition Metrics

Tracks:

- Route transition duration
- Hydration time
- Bundle load time
- Client-side navigation performance

### Usage

Web Vitals are automatically collected and sent to analytics. No manual tracking required.

For Next.js, use the `reportWebVitals` function:

```typescript
import { reportWebVitals } from "@/lib/performance/web-vitals";

export function onPerfEntry(metric: any) {
  reportWebVitals(metric);
}
```

## Logging Specifications

### Log Levels

- **debug**: Development-only detailed information
- **info**: General informational messages
- **warn**: Warning messages that don't break functionality
- **error**: Error messages that indicate problems
- **critical**: Critical errors that require immediate attention

### Log Outputs

Logs are sent to:

1. Console (development or when `NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true`)
2. Analytics (for errors and critical issues)
3. Custom endpoint (if `NEXT_PUBLIC_LOGGING_ENDPOINT` configured)
4. Vercel Edge logs (production)

### Usage

```typescript
import { logger } from "@/lib/logging/logger";

logger.debug("Debug message", { context: "value" });
logger.info("Info message", { userId: "123" });
logger.warn("Warning message", { issue: "slow-api" });
logger.error("Error message", error, { component: "Form" });
logger.critical("Critical error", error, { system: "payment" });
```

## Telemetry System

### Event Types

The telemetry system tracks:

- **button_click**: Button interactions
- **cta_click**: Call-to-action clicks
- **scroll_depth**: Scroll depth milestones (25%, 50%, 75%, 100%)
- **form_start**: Form interaction started
- **form_abandon**: Form abandoned before completion
- **form_submit**: Form submitted (success/failure)
- **funnel_step**: Funnel progression
- **conversion**: Conversion events
- **dead_click**: Clicks that don't trigger actions
- **rage_click**: Multiple rapid clicks (frustration indicator)

### Usage

```typescript
import { telemetry } from '@/lib/telemetry/events';
import { useTrackCTA, useTrackForm } from '@/lib/telemetry/hooks';

// Direct usage
telemetry.trackCTAClick('Sign Up', { location: 'header' });

// React hooks
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

## Diagnostics

### Automatic Diagnostics

The diagnostics system automatically tracks:

- **Fetch failures**: Failed API requests
- **Component errors**: Component load failures
- **Hydration errors**: React hydration mismatches
- **Layout shifts**: CLS violations
- **Slow responses**: API responses exceeding thresholds

### Usage

```typescript
import { diagnostics } from "@/lib/diagnostics";

// Get recent events
const events = diagnostics.getEvents("fetch_failure");

// Clear events
diagnostics.clear();
```

## Configuration

### Environment Variables

```bash
# Analytics
NEXT_PUBLIC_ANALYTICS_PROVIDERS=vercel,ga4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://api.example.com/analytics
NEXT_PUBLIC_ANALYTICS_TOKEN=your-token

# Error Reporting
NEXT_PUBLIC_ENABLE_SENTRY=true
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Session Replay
NEXT_PUBLIC_ENABLE_SESSION_REPLAY=true
NEXT_PUBLIC_SESSION_REPLAY_PROVIDER=hotjar
NEXT_PUBLIC_SESSION_REPLAY_SITE_ID=1234567

# Logging
NEXT_PUBLIC_ENABLE_LOGGING=true
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=false
NEXT_PUBLIC_LOGGING_ENDPOINT=https://api.example.com/logs
```

## Best Practices

1. **Always use the abstraction layer** - Don't call providers directly
2. **Track meaningful events** - Focus on user actions and business metrics
3. **Respect user privacy** - Don't track PII without consent
4. **Handle errors gracefully** - Always provide fallbacks
5. **Monitor performance** - Watch for slow operations
6. **Test error scenarios** - Ensure errors are properly tracked
7. **Review logs regularly** - Identify patterns and issues

## Troubleshooting

### Analytics not tracking

1. Check provider configuration in environment variables
2. Verify provider initialization in browser console
3. Check network tab for failed requests
4. Ensure analytics.init() is called

### Errors not being reported

1. Check error boundary placement
2. Verify Sentry configuration (if enabled)
3. Check console for error messages
4. Review diagnostics.getEvents()

### Performance metrics missing

1. Verify Web Vitals initialization
2. Check browser support for PerformanceObserver
3. Review route metrics collection
4. Check analytics events for web_vital events
