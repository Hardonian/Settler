# GTM Integration Guide

This guide shows how to integrate value event tracking and funnel optimization into your codebase.

## Quick Start

### 1. Track Value Events

When a reconciliation completes:

```typescript
import { trackValueEvent } from '@/lib/gtm/value-events';

// After reconciliation completes
await trackValueEvent({
  type: 'reconciliation_completed',
  userId: user.id,
  tenantId: tenant.id,
  billingAccountId: billingAccount.id,
  quantity: result.matchedCount,
  amount: result.totalAmountMatched,
  timeSavedMs: estimatedTimeSaved,
  metadata: {
    sourceAdapter: 'stripe',
    targetAdapter: 'shopify',
    reconciliationId: result.id,
  },
});
```

### 2. Track Funnel Transitions

When user completes a milestone:

```typescript
import { trackFunnelTransition } from '@/lib/gtm/funnels';

// When user runs first reconciliation
await trackFunnelTransition({
  from: 'first_api_call',
  to: 'first_reconciliation',
  userId: user.id,
  metadata: {
    reconciliationId: result.id,
  },
});
```

### 3. Display ROI Proof Blocks

In your console dashboard:

```tsx
import { ROIProofBlock } from '@/components/gtm/ROIProofBlock';

export default function Dashboard() {
  return (
    <div>
      <ROIProofBlock 
        billingAccountId={billingAccount.id}
        periodDays={30}
      />
    </div>
  );
}
```

### 4. Add Funnel CTAs

In gated pages:

```tsx
import { FunnelCTA } from '@/components/gtm/FunnelCTA';

export default function GatedFeature() {
  return (
    <div>
      <FunnelCTA 
        userId={user.id}
        variant="banner"
      />
    </div>
  );
}
```

## Integration Points

### Reconciliation Jobs

**File:** `/packages/web/src/app/api/reconciliation/run/route.ts`

```typescript
// After reconciliation completes
await trackValueEvent({
  type: 'reconciliation_completed',
  userId: user.id,
  tenantId: tenant.id,
  billingAccountId: billingAccount.id,
  quantity: result.matchedCount,
  metadata: {
    reconciliationId: result.id,
    sourceAdapter: job.sourceAdapter,
    targetAdapter: job.targetAdapter,
  },
});

// Track matched records
await trackValueEvent({
  type: 'reconciliation_matched',
  userId: user.id,
  tenantId: tenant.id,
  billingAccountId: billingAccount.id,
  quantity: result.matchedCount,
  amount: result.totalAmountMatched,
  metadata: {
    reconciliationId: result.id,
  },
});

// Track unmatched (value: visibility)
await trackValueEvent({
  type: 'reconciliation_unmatched_detected',
  userId: user.id,
  tenantId: tenant.id,
  billingAccountId: billingAccount.id,
  quantity: result.unmatchedSourceCount + result.unmatchedTargetCount,
  metadata: {
    reconciliationId: result.id,
  },
});
```

### Integration Connections

**File:** `/packages/web/src/app/api/integrations/connect/route.ts`

```typescript
// After integration connects
await trackValueEvent({
  type: 'integration_connected',
  userId: user.id,
  tenantId: tenant.id,
  billingAccountId: billingAccount.id,
  quantity: 1,
  metadata: {
    integrationId: integration.id,
    integrationType: integration.type,
  },
});

// Track first integration (activation)
const existingIntegrations = await countIntegrations(userId);
if (existingIntegrations === 0) {
  await trackValueEvent({
    type: 'first_integration',
    userId: user.id,
    tenantId: tenant.id,
    billingAccountId: billingAccount.id,
    quantity: 1,
    metadata: {
      integrationId: integration.id,
    },
  });
  
  await trackFunnelTransition({
    from: 'first_reconciliation',
    to: 'first_integration',
    userId: user.id,
  });
}
```

### Data Ingestion

**File:** `/packages/web/src/app/api/ingestion/process/route.ts`

```typescript
// After records processed
await trackValueEvent({
  type: 'records_processed',
  userId: user.id,
  tenantId: tenant.id,
  billingAccountId: billingAccount.id,
  quantity: processedCount,
  metadata: {
    sourceId: source.id,
    sourceType: source.type,
  },
});

// After normalization
await trackValueEvent({
  type: 'records_normalized',
  userId: user.id,
  tenantId: tenant.id,
  billingAccountId: billingAccount.id,
  quantity: normalizedCount,
  metadata: {
    sourceId: source.id,
  },
});
```

