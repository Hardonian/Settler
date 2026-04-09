# Event Taxonomy

**Version:** 1.0  
**Last Updated:** Phase 7  
**Purpose:** Comprehensive catalog of product analytics events for tracking user behavior, funnels, and experiments.

---

## Overview

This document defines the standardized event taxonomy used across the Settler platform. All events follow a consistent structure with required and optional properties.

**Event Structure:**

```typescript
{
  event: string;           // Event name (required)
  userId?: string;         // User identifier (required when available)
  sessionId?: string;     // Session identifier
  timestamp: string;       // ISO 8601 timestamp
  route?: string;          // Current route/page
  properties?: {           // Event-specific properties
    // ... varies by event
  };
  experimentContext?: {    // Experiment context (if applicable)
    experimentKey: string;
    variant: string;
  };
}
```

---

## 1. Core Global Events

### `app_opened`

**Description:** User opens the application  
**When:** On initial app load or app resume  
**Properties:**

- `source`: 'web' | 'mobile' | 'api'
- `referrer`: string (optional)
- `userAgent`: string (optional)

**Example:**

```typescript
trackEvent("app_opened", {
  source: "web",
  referrer: "https://google.com",
});
```

### `page_view`

**Description:** User views a page  
**When:** On route change or page load  
**Properties:**

- `route`: string (required)
- `title`: string (optional)
- `referrer`: string (optional)
- `loadTime`: number (optional, milliseconds)

**Example:**

```typescript
trackEvent("page_view", {
  route: "/dashboard",
  title: "Dashboard",
});
```

### `session_started`

**Description:** User session begins  
**When:** On authentication or first interaction  
**Properties:**

- `sessionId`: string (required)
- `userId`: string (optional)
- `deviceType`: 'desktop' | 'mobile' | 'tablet'
- `browser`: string (optional)

**Example:**

```typescript
trackEvent("session_started", {
  sessionId: "sess_123",
  userId: "user_456",
  deviceType: "desktop",
});
```

### `session_ended`

**Description:** User session ends  
**When:** On logout or session timeout  
**Properties:**

- `sessionId`: string (required)
- `duration`: number (seconds)
- `pageViews`: number
- `interactions`: number

**Example:**

```typescript
trackEvent("session_ended", {
  sessionId: "sess_123",
  duration: 1800,
  pageViews: 12,
});
```

---

## 2. Onboarding Events

### `onboarding_started`

**Description:** User begins onboarding flow  
**When:** First time user starts onboarding  
**Properties:**

- `onboardingType`: 'new_user' | 'returning_user' | 'trial'
- `source`: string (where they came from)

**Example:**

```typescript
trackEvent("onboarding_started", {
  onboardingType: "new_user",
  source: "signup",
});
```

### `onboarding_step_completed`

**Description:** User completes an onboarding step  
**When:** User completes a step in onboarding wizard  
**Properties:**

- `stepName`: string (required)
- `stepNumber`: number (required)
- `totalSteps`: number (required)
- `duration`: number (seconds spent on step)
- `skipped`: boolean (optional)

**Example:**

```typescript
trackEvent("onboarding_step_completed", {
  stepName: "connect_account",
  stepNumber: 2,
  totalSteps: 5,
  duration: 45,
});
```

### `onboarding_completed`

**Description:** User completes entire onboarding flow  
**When:** User finishes all onboarding steps  
**Properties:**

- `totalDuration`: number (seconds)
- `stepsCompleted`: number
- `skippedSteps`: number[]
- `completionRate`: number (0-1)

**Example:**

```typescript
trackEvent("onboarding_completed", {
  totalDuration: 300,
  stepsCompleted: 5,
  completionRate: 1.0,
});
```

### `onboarding_abandoned`

**Description:** User abandons onboarding  
**When:** User leaves onboarding without completing  
**Properties:**

- `stepAbandoned`: string
- `stepNumber`: number
- `duration`: number (seconds)
- `reason`: string (optional, if known)

