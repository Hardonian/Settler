# Feature Flags & Experiments Guide

**Version:** 1.0  
**Last Updated:** Phase 7  
**Purpose:** Complete guide to using feature flags and running experiments in the Settler platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Feature Flags](#feature-flags)
3. [Experiments & A/B Testing](#experiments--ab-testing)
4. [Implementation Guide](#implementation-guide)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The Settler platform includes a comprehensive feature flag and experiment system that enables:

- **Feature Toggles**: Turn features on/off without code changes
- **Gradual Rollouts**: Roll out features to a percentage of users
- **Segment Targeting**: Enable features for specific user segments
- **A/B Testing**: Run experiments with stable variant assignment
- **Safe Deployments**: Test features in production before full rollout

### Key Concepts

- **Feature Flag**: A boolean or string value that controls feature visibility
- **Experiment**: A feature flag with multiple variants (e.g., control, variant_a, variant_b)
- **Variant**: A specific version of an experiment (e.g., 'control', 'variant_a')
- **Stable Assignment**: Same user always gets same variant (based on user ID hash)

---

## Feature Flags

### Types of Feature Flags

#### 1. Static Flags
Simple on/off flags controlled by environment or config.

```typescript
// Flag definition
new_dashboard: {
  key: 'new_dashboard',
  defaultValue: false,
  rolloutType: 'static',
}
```

#### 2. Percentage Rollouts
Gradually roll out to a percentage of users.

```typescript
// Roll out to 10% of users
advanced_matching: {
  key: 'advanced_matching',
  defaultValue: false,
  rolloutType: 'percentage',
  rolloutPercentage: 10, // 10% of users
}
```

#### 3. Segment-Based Flags
Enable for specific user segments.

```typescript
// Only for beta testers and enterprise users
ml_features: {
  key: 'ml_features',
  defaultValue: false,
  rolloutType: 'segment',
  segments: ['beta_testers', 'enterprise'],
}
```

### Using Feature Flags in Components

#### Basic Usage

```tsx
import { useFeatureFlag } from '@/lib/flags';

function Dashboard() {
  const isNewDashboard = useFeatureFlag('new_dashboard');
  
  ifNewDashboard ? <NewDashboard /> : <LegacyDashboard />;
}
```

#### Multiple Flags

```tsx
import { useFeatureFlags } from '@/lib/flags';

function App() {
  const flags = useFeatureFlags(['new_dashboard', 'beta_sidebar']);
  
  return (
    <>
      {flags.new_dashboard && <NewDashboard />}
      {flags.beta_sidebar && <BetaSidebar />}
    </>
  );
}
```

#### Server-Side Usage

```typescript
import { resolveFlag } from '@/lib/flags/resolver';

// In server component or API route
const result = await resolveFlag('new_dashboard', {
  userId: 'user_123',
  segments: ['beta_testers'],
});

if (result.value === true) {
  // Show new dashboard
}
```

### Environment Overrides

Flags can be overridden via environment variables:

```bash
# Enable flag
NEXT_PUBLIC_FLAG_NEW_DASHBOARD=true

# Disable flag
NEXT_PUBLIC_FLAG_NEW_DASHBOARD=false

# Set experiment variant
NEXT_PUBLIC_FLAG_EXPERIMENT_ONBOARDING_V2=variant_a
```

### Defining New Flags

1. **Add to registry** (`packages/web/src/lib/flags/flags.ts`):

```typescript
export type FlagKey =
  | 'new_dashboard'
  | 'your_new_flag'; // Add here

export const FLAG_REGISTRY: Record<FlagKey, FlagMetadata> = {
  // ... existing flags
  
  your_new_flag: {
    key: 'your_new_flag',
    description: 'Description of your flag',
    defaultValue: false,
    rolloutType: 'static', // or 'percentage', 'segment'
    environments: {
      development: true,
      staging: false,
      production: false,
    },
  },
};
```

2. **Use in components**:

```tsx
const enabled = useFeatureFlag('your_new_flag');
```

---

## Experiments & A/B Testing

### Experiment Structure

Experiments are feature flags with multiple variants:

```typescript
experiment_onboarding_v2: {
  key: 'experiment_onboarding_v2',
  description: 'A/B test: New onboarding flow',
  defaultValue: 'control',
  rolloutType: 'experiment',
  experimentVariants: ['control', 'variant_a', 'variant_b'],
  experimentSplit: {
    control: 50,    // 50% of users
    variant_a: 25,  // 25% of users
    variant_b: 25,  // 25% of users
  },
}
```

### Stable Variant Assignment

**Key Feature**: Same user always gets the same variant.

- Uses stable hash of `experimentKey + userId`
- Ensures consistent experience
- Enables accurate experiment analysis

### Using Experiments in Components

#### Basic Usage

```tsx
import { useExperimentVariant } from '@/lib/flags';

function OnboardingFlow() {
  const variant = useExperimentVariant('experiment_onboarding_v2');
  
  if (variant === 'variant_a') return <OnboardingV2A />;
  if (variant === 'variant_b') return <OnboardingV2B />;
  return <OnboardingControl />;
}
```

#### With Exposure Tracking

```tsx
import { useExperiment } from '@/lib/flags';

function OnboardingPage() {
  const { variant, trackExposure } = useExperiment('experiment_onboarding_v2');
  
  useEffect(() => {
    // Track when user sees experiment
    trackExposure('page_view');
  }, [trackExposure]);
  
  // Render based on variant
  return variant === 'variant_a' ? <VariantA /> : <Control />;
}
```

#### Tracking Conversions

```tsx
import { useExperimentConversion } from '@/lib/flags';

function CheckoutFlow() {
  const { trackConversion, variant } = useExperimentConversion('experiment_checkout_v2');
  
  const handleComplete = () => {
    // Track conversion with experiment context
    trackConversion('checkout_completed', {
      value: 99.99,
    });
  };
  
  return <CheckoutForm onComplete={handleComplete} />;
}
```

### Creating a New Experiment

1. **Define experiment** (`packages/web/src/lib/flags/flags.ts`):

```typescript
experiment_your_test: {
  key: 'experiment_your_test',
  description: 'A/B test: Your feature',
  defaultValue: 'control',
  rolloutType: 'experiment',
  experimentVariants: ['control', 'variant_a'],
  experimentSplit: {
    control: 50,
    variant_a: 50,
  },
}
```

2. **Use in component**:

```tsx
const variant = useExperimentVariant('experiment_your_test');
```

3. **Track events** (automatically tracked via hooks):
   - `experiment_assigned` - When user is assigned to variant
   - `experiment_exposure` - When user sees experiment
   - Conversion events include experiment context

---

## Implementation Guide

### Step 1: Wrap Feature in Flag

```tsx
// Before
function Dashboard() {
  return <NewDashboard />;
}

// After
function Dashboard() {
  const isNewDashboard = useFeatureFlag('new_dashboard');
  return isNewDashboard ? <NewDashboard /> : <LegacyDashboard />;
}
```

### Step 2: Test Locally

```bash
# Enable flag in development
NEXT_PUBLIC_FLAG_NEW_DASHBOARD=true npm run dev
```

### Step 3: Deploy with Flag Disabled

```typescript
// Flag starts at 0% rollout
new_dashboard: {
  rolloutPercentage: 0, // Safe default
}
```

### Step 4: Gradual Rollout

```typescript
// Increase rollout percentage gradually
new_dashboard: {
  rolloutPercentage: 10, // 10% of users
}

// Monitor metrics, then increase
new_dashboard: {
  rolloutPercentage: 50, // 50% of users
}

// Finally, 100%
new_dashboard: {
  rolloutPercentage: 100, // All users
}
```

### Step 5: Remove Flag (After Full Rollout)

Once feature is stable and rolled out to 100%:

1. Remove flag checks from code
2. Remove flag from registry
3. Deploy

---

## Best Practices

### 1. Always Provide Fallback

```tsx
// ✅ Good
const isEnabled = useFeatureFlag('new_feature');
return isEnabled ? <NewFeature /> : <LegacyFeature />;

// ❌ Bad - No fallback
const isEnabled = useFeatureFlag('new_feature');
if (!isEnabled) return null; // User sees nothing!
```

### 2. Use Stable Assignment for Experiments

Experiments automatically use stable assignment. Don't override:

```tsx
// ✅ Good - Uses stable assignment
const variant = useExperimentVariant('experiment_test');

// ❌ Bad - Random assignment breaks analysis
const variant = Math.random() > 0.5 ? 'variant_a' : 'control';
```

### 3. Track Experiment Exposure

Always track when users see experiments:

```tsx
const { trackExposure } = useExperiment('experiment_test');

useEffect(() => {
  trackExposure('page_view');
}, []);
```

### 4. Include Experiment Context in Conversions

Conversion events automatically include experiment context when using hooks:

```tsx
// ✅ Good - Includes experiment context
const { trackConversion } = useExperimentConversion('experiment_checkout');
trackConversion('checkout_completed', { value: 99.99 });

// ❌ Bad - Missing experiment context
trackEvent('checkout_completed', { value: 99.99 });
```

### 5. Test Flags Locally

Always test flags in development before deploying:

```bash
# Test enabled state
NEXT_PUBLIC_FLAG_NEW_DASHBOARD=true npm run dev

# Test disabled state
NEXT_PUBLIC_FLAG_NEW_DASHBOARD=false npm run dev
```

### 6. Monitor Flag Usage

- Check analytics for flag exposure events
- Monitor error events (`feature_flag_fallback_triggered`)
- Track experiment assignment rates

### 7. Clean Up Old Flags

Remove flags after features are fully rolled out:

1. Remove flag checks from code
2. Remove from registry
3. Update documentation

---

## Troubleshooting

### Flag Always Returns False

**Possible Causes:**
1. Flag not defined in registry
2. Environment override set to false
3. User not in rollout percentage/segment

**Solutions:**
- Check flag definition in `flags.ts`
- Check environment variables
- Verify user context (userId, segments)

### Experiment Variant Changes

**Cause:** User ID changed or hash algorithm issue

**Solution:** 
- Ensure user ID is stable
- Check that same userId is used consistently
- Verify hash function hasn't changed

### Flag Not Updating

**Possible Causes:**
1. Cached value
2. Environment variable not reloaded
3. Remote config not fetched

**Solutions:**
- Clear browser cache
- Restart dev server
- Check remote config connection

### Performance Issues

**Cause:** Too many flag checks

**Solution:**
- Batch flag checks with `useFeatureFlags()`
- Cache flag values when possible
- Use server-side resolution for initial render

---

## Advanced Topics

### Remote Config Integration

To integrate with LaunchDarkly, GrowthBook, or Unleash:

1. Update `getRemoteConfig()` in `resolver.ts`
2. Fetch flags from remote provider
3. Cache responses appropriately

### Custom User Segments

Add custom segment logic:

```typescript
const userContext: UserContext = {
  userId: 'user_123',
  segments: ['beta_testers', 'enterprise'],
  attributes: {
    plan: 'pro',
    signupDate: '2024-01-01',
  },
};
```

### Kill Switch

Emergency disable all flags:

```typescript
// In resolver.ts
const KILL_SWITCH_ENABLED = process.env.FLAG_KILL_SWITCH === 'true';

if (KILL_SWITCH_ENABLED) {
  return { value: false, source: 'kill_switch' };
}
```

---

## Examples

### Example 1: Feature Toggle

```tsx
function Dashboard() {
  const isNewDashboard = useFeatureFlag('new_dashboard');
  
  return (
    <div>
      {isNewDashboard ? (
        <NewDashboard />
      ) : (
        <LegacyDashboard />
      )}
    </div>
  );
}
```

### Example 2: A/B Test

```tsx
function OnboardingPage() {
  const { variant, trackExposure } = useExperiment('experiment_onboarding_v2');
  
  useEffect(() => {
    trackExposure('page_view');
  }, [trackExposure]);
  
  return (
    <>
      {variant === 'variant_a' && <OnboardingV2A />}
      {variant === 'variant_b' && <OnboardingV2B />}
      {variant === 'control' && <OnboardingControl />}
    </>
  );
}
```

### Example 3: Gradual Rollout

```tsx
function Feature() {
  const isEnabled = useFeatureFlag('new_feature');
  
  // Flag starts at 0% rollout (disabled)
  // Gradually increase to 10%, 50%, 100%
  // Monitor metrics at each stage
  
  if (!isEnabled) {
    return <LegacyFeature />;
  }
  
  return <NewFeature />;
}
```

---

## Related Documentation

- [Event Taxonomy](./event-taxonomy.md) - Event definitions
- [Product Analytics Dashboards](./product-analytics-dashboards.md) - Dashboard setup
- [Analytics Guide](../packages/web/src/lib/analytics/README.md) - Analytics implementation

---

**Questions?** Check the code examples or reach out to the team.
