# Ops Autopilot Deployment Guide

**Purpose:** Step-by-step guide to deploy and enable reliability features

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure these are set in your production environment:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `DATABASE_URL` - Direct database connection string

**Optional (but recommended):**
- `STRIPE_SECRET_KEY` - For billing functionality
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhook verification
- `CRON_SECRET` - For cron job authentication

### 2. Database Migrations

Ensure all migrations are applied:

```bash
# Using Prisma
npm run prisma:migrate

# Or using Supabase CLI
npm run db:migrate:prod
```

### 3. Verify Database Schema

Ensure these tables exist:
- `idempotency_keys` (for idempotency)
- `ops_events` (for reliability metrics - optional, falls back to console logging)
- `jobs` (for job queue)
- `dead_letters` (for dead-letter queue)

### 4. Run Doctor Command

```bash
npm run doctor
```

Fix any errors before deploying.

---

## Deployment Steps

### Step 1: Deploy Code

Deploy the updated codebase to your hosting platform (Vercel, etc.):

```bash
# Build and verify
npm run build

# Deploy (platform-specific)
vercel deploy --prod
```

### Step 2: Enable Idempotency

Idempotency is automatically enabled for routes that use the middleware:

```typescript
// Example: Add to critical routes
import { withIdempotency } from '@/lib/idempotency/middleware';

export const POST = withIdempotency(
  async (request: NextRequest) => {
    // Your handler
  },
  {
    operation: 'sync:stripe',
    getTenantId: async (req) => {
      // Extract tenant ID from request
    },
  }
);
```

**Routes Already Updated:**
- `/api/connectors/sync/[providerId]` ✅
- `/api/runs/create` ✅ (already had idempotency_key)

**Routes to Update (if needed):**
- `/api/v1/receipts` - Consider adding idempotency for uploads
- `/api/v1/recon/jobs` - Consider adding idempotency for job creation

### Step 3: Enable Tenant Containment

Tenant quotas are enforced via middleware. Default quotas:

```typescript
// Default quotas (can be customized per tier)
{
  requestsPerMinute: 100,
  jobsPerHour: 50,
  maxConcurrentJobs: 5,
  maxRecordsPerRun: 10000,
  maxExportSizeMB: 100,
}
```

**To customize quotas per subscription tier:**

Edit `packages/web/src/lib/containment/tenant-quotas.ts`:

```typescript
export async function getTenantQuota(tenantId: string): Promise<TenantQuota> {
  // Fetch subscription tier from database
  const subscription = await getSubscription(tenantId);
  
  const tierQuotas = {
    base: { requestsPerMinute: 50, jobsPerHour: 20, ... },
    pro: { requestsPerMinute: 200, jobsPerHour: 100, ... },
    enterprise: { requestsPerMinute: 1000, jobsPerHour: 500, ... },
  };
  
  return tierQuotas[subscription.tier] || tierQuotas.base;
}
```

### Step 4: Enable Correlation IDs

Correlation IDs are automatically enabled via middleware (`packages/web/middleware.ts`).

Verify they're being set:

```bash
# Check response headers
curl -I https://your-domain.com/api/v1/receipts
# Should see: x-correlation-id: <uuid>
```

### Step 5: Enable Reliability Metrics

Reliability metrics are automatically recorded when using structured logging.

**To view metrics in admin dashboard:**

1. Navigate to `/api/admin/monitoring/health`
2. Check `reliability` section for:
   - Operation statistics
   - Adapter error rates
   - Dead-letter counts
   - Latest failures

**To store metrics in database:**

Ensure `ops_events` table exists (or metrics will fall back to console logging).

---

## Post-Deployment Verification

### 1. Health Check

```bash
# Check overall health
curl https://your-domain.com/api/console/health

# Check admin health (requires auth)
curl https://your-domain.com/api/admin/monitoring/health
```

### 2. Test Idempotency

```bash
# Make same request twice with same payload
curl -X POST https://your-domain.com/api/connectors/sync/stripe \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "test", "since": "2024-01-01"}'

# Second request should return cached response
curl -X POST https://your-domain.com/api/connectors/sync/stripe \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "test", "since": "2024-01-01"}'
```

### 3. Test Rate Limiting

```bash
# Make 101 requests rapidly (should get 429 after 100)
for i in {1..101}; do
  curl https://your-domain.com/api/v1/receipts
done
```

### 4. Test Graceful Errors

```bash
# Trigger an error (should return 200 with error info, not 500)
curl -X POST https://your-domain.com/api/v1/receipts \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# Should return 200 with error details, not 500
```

---

## Monitoring Setup

See `docs/internal/ops-autopilot-monitoring-guide.md` for detailed monitoring setup.

---

## Troubleshooting

### Idempotency Keys Not Working

1. Check `idempotency_keys` table exists
2. Verify middleware is applied to routes
3. Check logs for idempotency errors

### Quotas Not Enforcing

1. Verify middleware is applied
2. Check `getTenantId` function returns correct tenant ID
3. Verify usage tracking is working

### Correlation IDs Missing

1. Check middleware is enabled (`packages/web/middleware.ts`)
2. Verify headers are being set in responses
3. Check logs for correlation ID generation errors

### Reliability Metrics Not Appearing

1. Check `ops_events` table exists (or metrics fall back to console)
2. Verify structured logging is being used
3. Check admin health endpoint for metrics

---

## Rollback Plan

If issues occur:

1. **Disable idempotency:** Remove `withIdempotency` wrapper from routes
2. **Disable quotas:** Remove `withTenantContainment` wrapper from routes
3. **Revert code:** Deploy previous version

All reliability features are non-breaking - they enhance existing functionality without changing core behavior.
