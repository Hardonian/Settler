# Usage Tracking Integration Example

This document shows how to integrate usage tracking into API routes.

## Basic Usage

### 1. Import the usage tracking helper

```typescript
import { logUsageEvent } from "../utils/usage-tracker";
```

### 2. Log usage after successful operations

```typescript
// Example: After creating a reconciliation job
router.post("/jobs", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // ... create job logic ...
    
    const job = await createJob(...);
    
    // Log usage event
    await logUsageEvent({
      billingAccountId: req.user.billingAccountId,
      eventType: "reconciliation_job",
      quantity: 1,
      projectId: req.user.projectId,
      userId: req.user.id,
      tenantId: req.user.tenantId,
      metadata: {
        job_id: job.id,
        source_adapter: job.sourceAdapter,
        target_adapter: job.targetAdapter,
      },
    });
    
    return res.json(job);
  } catch (error) {
    // ... error handling ...
  }
});
```

## Usage Event Types

### Standard Event Types

- `reconciliation_job` - Reconciliation job executed
- `api_request` - API request made
- `webhook_event` - Webhook event processed
- `db_query` - Database query executed
- `ai_request` - AI-powered operation
- `auth_user_created` - User created
- `integration_sync` - Integration data sync

### Integration-Specific Events

- `stripe_sync` - Stripe data sync
- `shopify_sync` - Shopify data sync
- `tiktok_order_sync` - TikTok order sync (add-on)
- `wix_order_sync` - Wix order sync (add-on)
- `ga4_event_sync` - GA4 event sync (add-on)
- `paypal_payout` - PayPal payout processed (add-on)
- `whatsapp_message` - WhatsApp message sent (add-on)
- `telegram_message` - Telegram message sent (add-on)

## Integration Examples

### Example 1: Reconciliation Job

```typescript
import { logUsageEvent } from "../utils/usage-tracker";

router.post("/reconcile", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Get billing account
    const billingAccount = await getBillingAccount(req.user.id);
    
    if (!billingAccount) {
      return res.status(403).json({ error: "Billing account required" });
    }
    
    // Execute reconciliation
    const result = await executeReconciliation(req.body);
    
    // Log usage
    await logUsageEvent({
      billingAccountId: billingAccount.id,
      eventType: "reconciliation_job",
      quantity: 1,
      projectId: req.body.projectId,
      userId: req.user.id,
      tenantId: req.user.tenantId,
      integrationId: result.sourceAdapter,
      metadata: {
        job_id: result.jobId,
        records_processed: result.recordCount,
      },
    });
    
    return res.json(result);
  } catch (error) {
    // ... error handling ...
  }
});
```

### Example 2: Integration Sync

```typescript
router.post("/integrations/:integrationId/sync", 
  authMiddleware,
  checkIntegrationAccess(":integrationId"),
  async (req: AuthRequest, res: Response) => {
    try {
      const billingAccount = await getBillingAccount(req.user.id);
      const integrationId = req.params.integrationId;
      
      // Perform sync
      const syncResult = await syncIntegration(integrationId, req.body);
      
      // Log usage with integration-specific event type
      await logUsageEvent({
        billingAccountId: billingAccount.id,
        eventType: "integration_sync",
        quantity: syncResult.recordCount || 1,
        projectId: req.body.projectId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
        integrationId: integrationId,
        metadata: {
          sync_type: syncResult.syncType,
          records_synced: syncResult.recordCount,
        },
      });
      
      return res.json(syncResult);
    } catch (error) {
      // ... error handling ...
    }
  }
);
```

### Example 3: AI Request

```typescript
router.post("/ai/analyze", 
  authMiddleware,
  featureGate("ai_workflows"),
  async (req: AuthRequest, res: Response) => {
    try {
      const billingAccount = await getBillingAccount(req.user.id);
      
      // Execute AI analysis
      const analysis = await performAIAnalysis(req.body);
      
      // Log usage
      await logUsageEvent({
        billingAccountId: billingAccount.id,
        eventType: "ai_request",
        quantity: 1,
        projectId: req.body.projectId,
        userId: req.user.id,
        tenantId: req.user.tenantId,
        metadata: {
          ai_model: analysis.model,
          tokens_used: analysis.tokensUsed,
          analysis_type: analysis.type,
        },
      });
      
      return res.json(analysis);
    } catch (error) {
      // ... error handling ...
    }
  }
);
```

## Using Edge Functions

For high-volume operations, use Edge Functions to log usage:

```typescript
// Call edge function instead of direct database call
const response = await fetch(`${SUPABASE_URL}/functions/v1/log-usage`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    billing_account_id: billingAccount.id,
    event_type: "reconciliation_job",
    quantity: 1,
    project_id: projectId,
    user_id: userId,
    tenant_id: tenantId,
    integration_id: integrationId,
    metadata: {},
  }),
});
```

## Batch Usage Logging

For multiple events, batch them:

```typescript
const usageEvents = results.map(result => ({
  billing_account_id: billingAccount.id,
  event_type: "reconciliation_job",
  quantity: 1,
  project_id: projectId,
  user_id: userId,
  tenant_id: tenantId,
  metadata: { job_id: result.jobId },
}));

// Log all at once via edge function or batch insert
await logUsageEventsBatch(usageEvents);
```

## Best Practices

1. **Log after success**: Only log usage after successful operations
2. **Include metadata**: Add relevant context in metadata
3. **Use correct event types**: Use standardized event types
4. **Batch when possible**: Batch multiple events for efficiency
5. **Handle errors gracefully**: Don't fail the main operation if usage logging fails
6. **Use edge functions for high volume**: Use edge functions for high-frequency events

## Error Handling

```typescript
try {
  await logUsageEvent({...});
} catch (error) {
  // Log error but don't fail the main operation
  logError("Failed to log usage event", error);
  // Continue with response
}
```

## Testing

```typescript
// Mock usage tracking in tests
jest.mock("../utils/usage-tracker", () => ({
  logUsageEvent: jest.fn().mockResolvedValue(uuid()),
}));
```
