# Feature Gating Design

Design documentation for Settler.dev's feature gating system.

## Overview

Feature gating controls access to features based on:

- Subscription plan tier
- Add-on purchases
- Usage limits
- Integration availability

## Gating Levels

### 1. Plan-Based Gating

Features are gated by subscription plan:

**Base Plan:**

- Core reconciliation features
- 5 standard integrations
- Basic analytics
- Standard support

**Pro Plan:**

- All base plan features
- SQL Editor
- Advanced analytics
- Real-time dashboards
- High-volume API access
- Priority support

**Enterprise Plan:**

- All pro plan features
- Unlimited usage
- Custom integrations
- Dedicated support
- SLA guarantees

### 2. Add-On Gating

Features require specific add-on purchases:

- TikTok integration → TikTok Shop add-on
- Wix integration → Wix Stores add-on
- GA4 sync → GA4 Deep Sync add-on
- PayPal Payouts → PayPal Payouts add-on
- WhatsApp/Telegram → WhatsApp + Telegram add-on

### 3. Usage-Based Gating

Features are limited by usage quotas:

- Reconciliation jobs: 10,000/month (base)
- API requests: 100,000/month (base)
- Webhook events: 50,000/month (base)
- Database queries: 500,000/month (base)
- AI requests: 1,000/month (base)

## Implementation

### Middleware

Feature gating is implemented via Express middleware:

```typescript
import { featureGate } from "../middleware/billing-gating";

router.post(
  "/premium-feature",
  authMiddleware,
  featureGate("advanced_analytics"),
  async (req, res) => {
    // Route handler
  }
);
```

### Feature Configuration

Features are configured in `billing-gating.ts`:

```typescript
const FEATURE_GATES: Record<string, FeatureGate> = {
  sql_editor: {
    feature: "sql_editor",
    requiresPlan: "pro",
  },
  advanced_analytics: {
    feature: "advanced_analytics",
    requiresPlan: "pro",
  },
  tiktok_integration: {
    feature: "tiktok_integration",
    requiresAddOn: "tiktok-shop",
  },
  // ...
};
```

### Usage Quota Checking

Check usage quotas before operations:

```typescript
import { checkUsageQuota } from "../middleware/billing-gating";

router.post(
  "/jobs",
  authMiddleware,
  async (req, res, next) => {
    await checkUsageQuota(req, res, next, "reconciliation_job", 1);
  },
  async (req, res) => {
    // Create job
  }
);
```

## Gated Features

### SQL Editor

**Gate:** Pro plan required  
**Middleware:** `featureGate("sql_editor")`  
**Error:** "Plan Upgrade Required - This feature requires Pro plan or higher"

### Advanced Analytics

**Gate:** Pro plan required  
**Middleware:** `featureGate("advanced_analytics")`  
**Error:** "Plan Upgrade Required - This feature requires Pro plan or higher"

### AI Workflows

**Gate:** Base plan + usage check  
**Middleware:** `featureGate("ai_workflows")`  
**Error:** "Usage Limit Exceeded - You have reached your AI request limit"

### Real-Time Dashboards

**Gate:** Pro plan required  
**Middleware:** `featureGate("realtime_dashboards")`  
**Error:** "Plan Upgrade Required - This feature requires Pro plan or higher"

### High-Volume API

**Gate:** Pro plan required  
**Middleware:** `featureGate("high_volume_api")`  
**Error:** "Plan Upgrade Required - This feature requires Pro plan or higher"

### Integration-Specific Features

Each premium integration is gated:

```typescript
router.post(
  "/integrations/:integrationId/sync",
  authMiddleware,
  checkIntegrationAccess(":integrationId"),
  async (req, res) => {
    // Sync integration
  }
);
```

## Upgrade Prompts

When a feature is gated, the API returns:

```json
{
  "error": "Plan Upgrade Required",
  "message": "This feature requires Pro plan or higher",
  "current_plan": "base",
  "required_plan": "pro",
  "upgrade_required": true
}
```

The UI displays upgrade prompts based on this response.

## Usage Warnings

Warnings are shown when usage approaches limits:

- **80% threshold:** Warning banner
- **95% threshold:** Danger banner
- **100% threshold:** Blocked with upgrade prompt

## Error Responses

### Plan Upgrade Required

```json
{
  "error": "Plan Upgrade Required",
  "message": "This feature requires Pro plan or higher",
  "current_plan": "base",
  "required_plan": "pro",
  "upgrade_required": true
}
```

### Add-On Required

```json
{
  "error": "Add-On Required",
  "message": "This feature requires the TikTok Shop + TikTok Ads add-on",
  "add_on_required": "tiktok-shop",
  "upgrade_required": true
}
```

### Usage Quota Exceeded

```json
{
  "error": "Usage Quota Exceeded",
  "message": "You have reached your reconciliation_job limit for this billing period",
  "current_usage": 10000,
  "limit": 10000,
  "upgrade_required": true
}
```

## UI Integration

### Upgrade Banners

Display upgrade banners when features are gated:

```tsx
<ThresholdWarningBanner
  title="Feature Unavailable"
  message="Upgrade to Pro to access this feature"
  severity="warning"
  onUpgrade={() => router.push("/dashboard/billing/upgrade")}
/>
```

### Feature Lock Modals

Show feature lock modals for premium features:

```tsx
<FeatureLockModal
  feature="Advanced Analytics"
  requiredPlan="Pro"
  onUpgrade={() => router.push("/dashboard/billing/upgrade")}
/>
```

## Best Practices

1. **Fail Fast**: Check gates early in request lifecycle
2. **Clear Messages**: Provide specific upgrade paths
3. **Graceful Degradation**: Show alternatives when possible
4. **Usage Transparency**: Always show current usage vs. limits
5. **Easy Upgrades**: Make upgrade process seamless

## Testing

### Test Feature Gates

```typescript
// Test plan requirement
const req = { user: { plan: "base" } };
const res = { status: jest.fn(), json: jest.fn() };
await featureGate("advanced_analytics")(req, res, jest.fn());
expect(res.status).toHaveBeenCalledWith(403);

// Test add-on requirement
const reqWithAddOn = { user: { plan: "base", addOns: ["tiktok-shop"] } };
await featureGate("tiktok_integration")(reqWithAddOn, res, jest.fn());
expect(res.status).not.toHaveBeenCalled();
```

## Monitoring

Track feature gate metrics:

- Gate hit rate by feature
- Upgrade conversion rate
- Usage limit warnings
- Add-on purchase rate
