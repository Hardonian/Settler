# Critical User Paths

**Last Updated:** 2025-01-20  
**Purpose:** Document user journeys that must never break in production

## Overview

This document identifies critical user paths that are essential for business operations. Each path must have:
- Graceful error handling
- Fallback mechanisms
- Monitoring/alerting
- Recovery procedures

## Path 1: Landing → Signup → Console

### Flow

```
1. User visits / (landing page)
   ↓
2. Clicks "Get API Key" → /signup
   ↓
3. Signs up via Supabase Auth
   ↓
4. Redirected to /console
   ↓
5. Sees dashboard with API keys
```

### Failure Points & Mitigations

| Failure Point | Impact | Mitigation |
|--------------|--------|------------|
| Landing page fails to load | User can't start journey | Static page, CDN cached |
| Supabase Auth down | Can't sign up | Show error message, retry button |
| Auth redirect fails | User stuck | Fallback to manual redirect |
| Console page fails | User can't access app | Error boundary, retry |
| API key generation fails | User can't use API | Show error, manual retry endpoint |

### Monitoring

- Track conversion: Landing → Signup → Console
- Alert on signup failure rate > 5%
- Alert on console load failure rate > 1%

## Path 2: Pricing → Checkout → Webhook → Entitlement

### Flow

```
1. User visits /pricing
   ↓
2. Clicks "Upgrade to Pro" → POST /api/stripe/checkout
   ↓
3. Redirected to Stripe Checkout
   ↓
4. Completes payment → Stripe redirects to /billing/success
   ↓
5. Stripe webhook → POST /api/stripe/webhook
   ↓
6. Webhook creates Subscription record
   ↓
7. User sees active subscription in /console/billing
```

### Failure Points & Mitigations

| Failure Point | Impact | Mitigation |
|--------------|--------|------------|
| Pricing page fails | Can't see plans | Static page, cached |
| Checkout API fails | Can't start payment | Error message, retry |
| Stripe Checkout down | Can't pay | Stripe handles, retry later |
| Webhook fails | Payment succeeds but no subscription | Idempotency + reconciliation job |
| Webhook signature invalid | Security risk | Reject, log, alert |
| Subscription creation fails | User paid but no access | Reconciliation job fixes |
| Billing page shows wrong status | User confusion | Polling + manual refresh |

### Monitoring

- Track conversion: Pricing → Checkout → Success
- Alert on webhook failure rate > 1%
- Alert on subscription creation failures
- Monitor webhook processing latency

### Recovery Procedures

1. **Webhook Missed**: Run reconciliation job (`/api/admin/billing/reconcile`)
2. **Subscription Missing**: Query Stripe API, create manually
3. **Wrong Status**: Force sync from Stripe

## Path 3: API Key → API Call → Usage Tracking

### Flow

```
1. Developer gets API key from /console/api-keys
   ↓
2. Makes API call: POST /api/v1/receipts
   ↓
3. API validates key, checks quota
   ↓
4. Processes request
   ↓
5. Records usage event
   ↓
6. Returns response
```

### Failure Points & Mitigations

| Failure Point | Impact | Mitigation |
|--------------|--------|------------|
| API key invalid | Request rejected | Clear error message |
| Quota exceeded | Request rejected | 429 status, upgrade prompt |
| Usage tracking fails | Billing incorrect | Non-blocking, retry queue |
| Database down | API unavailable | Graceful degradation, cached responses |
| Processing fails | Request fails | Error response, retry guidance |

### Monitoring

- Track API success rate
- Alert on quota exhaustion spikes
- Monitor usage tracking lag
- Track API latency (p50, p95, p99)

## Path 4: Console → Billing → Portal → Update

### Flow

```
1. User visits /console/billing
   ↓
2. Clicks "Manage Billing" → POST /api/stripe/portal
   ↓
3. Redirected to Stripe Customer Portal
   ↓
4. Updates payment method / cancels subscription
   ↓
5. Stripe webhook → POST /api/stripe/webhook
   ↓
6. Subscription updated in database
   ↓
7. User sees updated status in /console/billing
```

### Failure Points & Mitigations

| Failure Point | Impact | Mitigation |
|--------------|--------|------------|
| Billing page fails | Can't manage subscription | Error boundary, retry |
| Portal API fails | Can't access Stripe portal | Error message, manual link |
| Webhook fails | Changes not reflected | Reconciliation job |
| Status out of sync | User confusion | Polling, manual refresh |

### Monitoring

- Track portal session creation success
- Alert on webhook failures for portal events
- Monitor subscription status sync lag

## Path 5: Receipt Upload → Processing → Result

### Flow

```
1. Developer uploads receipt: POST /api/v1/receipts
   ↓
2. File stored (Supabase Storage or S3)
   ↓
3. Processing job queued
   ↓
4. OCR processing (AI service)
   ↓
5. Result stored in database
   ↓
6. Response returned to developer
```

