# Settler.dev Security Deployment Guide

**Version:** 1.0  
**Last Updated:** 2025-01-20  
**Status:** Production Ready

---

## Overview

This guide provides step-by-step instructions for deploying the security fortifications and defense moat implementations to Settler.dev production environment.

---

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key  # Generate: openssl rand -hex 32

# Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_...
SHOPIFY_WEBHOOK_SECRET=your-shopify-secret
PAYPAL_WEBHOOK_SECRET=your-paypal-secret

# Alerting
RESEND_API_KEY=re_...
TELEGRAM_BOT_TOKEN=your-telegram-token
WHATSAPP_API_KEY=your-whatsapp-key

# Allowed Origins
ALLOWED_ORIGINS=https://app.settler.dev,https://settler.dev
```

### 2. Database Backup

**CRITICAL:** Backup database before deploying migrations.

```bash
# Using Supabase CLI
supabase db dump -f backup-$(date +%Y%m%d).sql

# Or using pg_dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 3. Staging Environment

Deploy to staging first and test all security features:

```bash
# Deploy to staging
supabase db push --db-url $STAGING_DATABASE_URL
```

---

## Deployment Steps

### Step 1: Deploy Database Migrations

**Order of migration deployment:**

1. `20250120000002_billing_rls_policies.sql` - RLS policies
2. `20250120000003_billing_security_enhancements.sql` - Fraud detection
3. `20250120000004_integration_credentials_schema.sql` - Credential storage
4. `20250120000005_audit_logging_enhancements.sql` - Audit logging
5. `20250120000006_monitoring_alerting_system.sql` - Monitoring
6. `20250120000007_ai_safety_layer.sql` - AI safety

**Deploy using Supabase CLI:**

```bash
# Navigate to migrations directory
cd supabase/migrations

# Deploy all migrations
supabase db push

# Or deploy individually
supabase migration up 20250120000002_billing_rls_policies
supabase migration up 20250120000003_billing_security_enhancements
# ... etc
```

**Or using SQL directly:**

```bash
# Connect to database
psql $DATABASE_URL

# Run migrations in order
\i supabase/migrations/20250120000002_billing_rls_policies.sql
\i supabase/migrations/20250120000003_billing_security_enhancements.sql
# ... etc
```

### Step 2: Verify RLS Policies

After deploying RLS policies, verify they're working:

```sql
-- Test: Try to access another tenant's billing account (should fail)
SET request.jwt.claims = '{"sub": "user-1-id", "tenant_id": "tenant-1-id"}';
SELECT * FROM billing_accounts WHERE id = 'other-tenant-billing-account-id';
-- Should return 0 rows (RLS blocking)
```

### Step 3: Deploy Edge Functions

**Deploy secure Edge Functions:**

```bash
# Deploy log-usage-secure
supabase functions deploy log-usage-secure

# Deploy send-alert-notifications
supabase functions deploy send-alert-notifications

# Deploy secure integration syncs
supabase functions deploy integration-sync-shopify-secure
# ... etc for other integrations
```

**Update existing functions:**

Replace old functions with secure versions:

```bash
# Backup old function
supabase functions deploy log-usage --no-verify-jwt

# Deploy secure version
supabase functions deploy log-usage-secure
```

### Step 4: Configure Cron Jobs

**Set up cron jobs for:**

1. **Alert notifications** (every 5 minutes):

```sql
SELECT cron.schedule(
  'send-alert-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-alert-notifications',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  );
  $$
);
```

2. **Reset daily AI quotas** (daily at midnight):

```sql
SELECT cron.schedule(
  'reset-daily-ai-quotas',
  '0 0 * * *',
  $$ SELECT reset_daily_ai_quotas(); $$
);
```

3. **Reset monthly AI quotas** (monthly on 1st):

```sql
SELECT cron.schedule(
  'reset-monthly-ai-quotas',
  '0 0 1 * *',
  $$ SELECT reset_monthly_ai_quotas(); $$
);
```

4. **Cleanup expired idempotency keys** (daily):

```sql
SELECT cron.schedule(
  'cleanup-idempotency-keys',
  '0 2 * * *',
  $$ SELECT cleanup_expired_idempotency_keys(); $$
);
```

5. **Check and suspend abusive accounts** (hourly):

```sql
SELECT cron.schedule(
  'suspend-abusive-accounts',
  '0 * * * *',
  $$ SELECT * FROM check_and_suspend_abusive_accounts(); $$
);
```

### Step 5: Update API Routes

**Update Next.js API routes to use security middleware:**