### First API Call (Activation)

**File:** `/packages/web/src/app/api/middleware/track-api-call.ts`

```typescript
// Track first API call
const hasApiCalls = await checkHasApiCalls(userId);
if (!hasApiCalls) {
  await trackValueEvent({
    type: 'first_api_call',
    userId: user.id,
    tenantId: tenant.id,
    billingAccountId: billingAccount.id,
    quantity: 1,
    metadata: {
      endpoint: request.url,
      method: request.method,
    },
  });
  
  await trackFunnelTransition({
    from: 'signed_up',
    to: 'first_api_call',
    userId: user.id,
  });
}
```

## React Hooks

### useValueEventTracking

```tsx
import { useValueEventTracking } from '@/hooks/useValueTracking';

function MyComponent() {
  const { track } = useValueEventTracking({
    userId: user.id,
    tenantId: tenant.id,
    billingAccountId: billingAccount.id,
  });

  const handleReconciliationComplete = async () => {
    await track({
      type: 'reconciliation_completed',
      quantity: result.matchedCount,
    });
  };
}
```

### useFunnelTracking

```tsx
import { useFunnelTracking } from '@/hooks/useValueTracking';

function MyComponent() {
  const { trackTransition } = useFunnelTracking(user.id);

  const handleUpgrade = async () => {
    await trackTransition('first_integration', 'upgraded', {
      planId: 'starter',
    });
  };
}
```

### usePageTracking

```tsx
import { usePageTracking } from '@/hooks/useValueTracking';

function MyPage() {
  // Automatically tracks page views and funnel transitions
  usePageTracking();
  
  return <div>...</div>;
}
```

## Best Practices

1. **Track Real Value:** Only track events that deliver measurable value
2. **Include Context:** Always include metadata for analysis
3. **Fail Gracefully:** Don't break user flows if tracking fails
4. **Privacy Safe:** Never track PII in analytics events
5. **Measure Outcomes:** Track outcomes, not just actions

## Testing

### Test Value Events

```typescript
import { trackValueEvent } from '@/lib/gtm/value-events';

// In test
await trackValueEvent({
  type: 'reconciliation_completed',
  userId: 'test-user',
  tenantId: 'test-tenant',
  billingAccountId: 'test-billing',
  quantity: 100,
});

// Verify in database
const events = await prisma.usageEvent.findMany({
  where: {
    eventType: 'value:reconciliation_completed',
    userId: 'test-user',
  },
});

expect(events.length).toBe(1);
expect(events[0].quantity).toBe(100);
```

### Test Funnel Transitions

```typescript
import { trackFunnelTransition } from '@/lib/gtm/funnels';

await trackFunnelTransition({
  from: 'visitor',
  to: 'playground_engaged',
  userId: 'test-user',
});

// Verify transition tracked
const events = await prisma.usageEvent.findMany({
  where: {
    eventType: 'funnel:visitor→playground_engaged',
    userId: 'test-user',
  },
});

expect(events.length).toBe(1);
```

## Monitoring

### Key Metrics to Monitor

1. **Activation Rate:** % of users who complete first reconciliation
2. **Conversion Rate:** % of users who upgrade to paid
3. **Time to Value:** Average time from signup to first reconciliation
4. **ROI per User:** Average cost savings per user
5. **Funnel Drop-off:** Where users drop off in funnel

### Dashboards

Create dashboards for:
- Funnel conversion rates
- Value events by type
- ROI metrics by tenant
- Activation metrics

## Troubleshooting

### Events Not Tracking

1. Check browser console for errors
2. Verify billing account exists
3. Check database for usage events
4. Verify analytics provider initialized

### ROI Not Calculating

1. Verify value events exist for billing account
2. Check date range is correct
3. Verify event types match expected patterns
4. Check for null/undefined values

### Funnel CTAs Not Showing

1. Verify user ID is passed
2. Check funnel stage API returns correct stage
3. Verify next action exists for stage
4. Check component renders correctly