### Failure Points & Mitigations

| Failure Point | Impact | Mitigation |
|--------------|--------|------------|
| File upload fails | Can't process | Retry, clear error |
| Storage unavailable | Upload fails | Fallback storage, retry |
| Processing queue full | Delayed processing | Queue monitoring, scaling |
| OCR service down | Processing fails | Retry queue, fallback provider |
| Result storage fails | Data loss | Retry, audit log |

### Monitoring

- Track upload success rate
- Monitor processing queue depth
- Alert on OCR service failures
- Track processing latency

## Path 6: Feature Flag Evaluation

### Flow

```
1. Developer calls: POST /api/v1/feature-flags/evaluate
   ↓
2. API validates key, finds flag config
   ↓
3. Evaluates flag (checks overrides, environment)
   ↓
4. Records evaluation (usage tracking)
   ↓
5. Returns flag value
```

### Failure Points & Mitigations

| Failure Point | Impact | Mitigation |
|--------------|--------|------------|
| Flag not found | Returns default | Graceful fallback |
| Evaluation fails | Returns default | Log error, return safe default |
| Usage tracking fails | Billing incorrect | Non-blocking, retry |

### Monitoring

- Track evaluation success rate
- Monitor evaluation latency (must be < 50ms)
- Alert on flag evaluation failures

## Path 7: Admin → Audit Logs → Investigation

### Flow

```
1. Admin visits /admin/audit-logs
   ↓
2. Queries audit logs: GET /api/admin/audit-logs
   ↓
3. Filters by user/tenant/action
   ↓
4. Views log details
```

### Failure Points & Mitigations

| Failure Point | Impact | Mitigation |
|--------------|--------|------------|
| Audit log query fails | Can't investigate | Error message, retry |
| Logs missing | Compliance risk | Alert on missing logs |
| Query timeout | Slow investigation | Pagination, indexes |

### Monitoring

- Track audit log query success rate
- Monitor query latency
- Alert on missing audit logs

## Global Failure Modes

### Database Unavailable

**Impact**: Most operations fail  
**Mitigation**:
- Read replicas for read operations
- Cached responses where possible
- Graceful error messages
- Retry logic

### Redis Unavailable

**Impact**: Rate limiting fails, queues stop  
**Mitigation**:
- Fallback to in-memory rate limiting
- Queue jobs retry when Redis returns
- Graceful degradation

### Stripe API Down

**Impact**: Billing operations fail  
**Mitigation**:
- Queue checkout requests for retry
- Show user-friendly error messages
- Manual reconciliation when Stripe returns

### Supabase Auth Down

**Impact**: Users can't log in  
**Mitigation**:
- Show maintenance page
- Cache session tokens locally
- Retry logic

## Health Checks

### Critical Endpoints

- `/api/status/health` - Overall system health
- `/api/status/health/db` - Database connectivity
- `/api/status/health/redis` - Redis connectivity
- `/api/status/health/stripe` - Stripe API connectivity

### Monitoring

- Health checks run every 30 seconds
- Alert if any health check fails
- Dashboard shows health status

## Recovery Procedures

### Webhook Reconciliation

If webhooks are missed:
```bash
# Manual reconciliation endpoint
POST /api/admin/billing/reconcile
{
  "billingAccountId": "...",
  "syncFromStripe": true
}
```

### Database Recovery

1. Check Supabase status page
2. Verify connection strings
3. Check RLS policies
4. Review audit logs

### Stripe Reconciliation

1. Query Stripe API for subscription status
2. Compare with database
3. Update database if mismatch
4. Alert on discrepancies

## Testing Critical Paths

### Automated Tests

- E2E tests for signup flow
- E2E tests for checkout flow
- Integration tests for webhook processing
- Load tests for API endpoints

### Manual Testing Checklist

- [ ] Landing page loads
- [ ] Signup flow works
- [ ] Checkout flow works
- [ ] Webhook processes correctly
- [ ] Billing page shows correct status
- [ ] API calls work with valid key
- [ ] Usage tracking works
- [ ] Feature flags evaluate correctly

## Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Signup failure rate | > 3% | > 10% |
| Checkout failure rate | > 2% | > 5% |
| Webhook failure rate | > 1% | > 5% |
| API error rate | > 1% | > 5% |
| Database latency | > 500ms | > 2s |
| API latency (p95) | > 1s | > 5s |

## Post-Incident Actions

After any critical path failure:

1. **Root Cause Analysis**
   - Review logs
   - Check monitoring dashboards
   - Identify failure point

2. **Fix Implementation**
   - Deploy fix
   - Verify fix works
   - Update monitoring

3. **Documentation Update**
   - Update this document if new failure mode
   - Add recovery procedure if needed
   - Update runbooks

4. **Prevention**
   - Add monitoring if missing
   - Improve error handling
   - Add tests
