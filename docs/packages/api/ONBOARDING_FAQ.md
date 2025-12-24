# Tenant Onboarding FAQ

## General Questions

### What is multi-tenancy?

Multi-tenancy allows multiple customers (tenants) to use the same application instance while keeping their data completely isolated. Each tenant has their own:
- Data (isolated via Row Level Security)
- Resource quotas
- Configuration
- Feature flags

### How is data isolated?

We use **PostgreSQL Row Level Security (RLS)** to ensure complete data isolation:
- Each database query is automatically filtered by tenant ID
- Tenants cannot access other tenants' data, even with direct SQL access
- All tables have RLS policies enabled

### What is schema-per-tenant?

Schema-per-tenant is an optional isolation mode where each tenant gets their own database schema. This provides:
- Stronger isolation
- Easier data migration
- Better performance for large tenants

Enable with: `ENABLE_SCHEMA_PER_TENANT=true`

## Tenant Creation

### How do I create a new tenant?

```typescript
import { TenantService } from '@settler/api';

const tenantService = new TenantService(tenantRepo, userRepo);

const { tenant, owner } = await tenantService.createTenant({
  name: 'Acme Corp',
  slug: 'acme-corp',
  ownerEmail: 'admin@acme.com',
  ownerPasswordHash: await hashPassword('secure-password'),
  tier: TenantTier.STARTER,
});
```

### What happens during tenant creation?

1. Tenant record created in database
2. Tenant schema created (if schema-per-tenant enabled)
3. Owner user created
4. Default quotas assigned based on tier
5. Quota usage tracking initialized
6. Welcome email sent (if configured)

### Can I create sub-accounts?

Yes! Enterprise tenants can create sub-accounts:

```typescript
const { tenant: subAccount } = await tenantService.createSubAccount(
  parentTenantId,
  {
    name: 'Acme Europe',
    slug: 'acme-europe',
    ownerEmail: 'admin-eu@acme.com',
    ownerPasswordHash: await hashPassword('password'),
  }
);
```

## Quotas & Limits

### What quotas are enforced?

- **Rate Limits**: Requests per minute (RPM)
- **Storage**: Total storage in bytes
- **Concurrent Jobs**: Maximum concurrent reconciliation jobs
- **Monthly Reconciliations**: Monthly reconciliation quota
- **Custom Domains**: Number of custom domains allowed

### How do I check quota usage?

```typescript
import { QuotaService } from '@settler/api';

const quotaService = new QuotaService(tenantRepo);
const usage = await quotaService.getUsage(tenantId);

console.log(usage);
// {
//   storageBytes: { current: 1024, limit: 1073741824 },
//   concurrentJobs: { current: 2, limit: 5 },
//   ...
// }
```

### What happens when quota is exceeded?

- API returns `429 Too Many Requests`
- Error includes current usage and limit
- Enterprise tenants bypass quotas automatically

### How do I increase quotas?

**Option 1: Upgrade Tier**
```typescript
await tenantService.upgradeTier(tenantId, TenantTier.GROWTH);
```

**Option 2: Custom Quota Adjustment**
```sql
UPDATE tenants
SET quotas = jsonb_set(quotas, '{storageBytes}', '2147483648'::jsonb)
WHERE id = 'tenant-id';
```

## Custom Domains

### How do I set up a custom domain?

1. **Add Domain**:
```typescript
tenant.setCustomDomain('api.acme.com', false);
await tenantRepo.save(tenant);
```

2. **Verify DNS**: Add CNAME record pointing to Settler
3. **Verify Domain**:
```typescript
await tenantService.verifyCustomDomain(tenantId, 'api.acme.com');
```

4. **Update DNS**: Point domain to Settler's load balancer

### How many custom domains can I have?

- **Free/Starter**: 0 domains
- **Growth**: 1 domain
- **Scale**: 5 domains
- **Enterprise**: Unlimited

## Feature Flags

### How do feature flags work?

Feature flags allow you to:
- Enable/disable features per tenant or user
- A/B test features with percentage rollouts
- Kill switch features instantly

### Create a Feature Flag

```typescript
import { FeatureFlagService } from '@settler/api';

const flagService = new FeatureFlagService();

// Tenant-specific flag
await flagService.setFlag('new-feature', true, {
  tenantId: tenantId,
  rolloutPercentage: 50, // 50% of tenant's users
  description: 'New reconciliation algorithm',
});

// User-specific flag
await flagService.setFlag('beta-feature', true, {
  tenantId: tenantId,
  userId: userId,
  description: 'Beta feature for specific user',
});
```

### Check Feature Flag

```typescript
const enabled = await flagService.isEnabled('new-feature', tenantId, userId);
if (enabled) {
  // Use new feature
}
```