**Example:**

```typescript
trackEvent("onboarding_abandoned", {
  stepAbandoned: "connect_account",
  stepNumber: 2,
  duration: 120,
});
```

---

## 3. Core Product Actions

### Reconciliation Job Events

#### `job_created`

**Description:** User creates a new reconciliation job  
**Properties:**

- `jobId`: string (required)
- `sourceAdapter`: string (e.g., 'stripe', 'shopify')
- `targetAdapter`: string
- `matchingRules`: number (count of rules)

**Example:**

```typescript
trackEvent("job_created", {
  jobId: "job_123",
  sourceAdapter: "stripe",
  targetAdapter: "shopify",
  matchingRules: 3,
});
```

#### `job_updated`

**Description:** User updates an existing job  
**Properties:**

- `jobId`: string (required)
- `fieldsUpdated`: string[] (which fields changed)

**Example:**

```typescript
trackEvent("job_updated", {
  jobId: "job_123",
  fieldsUpdated: ["rules", "schedule"],
});
```

#### `job_deleted`

**Description:** User deletes a job  
**Properties:**

- `jobId`: string (required)
- `jobAge`: number (days since creation)

**Example:**

```typescript
trackEvent("job_deleted", {
  jobId: "job_123",
  jobAge: 30,
});
```

#### `job_run_started`

**Description:** User starts a reconciliation run  
**Properties:**

- `jobId`: string (required)
- `runType`: 'manual' | 'scheduled' | 'api'
- `sourceRecordCount`: number (estimated, optional)
- `targetRecordCount`: number (estimated, optional)

**Example:**

```typescript
trackEvent("job_run_started", {
  jobId: "job_123",
  runType: "manual",
});
```

#### `job_run_completed`

**Description:** Reconciliation run completes  
**Properties:**

- `jobId`: string (required)
- `executionId`: string (required)
- `duration`: number (seconds)
- `matched`: number
- `unmatched`: number
- `errors`: number
- `success`: boolean

**Example:**

```typescript
trackEvent("job_run_completed", {
  jobId: "job_123",
  executionId: "exec_456",
  duration: 45,
  matched: 150,
  unmatched: 5,
  success: true,
});
```

#### `job_run_failed`

**Description:** Reconciliation run fails  
**Properties:**

- `jobId`: string (required)
- `executionId`: string (required)
- `errorType`: string
- `errorMessage`: string
- `duration`: number (seconds before failure)

**Example:**

```typescript
trackEvent("job_run_failed", {
  jobId: "job_123",
  executionId: "exec_456",
  errorType: "adapter_error",
  errorMessage: "API rate limit exceeded",
});
```

### Report Events

#### `report_viewed`

**Description:** User views a reconciliation report  
**Properties:**

- `reportId`: string (required)
- `jobId`: string (required)
- `reportType`: 'summary' | 'detailed' | 'export'
- `viewDuration`: number (seconds, optional)

**Example:**

```typescript
trackEvent("report_viewed", {
  reportId: "report_123",
  jobId: "job_123",
  reportType: "summary",
});
```

#### `report_exported`

**Description:** User exports a report  
**Properties:**

- `reportId`: string (required)
- `format`: 'csv' | 'excel' | 'pdf' | 'json'
- `recordCount`: number

**Example:**

```typescript
trackEvent("report_exported", {
  reportId: "report_123",
  format: "csv",
  recordCount: 150,
});
```

---

## 4. Engagement Events

### `cta_clicked`

**Description:** User clicks a call-to-action button  
**Properties:**

- `ctaName`: string (required, e.g., 'hero_primary', 'pricing_upgrade')
- `ctaLocation`: string (page/section)
- `ctaText`: string (optional)
- `destination`: string (where it leads)

**Example:**

```typescript
trackEvent("cta_clicked", {
  ctaName: "hero_primary",
  ctaLocation: "landing_page",
  destination: "/signup",
});
```

