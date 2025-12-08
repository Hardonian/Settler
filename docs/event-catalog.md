# Event Catalog

Canonical list of all trackable events in the application.

## Table of Contents

1. [Page View Events](#page-view-events)
2. [User Interaction Events](#user-interaction-events)
3. [Form Events](#form-events)
4. [Error Events](#error-events)
5. [Performance Events](#performance-events)
6. [Conversion Events](#conversion-events)
7. [Diagnostic Events](#diagnostic-events)

## Page View Events

### `page_view`

**When:** User navigates to a new page  
**Providers:** All analytics providers  
**Properties:**
- `route` (string): Current route path
- `title` (string): Page title
- `referrer` (string): Referrer URL
- `url` (string): Full URL

**Example:**
```typescript
analytics.trackPageView('/dashboard', {
  title: 'Dashboard',
  referrer: 'https://google.com',
});
```

## User Interaction Events

### `button_click`

**When:** User clicks a button  
**Providers:** All analytics providers  
**Properties:**
- `button_name` (string): Button identifier or text
- `variant` (string): Button variant (optional)
- `size` (string): Button size (optional)
- `location` (string): Where the button is located (optional)

**Example:**
```typescript
telemetry.trackButtonClick('Sign Up', {
  variant: 'primary',
  location: 'header',
});
```

### `cta_click`

**When:** User clicks a call-to-action  
**Providers:** All analytics providers  
**Properties:**
- `cta_name` (string): CTA identifier
- `location` (string): Where the CTA is located
- `variant` (string): CTA variant (optional)

**Example:**
```typescript
telemetry.trackCTAClick('Start Free Trial', {
  location: 'hero',
  variant: 'gradient',
});
```

### `link_click`

**When:** User clicks a link  
**Providers:** All analytics providers  
**Properties:**
- `url` (string): Link URL
- `link_text` (string): Link text (optional)
- `location` (string): Where the link is located (optional)

**Example:**
```typescript
telemetry.trackLinkClick('/pricing', 'View Pricing', {
  location: 'navigation',
});
```

### `scroll_depth`

**When:** User scrolls to milestone depths  
**Providers:** All analytics providers  
**Properties:**
- `depth` (number): Scroll depth percentage (25, 50, 75, 100)
- `percentage` (number): Same as depth

**Example:**
```typescript
// Automatically tracked
telemetry.trackScrollDepth(50); // Tracks at 25%, 50%, 75%, 100%
```

### `dead_click`

**When:** User clicks on non-interactive element  
**Providers:** All analytics providers  
**Properties:**
- `element` (string): Element tag name
- `x` (number): Click X coordinate
- `y` (number): Click Y coordinate
- `url` (string): Current URL

**Example:**
```typescript
// Automatically tracked
telemetry.trackDeadClick(element, x, y);
```

### `rage_click`

**When:** User clicks rapidly multiple times  
**Providers:** All analytics providers  
**Properties:**
- `element` (string): Element tag name
- `click_count` (number): Number of rapid clicks
- `url` (string): Current URL

**Example:**
```typescript
// Automatically tracked
telemetry.trackRageClick(element, 5);
```

### `search`

**When:** User performs a search  
**Providers:** All analytics providers  
**Properties:**
- `query` (string): Search query
- `results_count` (number): Number of results (optional)

**Example:**
```typescript
telemetry.trackSearch('reconciliation API', 42);
```

## Form Events

### `form_start`

**When:** User starts interacting with a form  
**Providers:** All analytics providers  
**Properties:**
- `form_name` (string): Form identifier

**Example:**
```typescript
const { start } = useTrackForm('checkout');
start();
```

### `form_abandon`

**When:** User abandons a form before completion  
**Providers:** All analytics providers  
**Properties:**
- `form_name` (string): Form identifier
- `duration` (number): Time spent on form (ms)
- `fields_completed` (number): Number of fields completed
- `total_fields` (number): Total number of fields
- `completion_rate` (number): Completion percentage

**Example:**
```typescript
const { abandon } = useTrackForm('checkout');
abandon(3, 5); // 3 of 5 fields completed
```

### `form_submit`

**When:** User submits a form  
**Providers:** All analytics providers  
**Properties:**
- `form_name` (string): Form identifier
- `success` (boolean): Whether submission was successful
- `duration` (number): Time spent on form (ms)
- Additional form-specific properties

**Example:**
```typescript
const { submit } = useTrackForm('checkout');
submit(true, {
  order_id: '12345',
  total: 99.99,
});
```

## Error Events

### `error`

**When:** An error occurs  
**Providers:** All analytics providers, Sentry  
**Properties:**
- `message` (string): Error message
- `stack` (string): Error stack trace (optional)
- `component` (string): Component where error occurred (optional)
- `type` (string): Error type (optional)
- `url` (string): URL where error occurred
- `userAgent` (string): User agent string
- `timestamp` (string): ISO timestamp

**Example:**
```typescript
analytics.trackError(error, {
  component: 'CheckoutForm',
  type: 'validation_error',
});
```

### `exception` (GA4)

**When:** An exception occurs (GA4 specific)  
**Providers:** Google Analytics 4  
**Properties:**
- `description` (string): Error description
- `fatal` (boolean): Whether error is fatal

## Performance Events

### `web_vital`

**When:** A Web Vital metric is measured  
**Providers:** All analytics providers  
**Properties:**
- `name` (string): Metric name (LCP, FID, CLS, INP, TTFB)
- `value` (number): Metric value in milliseconds
- `rating` (string): 'good', 'needs-improvement', or 'poor'
- `delta` (number): Change from previous measurement
- `navigationType` (string): Navigation type (optional)
- `id` (string): Unique identifier

**Example:**
```typescript
// Automatically tracked
reportWebVital({
  name: 'LCP',
  value: 2500,
  rating: 'good',
  delta: 2500,
  id: 'lcp-1',
});
```

### `route_transition`

**When:** Route transition completes  
**Providers:** All analytics providers  
**Properties:**
- `route` (string): Route path
- `duration` (number): Transition duration in milliseconds

**Example:**
```typescript
// Automatically tracked
routeMetrics.endTransition('/dashboard');
```

### `route_hydration`

**When:** Route hydration completes  
**Providers:** All analytics providers  
**Properties:**
- `route` (string): Route path
- `duration` (number): Hydration duration in milliseconds

**Example:**
```typescript
// Automatically tracked
routeMetrics.endHydration('/dashboard');
```

### `bundle_load`

**When:** JavaScript bundle loads  
**Providers:** All analytics providers  
**Properties:**
- `route` (string): Route path
- `duration` (number): Load duration in milliseconds

**Example:**
```typescript
// Automatically tracked
routeMetrics.trackBundleLoad('/dashboard', startTime, endTime);
```

### `layout_shift`

**When:** Layout shift detected  
**Providers:** All analytics providers  
**Properties:**
- `shift` (number): CLS value
- `element` (string): Element causing shift (optional)

**Example:**
```typescript
// Automatically tracked
diagnostics.trackLayoutShift(0.15, 'image');
```

### `slow_response`

**When:** API response exceeds threshold  
**Providers:** All analytics providers  
**Properties:**
- `url` (string): API endpoint URL
- `duration` (number): Response duration in milliseconds
- `threshold` (number): Threshold that was exceeded

**Example:**
```typescript
// Automatically tracked
diagnostics.trackSlowResponse('/api/data', 1500, 1000);
```

## Conversion Events

### `conversion`

**When:** A conversion occurs  
**Providers:** All analytics providers  
**Properties:**
- `conversion_name` (string): Conversion identifier
- `value` (number): Conversion value (optional)
- Additional conversion-specific properties

**Example:**
```typescript
telemetry.trackConversion('signup', 0, {
  plan: 'pro',
  source: 'landing_page',
});
```

### `funnel_step`

**When:** User progresses through a funnel  
**Providers:** All analytics providers  
**Properties:**
- `funnel` (string): Funnel name
- `step` (string): Step name
- `step_number` (number): Step number
- Additional step-specific properties

**Example:**
```typescript
const trackFunnel = useTrackFunnel('signup');
trackFunnel('email_entered', 1);
trackFunnel('password_created', 2);
trackFunnel('account_created', 3);
```

## Diagnostic Events

### `fetch_failure`

**When:** API request fails  
**Providers:** All analytics providers  
**Properties:**
- `url` (string): Failed URL
- `attempt` (number): Retry attempt number
- `duration` (number): Time before failure
- Error details

**Example:**
```typescript
// Automatically tracked
diagnostics.trackFetchFailure('/api/data', error, {
  attempt: 3,
  duration: 5000,
});
```

### `component_error`

**When:** Component fails to load  
**Providers:** All analytics providers  
**Properties:**
- `component` (string): Component name
- `componentStack` (string): React component stack
- Error details

**Example:**
```typescript
// Automatically tracked
diagnostics.trackComponentError('CheckoutForm', error, {
  componentStack: '...',
});
```

### `hydration_error`

**When:** React hydration fails  
**Providers:** All analytics providers  
**Properties:**
- Error details
- Component information

**Example:**
```typescript
// Automatically tracked
diagnostics.trackHydrationError(error, {
  component: 'Dashboard',
});
```

## Event Provider Mapping

| Event Type | Vercel | GA4 | PostHog | Sentry | Custom |
|------------|--------|-----|---------|--------|--------|
| page_view | ✅ | ✅ | ✅ | ❌ | ✅ |
| button_click | ✅ | ✅ | ✅ | ❌ | ✅ |
| cta_click | ✅ | ✅ | ✅ | ❌ | ✅ |
| form_* | ✅ | ✅ | ✅ | ❌ | ✅ |
| error | ✅ | ✅ | ✅ | ✅ | ✅ |
| web_vital | ✅ | ✅ | ✅ | ❌ | ✅ |
| conversion | ✅ | ✅ | ✅ | ❌ | ✅ |
| diagnostic | ✅ | ✅ | ✅ | ✅ | ✅ |

## Best Practices

1. **Use consistent event names** - Follow naming conventions
2. **Include relevant context** - Add properties that help analysis
3. **Don't track PII** - Avoid tracking personally identifiable information
4. **Track meaningful events** - Focus on business value
5. **Test event tracking** - Verify events fire correctly
6. **Monitor event volume** - Watch for excessive event generation

## Event Naming Conventions

- Use snake_case for event names
- Be descriptive but concise
- Group related events with prefixes (e.g., `form_*`)
- Use consistent terminology across events
- Document custom events in this catalog
