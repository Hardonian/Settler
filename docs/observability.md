# Observability System

Complete observability, analytics, error reporting, and monitoring infrastructure.

## Quick Start

```typescript
import { analytics, logger, telemetry } from '@/lib/observability';

// Track page view
analytics.trackPageView('/dashboard');

// Track event
analytics.trackEvent('button_click', { button_name: 'Sign Up' });

// Log message
logger.info('User logged in', { userId: '123' });

// Track CTA
telemetry.trackCTAClick('Sign Up', { location: 'header' });
```

## Features

- ✅ Multi-provider analytics (Vercel, GA4, PostHog, Custom)
- ✅ Comprehensive error tracking (Sentry integration)
- ✅ Performance monitoring (Web Vitals, route metrics)
- ✅ Session replay (Hotjar, FullStory, Clarity)
- ✅ Production logging with diagnostics
- ✅ UX telemetry (clicks, scrolls, forms, conversions)
- ✅ Defensive API client with retries
- ✅ Graceful error fallbacks

## Documentation

- [Observability Architecture](/docs/observability-architecture.md)
- [Event Catalog](/docs/event-catalog.md)
- [Diagnostics Playbook](/docs/diagnostics-playbook.md)