### `feature_used`

**Description:** User uses a specific feature  
**Properties:**

- `featureName`: string (required)
- `featureCategory`: string (e.g., 'dashboard', 'settings', 'api')
- `usageCount`: number (optional, if tracked)

**Example:**

```typescript
trackEvent("feature_used", {
  featureName: "bulk_export",
  featureCategory: "reports",
});
```

### `search_performed`

**Description:** User performs a search  
**Properties:**

- `query`: string (required)
- `resultsCount`: number
- `searchType`: 'jobs' | 'reports' | 'global'
- `clickedResult`: boolean (optional)

**Example:**

```typescript
trackEvent("search_performed", {
  query: "stripe reconciliation",
  resultsCount: 5,
  searchType: "jobs",
});
```

### `filter_applied`

**Description:** User applies a filter  
**Properties:**

- `filterType`: string (e.g., 'status', 'date_range', 'adapter')
- `filterValue`: string | number
- `context`: string (where filter was applied)

**Example:**

```typescript
trackEvent("filter_applied", {
  filterType: "status",
  filterValue: "completed",
  context: "jobs_list",
});
```

---

## 5. Error & Friction Events

### `form_validation_failed`

**Description:** Form validation fails  
**Properties:**

- `formName`: string (required)
- `fieldName`: string (required)
- `errorType`: string (e.g., 'required', 'format', 'length')
- `attemptNumber`: number (optional)

**Example:**

```typescript
trackEvent("form_validation_failed", {
  formName: "job_creation",
  fieldName: "name",
  errorType: "required",
});
```

### `api_error_shown`

**Description:** API error is displayed to user  
**Properties:**

- `errorCode`: string | number
- `errorType`: string (e.g., 'network', 'validation', 'server')
- `endpoint`: string (optional)
- `retryAttempted`: boolean

**Example:**

```typescript
trackEvent("api_error_shown", {
  errorCode: 429,
  errorType: "rate_limit",
  endpoint: "/api/v1/jobs",
});
```

### `feature_flag_fallback_triggered`

**Description:** Feature flag fails to resolve, fallback used  
**Properties:**

- `flagKey`: string (required)
- `fallbackValue`: boolean | string
- `reason`: string (e.g., 'network_error', 'config_missing')

**Example:**

```typescript
trackEvent("feature_flag_fallback_triggered", {
  flagKey: "new_dashboard",
  fallbackValue: false,
  reason: "network_error",
});
```

### `experiment_assignment_failed`

**Description:** Experiment variant assignment fails  
**Properties:**

- `experimentKey`: string (required)
- `fallbackVariant`: string
- `reason`: string

**Example:**

```typescript
trackEvent("experiment_assignment_failed", {
  experimentKey: "onboarding_v2",
  fallbackVariant: "control",
  reason: "user_id_missing",
});
```

---

## 6. Conversion & Business Events

### `trial_started`

**Description:** User starts a trial  
**Properties:**

- `planId`: string (required)
- `trialDuration`: number (days)
- `source`: string (where signup came from)

**Example:**

```typescript
trackEvent("trial_started", {
  planId: "pro_trial",
  trialDuration: 14,
  source: "pricing_page",
});
```

### `subscription_started`

**Description:** User starts a paid subscription  
**Properties:**

- `planId`: string (required)
- `planName`: string
- `billingCycle`: 'monthly' | 'annual'
- `amount`: number (optional, in cents)

**Example:**

```typescript
trackEvent("subscription_started", {
  planId: "pro_monthly",
  planName: "Pro Plan",
  billingCycle: "monthly",
  amount: 9900,
});
```

### `subscription_upgraded`

**Description:** User upgrades subscription  
**Properties:**

- `fromPlanId`: string (required)
- `toPlanId`: string (required)
- `upgradeValue`: number (optional, in cents)

**Example:**