```typescript
// packages/web/src/app/api/example/route.ts
import { withAPISecurity } from "@/lib/security/api-security";
import { rateLimiters } from "@/lib/security/rate-limiter";

export const POST = withAPISecurity(
  async (req: NextRequest) => {
    // Your handler
  },
  {
    rateLimit: "api",
    requireAuth: true,
    requireCSRF: true,
    maxRequestSize: 1024 * 1024, // 1MB
  }
);
```

### Step 6: Configure Alert Rules

**Set up default alert rules:**

```sql
-- Update email recipients for alerts
UPDATE alert_rules
SET email_recipients = ARRAY['security@settler.dev', 'ops@settler.dev']
WHERE rule_name = 'fraud_usage_spike';

UPDATE alert_rules
SET email_recipients = ARRAY['security@settler.dev']
WHERE rule_name = 'rate_limit_exceeded';

-- Enable webhook notifications (optional)
UPDATE alert_rules
SET notify_webhook = true,
    webhook_url = 'https://your-webhook-endpoint.com/alerts'
WHERE rule_name = 'cost_threshold';
```

### Step 7: Test Security Features

**Run security test suite:**

```bash
# Run tests
npm test -- packages/api/src/security/__tests__/security.test.ts

# Or using Jest directly
jest packages/api/src/security/__tests__/security.test.ts
```

**Manual testing:**

1. **Rate Limiting:**

   ```bash
   # Make 101 requests quickly (should get 429)
   for i in {1..101}; do
     curl https://api.settler.dev/api/test
   done
   ```

2. **RLS Policies:**

   ```sql
   -- Test tenant isolation
   SET request.jwt.claims = '{"sub": "user-1"}';
   SELECT * FROM billing_accounts; -- Should only see own accounts
   ```

3. **Fraud Detection:**
   ```sql
   -- Trigger fraud signal (usage spike)
   SELECT log_usage_event(
     'billing-account-id',
     'test_event',
     10000, -- Large quantity
     NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
   );
   -- Check fraud_signals table
   SELECT * FROM fraud_signals ORDER BY created_at DESC LIMIT 1;
   ```

---

## Post-Deployment Verification

### 1. Check Migration Status

```sql
-- Verify all migrations applied
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

### 2. Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'billing_accounts',
    'subscriptions',
    'usage_events',
    'integration_credentials'
  );
```

### 3. Test Alert System

```sql
-- Create test alert
INSERT INTO alerts (
  alert_type,
  severity,
  title,
  message,
  tenant_id
) VALUES (
  'test',
  'low',
  'Test Alert',
  'This is a test alert',
  'test-tenant-id'
);

-- Check notification was sent
SELECT * FROM alert_notifications
WHERE alert_id = (SELECT id FROM alerts WHERE title = 'Test Alert')
ORDER BY created_at DESC;
```

### 4. Monitor Logs

**Check for errors:**

```bash
# Supabase logs
supabase functions logs log-usage-secure --tail

# Application logs
# Check your logging service (Datadog, Sentry, etc.)
```

---

## Rollback Plan

### If Issues Occur

**1. Rollback Migrations:**

```bash
# Rollback last migration
supabase migration down

# Or manually rollback
psql $DATABASE_URL -f rollback_script.sql
```

**2. Disable RLS (Emergency Only):**

```sql
-- EMERGENCY ONLY: Disable RLS
ALTER TABLE billing_accounts DISABLE ROW LEVEL SECURITY;
-- ... repeat for other tables
```

**3. Revert Edge Functions:**

```bash
# Redeploy old version
supabase functions deploy log-usage --no-verify-jwt
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Security Metrics:**
   - Rate limit violations
   - Fraud signals
   - Failed authentication attempts
   - RLS policy violations

2. **Performance Metrics:**
   - API response times
   - Edge function execution times
   - Database query performance

3. **Business Metrics:**
   - Usage events logged
   - Billing calculations
   - Integration sync success rates

### Alert Thresholds

Configure alerts for:

- **Critical:** >10 fraud signals/hour, >1000 rate limit violations/hour
- **High:** >5 integration failures/hour, >$1000 AI cost/day
- **Medium:** >100 failed auth attempts/hour

---

## Security Checklist

- [ ] All migrations deployed
- [ ] RLS policies verified
- [ ] Edge functions deployed
- [ ] Cron jobs configured
- [ ] Alert rules configured
- [ ] Environment variables set
- [ ] Security tests passing
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Team trained on new security features

---

## Support

For issues or questions:

- **Security Team:** security@settler.dev
- **Documentation:** `/docs/settler-defense-moat.md`
- **Runbook:** `/docs/INCIDENT_RUNBOOK.md`

---

**Last Updated:** 2025-01-20
