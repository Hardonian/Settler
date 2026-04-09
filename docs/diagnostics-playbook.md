# Diagnostics Playbook

Developer guide for debugging, tracing errors, reading logs, interpreting performance metrics, and verifying analytics.

## Table of Contents

1. [Debugging Workflow](#debugging-workflow)
2. [Error Tracing](#error-tracing)
3. [Reading Logs](#reading-logs)
4. [Interpreting Performance Metrics](#interpreting-performance-metrics)
5. [Verifying Analytics](#verifying-analytics)
6. [Common Issues](#common-issues)
7. [Tools & Utilities](#tools--utilities)

## Debugging Workflow

### 1. Identify the Issue

**Symptoms to look for:**

- User reports error
- Analytics shows error spike
- Performance degradation
- Missing data or broken UI

**First steps:**

1. Check browser console for errors
2. Review Sentry (if enabled) for error reports
3. Check analytics for error events
4. Review diagnostics events

### 2. Gather Context

**Information to collect:**

- Error message and stack trace
- User ID (if available)
- Session ID
- URL where error occurred
- Browser and device information
- Steps to reproduce

**Tools:**

```typescript
import { diagnostics } from "@/lib/diagnostics";
import { logger } from "@/lib/logging/logger";

// Get recent diagnostic events
const events = diagnostics.getEvents("fetch_failure");
console.log("Recent fetch failures:", events);

// Check logs
logger.info("Debug context", {
  userId: "123",
  sessionId: "abc",
  url: window.location.href,
});
```

### 3. Trace the Error

**Error boundary logs:**

- Check component error boundaries
- Review error.tsx and global-error.tsx logs
- Check Sentry for full error context

**API errors:**

- Review fetch failure diagnostics
- Check network tab for failed requests
- Review retry attempts

**Component errors:**

- Check component error diagnostics
- Review React DevTools
- Check hydration errors

## Error Tracing

### Finding Error Sources

**1. Check Error Boundaries**

```typescript
// Component-level errors
import { ErrorBoundary } from '@/components/ui/error-boundary';

<ErrorBoundary componentName="CheckoutForm">
  <CheckoutForm />
</ErrorBoundary>
```

**2. Review Sentry (if enabled)**

- Navigate to Sentry dashboard
- Filter by error type, component, or user
- Review breadcrumbs and context
- Check error frequency and trends

**3. Check Diagnostics**

```typescript
import { diagnostics } from "@/lib/diagnostics";

// Get all errors
const errors = diagnostics.getEvents();

// Filter by type
const fetchErrors = diagnostics.getEvents("fetch_failure");
const componentErrors = diagnostics.getEvents("component_error");
const hydrationErrors = diagnostics.getEvents("hydration_error");
```

### Error Types

**Fetch Failures:**

- Check network connectivity
- Verify API endpoint is accessible
- Review retry attempts
- Check timeout settings

**Component Errors:**

- Review component code
- Check props and state
- Verify dependencies
- Review React DevTools

**Hydration Errors:**

- Check server/client mismatch
- Review HTML structure
- Verify data serialization
- Check for browser-specific issues

## Reading Logs

### Log Levels

**Debug:**

- Development-only detailed information
- Component lifecycle events
- API request/response details
- Performance measurements

**Info:**

- General application flow
- User actions
- Successful operations
- State changes

**Warn:**

- Non-critical issues
- Deprecated features
- Performance warnings
- Slow operations

**Error:**

- Failed operations
- API errors
- Component errors
- User-facing errors

**Critical:**

- System failures
- Data loss risks
- Security issues
- Payment failures

### Log Locations

**Development:**

- Browser console (always)
- Network tab (API requests)
- React DevTools (component state)

**Production:**

- Vercel Edge logs
- Sentry (if enabled)
- Custom logging endpoint
- Analytics error events

### Log Format

```typescript
{
  level: 'error',
  message: 'API request failed',
  timestamp: '2024-01-01T12:00:00.000Z',
  context: {
    url: '/api/data',
    method: 'GET',
    status: 500,
  },
  error: {
    name: 'Error',
    message: 'Internal Server Error',
    stack: '...',
  },
  userId: 'user-123',
  sessionId: 'session-abc',
  url: 'https://app.example.com/dashboard',
  userAgent: 'Mozilla/5.0...',
}
```

## Interpreting Performance Metrics

### Web Vitals

**LCP (Largest Contentful Paint):**

- **Good:** ≤ 2.5s
- **Needs Improvement:** 2.5s - 4.0s
- **Poor:** > 4.0s

**FID (First Input Delay):**

- **Good:** ≤ 100ms
- **Needs Improvement:** 100ms - 300ms
- **Poor:** > 300ms

**CLS (Cumulative Layout Shift):**

- **Good:** ≤ 0.1
- **Needs Improvement:** 0.1 - 0.25
- **Poor:** > 0.25

**INP (Interaction to Next Paint):**

- **Good:** ≤ 200ms
- **Needs Improvement:** 200ms - 500ms
- **Poor:** > 500ms

**TTFB (Time to First Byte):**

- **Good:** ≤ 800ms
- **Needs Improvement:** 800ms - 1.8s
- **Poor:** > 1.8s

### Route Metrics

**Transition Duration:**

- Target: < 200ms
- Acceptable: < 500ms
- Slow: > 500ms

**Hydration Time:**

- Target: < 100ms
- Acceptable: < 300ms
- Slow: > 300ms

**Bundle Load Time:**

- Target: < 1s
- Acceptable: < 2s
- Slow: > 2s

### Performance Analysis

**Check analytics for web_vital events:**

```typescript
// In analytics dashboard, filter by:
event_name = "web_vital";
rating = "poor";
```

**Review route metrics:**

```typescript
import { routeMetrics } from "@/lib/performance/route-metrics";

const metrics = routeMetrics.getMetrics("/dashboard");
console.log("Route metrics:", metrics);
```

## Verifying Analytics

### Testing Event Tracking

**1. Enable Development Logging**

```bash
NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

**2. Check Browser Console**

All events should log to console in development:

```
[DEBUG] Telemetry: button_click - Sign Up { variant: 'primary', location: 'header' }
[INFO] Web Vital: LCP { value: 2500, rating: 'good' }
```

**3. Verify in Analytics Dashboard**

- **Vercel Analytics:** Check Vercel dashboard
- **GA4:** Check Real-time reports
- **PostHog:** Check Live events

**4. Use Network Tab**

- Filter by analytics provider domains
- Check for failed requests
- Verify payload structure

### Common Analytics Issues

**Events not firing:**

1. Check provider initialization
2. Verify environment variables
3. Check browser console for errors
4. Verify provider scripts loaded

**Events firing but not appearing:**

1. Check provider dashboard delay
2. Verify event names match
3. Check filters in dashboard
4. Verify user identification

**Duplicate events:**

1. Check for multiple provider instances
2. Verify single initialization
3. Check for event bubbling
4. Review component re-renders

## Common Issues

### Issue: Analytics Not Tracking

**Symptoms:**

- No events in analytics dashboard
- Console shows initialization errors

**Solutions:**

1. Check `NEXT_PUBLIC_ANALYTICS_PROVIDERS` environment variable
2. Verify provider credentials (API keys, measurement IDs)
3. Check browser console for errors
4. Verify analytics.init() is called
5. Check network tab for failed requests

### Issue: Errors Not Being Reported

**Symptoms:**

- Errors occur but don't appear in Sentry/analytics
- Error boundaries not catching errors

**Solutions:**

1. Verify error boundaries are properly placed
2. Check Sentry configuration (if enabled)
3. Verify error tracking in analytics
4. Check diagnostics.getEvents() for errors
5. Review error boundary logs

### Issue: Performance Metrics Missing

**Symptoms:**

- No Web Vitals in analytics
- Route metrics not tracking

**Solutions:**

1. Verify Web Vitals initialization
2. Check browser support for PerformanceObserver
3. Verify route metrics collection
4. Check analytics events for web_vital events
5. Review performance instrumentation setup

### Issue: Session Replay Not Working

**Symptoms:**

- No recordings in session replay tool
- Scripts not loading

**Solutions:**

1. Verify `NEXT_PUBLIC_ENABLE_SESSION_REPLAY=true`
2. Check provider configuration
3. Verify site ID/API key
4. Check browser console for script errors
5. Verify provider scripts in network tab

## Tools & Utilities

### Development Tools

**Browser Extensions:**

- React DevTools
- Redux DevTools (if using Redux)
- Vue DevTools (if using Vue)

**Browser Console:**

```typescript
// Access analytics instance
window.__analytics__ = analytics;

// Access diagnostics
window.__diagnostics__ = diagnostics;

// Access logger
window.__logger__ = logger;
```

### Debugging Utilities

**Check Analytics Status:**

```typescript
import { analytics } from "@/lib/analytics";

// Check if initialized
console.log("Analytics initialized:", analytics.initialized);

// Manually track event
analytics.trackEvent("debug_test", { test: true });
```

**Check Diagnostics:**

```typescript
import { diagnostics } from "@/lib/diagnostics";

// Get all events
const allEvents = diagnostics.getEvents();

// Get specific type
const fetchErrors = diagnostics.getEvents("fetch_failure");

// Clear events
diagnostics.clear();
```

**Check Logs:**

```typescript
import { logger } from "@/lib/logging/logger";

// Set user ID for context
logger.setUserId("user-123");

// Log debug info
logger.debug("Debug message", { context: "value" });
```

### Performance Monitoring

**Web Vitals:**

```typescript
import { reportWebVitals } from "@/lib/performance/web-vitals";

// In Next.js app
export function onPerfEntry(metric: any) {
  reportWebVitals(metric);
}
```

**Route Metrics:**

```typescript
import { routeMetrics } from "@/lib/performance/route-metrics";

// Get metrics for current route
const metrics = routeMetrics.getMetrics(window.location.pathname);
console.log("Route metrics:", metrics);
```

## Best Practices

1. **Always log errors** - Never let errors fail silently
2. **Include context** - Add relevant information to logs
3. **Monitor performance** - Watch for degradation
4. **Test error scenarios** - Verify error handling works
5. **Review analytics regularly** - Identify patterns and issues
6. **Use appropriate log levels** - Don't spam with debug logs
7. **Respect user privacy** - Don't log PII
8. **Document custom events** - Add to event catalog

## Getting Help

**Internal Resources:**

- Check `/docs/observability-architecture.md`
- Review `/docs/event-catalog.md`
- Check component error boundaries
- Review Sentry dashboard

**External Resources:**

- Provider documentation (Vercel, GA4, PostHog, Sentry)
- Next.js error handling docs
- Web Vitals documentation
- React error boundaries docs
