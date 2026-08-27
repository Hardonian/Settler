# Settler — Operations Runbook

Standard operating procedures for running the Settler platform. Designed for a small ops team or solo operator.

## 1. Incident Response

### Application Errors (Sentry)

- **Trigger:** Sentry alert indicating an unhandled exception in the API or console.
- **Action:**
  1. Check the Sentry dashboard for the stack trace and affected tenant.
  2. If the error is in the API control plane, check recent deployments via `git log -5`.
  3. If the error is in the console, check for client-side hydration issues or missing data.
  4. If severity warrants, revert the latest deployment via the Vercel dashboard.

### Reconciliation Exceptions

- **Trigger:** Operator notices elevated unmatched transaction count in the console's exception review queue.
- **Action:**
  1. Open the Settler Console → Exception Review.
  2. Review the unmatched transactions and their tolerance violations.
  3. Adjudicate each exception (approve, reject, or flag for further review).
  4. If a pattern emerges, adjust tolerance rules for the affected job configuration.

### Tenant Isolation Breach (Critical)

- **Trigger:** Cross-tenant test failure in CI, or manual discovery of tenant data leakage.
- **Action:**
  1. Immediately freeze the affected tenant via the governance middleware.
  2. Run `pnpm run verify:tenant-isolation` and `pnpm run test:cross-tenant` to assess scope.
  3. Engage incident response per [SECURITY.md](SECURITY.md).
  4. Document findings in a postmortem using the template in `docs/INCIDENT_POSTMORTEM_TEMPLATE.md`.

## 2. AI Feature Management

### BYOK Key Configuration

- **Issue:** A customer reports that AI-assisted features are not available.
- **Resolution:** Direct the customer to verify their OpenAI API key in tenant settings. When the key is missing or invalid, the platform operates in `verified_degraded` state — all core reconciliation and evidence features work normally without AI assistance.

### Monitoring Degraded State

- **Procedure:** Check the ops daily report (`pnpm run ops:daily`) for tenants operating in degraded state. Degraded state is an explicit, documented mode — not a failure condition.

## 3. Financial Operations

### Stripe Billing

- **Monitoring:** Subscription tier enforcement is handled by the billing middleware. Usage events are recorded per reconciliation run.
- **Reporting:** Revenue = Sum of subscription fees + (total transactions × per-transaction rate).
- **Overages:** Handled automatically via Stripe metered billing.

### Trial Lifecycle

- **Automation:** Trial lifecycle emails (day 7, day 14, expiry) are managed by the email lifecycle service. Monitor via `pnpm run ops:daily`.

## 4. Deployment Pipeline

- **Branching:** All work on feature branches. `main` must remain green.
- **Pre-commit:** Husky runs ESLint, Prettier, and type-checking before every commit.
- **CI/CD:** Pushing to `main` triggers a Vercel production build. All PRs must pass `pnpm verify`.
- **Pre-deploy checklist:** Run `pnpm run build` locally before pushing major changes.

## 5. Verification Commands Reference

```bash
pnpm run doctor              # Comprehensive environment diagnostic
pnpm run ops:daily           # Daily operational report
pnpm run ops:doctor          # Full health check (lint, typecheck, build, routes)
pnpm run verify:fast         # Fast verification profile
pnpm run verify:full         # Complete release verification
pnpm run verify:security     # Security posture check
```

## 6. Escalation Path

| Severity                        | Response Time     | Action                                           |
| ------------------------------- | ----------------- | ------------------------------------------------ |
| P0 — Data loss or tenant breach | Immediate         | Freeze tenant, engage incident response          |
| P1 — Service outage             | < 1 hour          | Check Vercel/Supabase status, rollback if needed |
| P2 — Feature degradation        | < 4 hours         | Investigate, document, schedule fix              |
| P3 — Non-critical bug           | Next business day | Triage and assign                                |