```typescript
trackEvent("subscription_upgraded", {
  fromPlanId: "starter",
  toPlanId: "pro",
  upgradeValue: 5000,
});
```

### `subscription_cancelled`

**Description:** User cancels subscription  
**Properties:**

- `planId`: string (required)
- `cancellationReason`: string (optional)
- `daysActive`: number

**Example:**

```typescript
trackEvent("subscription_cancelled", {
  planId: "pro_monthly",
  cancellationReason: "too_expensive",
  daysActive: 90,
});
```

---

## 7. Experiment Events

### `experiment_assigned`

**Description:** User is assigned to an experiment variant  
**Properties:**

- `experimentKey`: string (required)
- `variant`: string (required, e.g., 'control', 'variant_a')
- `assignmentMethod`: 'stable_hash' | 'random' | 'manual'
- `userId`: string (required for stable assignment)

**Example:**

```typescript
trackEvent("experiment_assigned", {
  experimentKey: "onboarding_v2",
  variant: "variant_a",
  assignmentMethod: "stable_hash",
  userId: "user_123",
});
```

### `experiment_exposure`

**Description:** User is exposed to an experiment variant  
**Properties:**

- `experimentKey`: string (required)
- `variant`: string (required)
- `exposureType`: 'page_view' | 'feature_use' | 'interaction'

**Example:**

```typescript
trackEvent("experiment_exposure", {
  experimentKey: "onboarding_v2",
  variant: "variant_a",
  exposureType: "page_view",
});
```

---

## 8. Funnel Definitions

### Onboarding Funnel

1. `onboarding_started`
2. `onboarding_step_completed` (step 1)
3. `onboarding_step_completed` (step 2)
4. `onboarding_step_completed` (step 3)
5. `onboarding_completed`

**Conversion Metric:** `onboarding_completed` / `onboarding_started`

### Job Creation Funnel

1. `page_view` (route: '/jobs/new')
2. `job_created` (form started)
3. `job_run_started` (first run)
4. `job_run_completed` (success)

**Conversion Metric:** `job_run_completed` / `page_view` (jobs/new)

### Subscription Funnel

1. `page_view` (route: '/pricing')
2. `cta_clicked` (ctaName: 'pricing_signup')
3. `trial_started`
4. `subscription_started`

**Conversion Metric:** `subscription_started` / `page_view` (pricing)

---

## 9. Event Naming Conventions

### Rules:

1. **Use snake_case** for event names
2. **Be specific** - `job_created` not `created`
3. **Use past tense** for completed actions - `job_completed` not `job_complete`
4. **Group by entity** - `job_*`, `report_*`, `user_*`
5. **Include action** - `*_started`, `*_completed`, `*_failed`, `*_viewed`

### Examples:

✅ Good:

- `job_created`
- `onboarding_step_completed`
- `report_exported`

❌ Bad:

- `createJob`
- `onboardingStep`
- `export`

---

## 10. Implementation Notes

### Required Context

All events should include:

- `userId` (when available)
- `sessionId` (when available)
- `timestamp` (ISO 8601)
- `route` (current page/route)

### Experiment Context

When an event occurs within an experiment, include:

```typescript
experimentContext: {
  experimentKey: 'onboarding_v2',
  variant: 'variant_a',
}
```

### Privacy Considerations

- Never log PII (personally identifiable information) in event properties
- Hash or anonymize sensitive identifiers when necessary
- Comply with GDPR/CCPA requirements

---

## 11. Event Tracking Best Practices

1. **Track early, track often** - Better to have too much data than too little
2. **Be consistent** - Use the same event names and properties across the app
3. **Include context** - Always include route, user, and session information
4. **Test events** - Verify events fire correctly in development
5. **Monitor event volume** - Too many events can impact performance
6. **Document changes** - Update this taxonomy when adding new events

---

**Next Steps:**

- See `/docs/product-analytics-dashboards.md` for dashboard recommendations
- See `/docs/feature-flags-and-experiments.md` for experiment tracking patterns
