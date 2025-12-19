# Reality Validation Quick Start

**Generated**: 2025-01-27

## Overview

This guide provides quick instructions for executing the reality validation scripts to prove Settler is a real, functioning SaaS.

## Prerequisites

1. **Environment Variables**
   ```bash
   # Required for billing validation
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Required for all validations
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

2. **Dependencies**
   ```bash
   npm install
   ```

## Validation Scripts

### Phase 1: Money Reality

**Script**: `scripts/validate-billing-reality.ts`

**What it tests**:
- Creates test product and price
- Simulates successful payment
- Simulates failed payment
- Tests cancellation and downgrade
- Generates invoice and receipt
- Verifies entitlements update
- Tests graceful degradation

**Run**:
```bash
npm run validate:billing
```

**Output**: `billing_evidence.md`

### Phase 2: User Reality

**Script**: `scripts/validate-onboarding-reality.ts`

**What it tests**:
- Onboarding infrastructure exists
- Onboarding steps defined
- First-success path timing (< 3 minutes)
- Leave and return functionality
- Prior work visibility
- Zero-touch onboarding

**Run**:
```bash
npm run validate:onboarding
```

**Output**: `onboarding_success_path.md`

### Phase 3: Tenant Isolation

**Script**: `scripts/validate-tenant-isolation.ts`

**What it tests**:
- Direct DB cross-tenant access attempts
- API key isolation
- Usage data isolation
- RLS policies exist
- Write access isolation

**Run**:
```bash
npm run validate:tenant-isolation
```

**Output**: `tenant_isolation_report.md`

### Phase 4: Failure Injection

**Script**: `scripts/validate-failure-injection.ts`

**What it tests**:
- Missing environment variables
- Supabase connectivity failures
- Malformed input handling
- Expired session handling
- Rate limiting
- Safe mode configuration

**Run**:
```bash
npm run validate:failure-injection
```

**Output**: `failure_injection_results.md`

## Run All Validations

```bash
npm run validate:all
```

This will execute all validation scripts sequentially and generate all evidence documents.

## Evidence Documents

After running validations, the following documents will be generated:

1. `billing_evidence.md` - Phase 1 results
2. `onboarding_success_path.md` - Phase 2 results
3. `tenant_isolation_report.md` - Phase 3 results
4. `failure_injection_results.md` - Phase 4 results

## Additional Documentation

- `docs/reality-validation/admin_capabilities.md` - Admin capabilities (Phase 6)
- `docs/reality-validation/deploy_matrix.md` - Deployment matrix (Phase 5)
- `docs/reality-validation/gtm_conversion_flow.md` - GTM conversion flow (Phase 7)
- `docs/reality-validation/investor_readiness.md` - Investor readiness (Phase 8)
- `REALITY_REPORT.md` - Comprehensive reality report (Phase 9)

## Troubleshooting

### Stripe Validation Fails

**Error**: `STRIPE_SECRET_KEY not set`

**Solution**: Set `STRIPE_SECRET_KEY` in your `.env` file with a Stripe test key.

### Database Connection Fails

**Error**: `Connection refused` or `Authentication failed`

**Solution**: Verify `DATABASE_URL` is correct and database is accessible.

### Supabase Connection Fails

**Error**: `Invalid API key` or `Project not found`

**Solution**: Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct.

## Next Steps

After running validations:

1. **Review Evidence Documents**
   - Check `billing_evidence.md` for payment flow validation
   - Check `tenant_isolation_report.md` for security validation
   - Check `failure_injection_results.md` for resilience validation

2. **Address Failures**
   - Fix any failed tests
   - Re-run validation scripts
   - Update evidence documents

3. **Build Missing UI Components**
   - Pricing page (Phase 7)
   - Admin dashboard (Phase 6)
   - Metrics dashboard (Phase 8)

4. **Deploy to Additional Platforms**
   - Fly.io (Phase 5)
   - Render (Phase 5)
   - Docker (Phase 5)

## Support

For issues or questions:
- Check `REALITY_REPORT.md` for comprehensive status
- Review individual phase documentation
- Check validation script source code for details