### Kill Switch

```typescript
// Immediately disable feature for all tenants
await flagService.killSwitch('new-feature', 'Critical bug found', userId);
```

## Rate Limiting

### How does rate limiting work?

We use **Token Bucket** algorithm:
- Each tenant has a bucket with tokens
- Tokens refill at a constant rate
- Requests consume tokens
- When bucket is empty, requests are rate limited

### Adaptive Rate Limiting

Adaptive rate limiting adjusts limits based on success rate:
- High success rate (>95%): Increase rate slightly
- Low success rate (<80%): Decrease rate

### Check Rate Limit Status

```typescript
import { tokenBucket } from '@settler/api';

const { allowed, remaining, resetAt } = await tokenBucket.consume(
  `tenant:${tenantId}`,
  1, // tokens to consume
  {
    capacity: 1000,
    refillRate: 100, // tokens per second
    adaptive: true,
  }
);
```

## Queue System

### How does the prioritized queue work?

Jobs are queued with priorities:
- **Enterprise**: Bypass queue, execute immediately
- **Scale**: High priority (10x multiplier)
- **Growth**: Medium priority (5x multiplier)
- **Starter**: Normal priority (2x multiplier)
- **Free**: Low priority (1x multiplier)

### Add Job to Queue

```typescript
import { PrioritizedQueue, QueuePriority } from '@settler/api';

const queue = new PrioritizedQueue('reconciliation', async (job) => {
  // Process job
});

await queue.add(
  {
    tenantId: tenantId,
    tenantTier: TenantTier.GROWTH,
    jobId: jobId,
  },
  QueuePriority.HIGH
);
```

## Observability

### How do I view traces?

Traces are exported to OpenTelemetry collector. View in:
- **Jaeger**: `http://jaeger:16686`
- **Tempo**: `http://tempo:3200`
- **Datadog/New Relic**: If configured

### How do I view metrics?

Metrics are exposed at `/metrics` endpoint in Prometheus format.

View in Grafana dashboards (see `monitoring/grafana-dashboards.json`).

### What metrics are tracked?

**RED Method** (Rate, Errors, Duration):
- HTTP request rate
- HTTP error rate
- HTTP request duration (p50, p95, p99)

**Business Metrics**:
- Reconciliation success rate
- Job execution time
- Webhook delivery success

**Multi-Tenant Metrics**:
- Quota usage per tenant
- Rate limit hits
- Resource usage (noisy neighbor detection)

## Troubleshooting

### Tenant cannot access data

1. Check tenant status: `SELECT status FROM tenants WHERE id = 'tenant-id'`
2. Verify tenant context is set: Check `X-Tenant-ID` header or custom domain
3. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'users'`

### Quota exceeded errors

1. Check current usage: `await quotaService.getUsage(tenantId)`
2. Verify quota limits match tier
3. Consider upgrading tier or increasing quotas temporarily

### Feature flag not working

1. Check flag hierarchy: User > Tenant > Global
2. Verify rollout percentage (for A/B testing)
3. Check if kill switch was activated
4. Verify flag is not deleted

### Rate limiting too aggressive

1. Check tenant tier and rate limits
2. Review token bucket configuration
3. Consider enabling adaptive rate limiting
4. Temporarily increase limits if needed

## Best Practices

### 1. Always Set Tenant Context

```typescript
// In middleware
req.tenantId = tenant.id;

// In database queries
await TenantContext.withTenantContext(client, tenantId, async () => {
  // Queries automatically filtered by tenant
});
```

### 2. Monitor Quota Usage

Set up alerts for quota usage > 80%:
```promql
tenant_quota_usage / tenant_quota_limit > 0.8
```

### 3. Use Feature Flags for Rollouts

1. Start with 0% rollout
2. Test with specific tenant
3. Gradually increase to 100%
4. Monitor error rates

### 4. Handle Quota Errors Gracefully

```typescript
try {
  await quotaService.enforceQuota(tenantId, QuotaType.STORAGE, size);
} catch (error) {
  if (error instanceof QuotaExceededError) {
    // Return user-friendly error
    return res.status(429).json({
      error: 'Storage quota exceeded',
      currentUsage: error.currentUsage,
      limit: error.limit,
    });
  }
  throw error;
}
```

### 5. Use Prioritized Queues

- Enterprise tenants: Immediate execution
- Scale/Growth: High priority
- Free/Starter: Normal priority

## Support

For additional help:
- **Documentation**: `/docs`
- **SRE Runbook**: `/docs/SRE_RUNBOOK.md`
- **Support Email**: support@settler.io
- **Slack**: #settler-support
