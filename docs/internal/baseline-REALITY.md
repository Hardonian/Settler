# Baseline Reality Report

**Generated:** 2025-01-27  
**Purpose:** Document current state of Settler monorepo before SaaS transformation

## Current Product Loop (As Implemented)

### Entry → Connect → Reconcile → Outcome → Upgrade

1. **Entry**: User signs up (`/signup`) → Creates Supabase auth user → Gets billing account
2. **Connect**: User creates `IngestionSource` (CSV, Stripe, Shopify, etc.) → Connects via adapters
3. **Reconcile**: User creates `ReconJob` → Runs `ReconciliationRun` → Produces `ReconciliationMatch` records
4. **Outcome**: User exports results (`Export` model) → Reviews exceptions → Closes books
5. **Upgrade**: User hits limits → Redirected to `/pricing?next=/console` → Stripe checkout → Webhook updates subscription

**Key Files:**
- `packages/web/src/app/console/layout.tsx` - Console entry gate
- `packages/web/src/lib/auth/console-gate.ts` - Auth + subscription checks
- `prisma/schema.prisma` - Core models: `ReconJob`, `ReconciliationRun`, `ReconciliationMatch`, `IngestionSource`, `NormalizedTransaction`

## Current Gating

### Authentication Gates
- **Location**: `packages/web/src/lib/auth/console-gate.ts`
- **Behavior**: 
  - Unauthenticated → Redirects to `/signup?next=/console`
  - Authenticated but no subscription → Redirects to `/pricing?next=/console`
  - **CRITICAL ISSUE**: Subscription check "fails open" on error (line 55, 92) - grants paid access if Stripe/DB fails

### Public Routes (No Auth Required)
- **Location**: `packages/web/middleware.ts` lines 38-46
- **Routes**: `/playground`, `/pricing`, `/trust`, `/cookbook`, `/cookbooks`, `/runbooks`, `/schematics`
- **Behavior**: Always render, even if Supabase fails (fail-open pattern)

### Console Routes (Auth + Subscription Required)
- **Location**: `packages/web/src/app/console/layout.tsx`
- **Gate Function**: `requireConsoleAccess()` 
- **Behavior**: Server-side check → Redirects if denied
- **Issue**: Fails open on subscription check errors (line 55 in console-gate.ts)

### Feature-Level Gates
- **Location**: `packages/web/src/lib/subscription-access.ts`
- **Tiers**: `unsubscribed`, `subscribed_unpaid`, `subscribed_paid`, `enterprise`
- **Access Levels**: Defined in `ACCESS_LEVELS` constant (lines 40-93)
- **Enforcement**: Scattered across components using `getSubscriptionStatus()`

## Current Monetization Wiring

### Stripe Integration
- **Webhook Handler**: `packages/web/src/app/api/stripe/webhook/route.ts`
- **Events Handled**: 
  - `checkout.session.completed` → Creates subscription
  - `customer.subscription.created/updated/deleted` → Syncs subscription
  - `invoice.paid` → Updates status to 'active'
  - `invoice.payment_failed` → Updates status to 'past_due'
- **Idempotency**: Database-backed via `StripeEvent` table
- **Status**: Functional but subscription sync may fail silently

### Database Schema
- **BillingAccount**: Links user → Stripe customer
- **Subscription**: Stores plan_id, plan_name, status, period dates
- **Plan IDs**: `base`, `pro`, `enterprise` (from schema.prisma line 52)
- **Usage Tracking**: `UsageEvent`, `UsageAggregateDaily`, `UsageCounter` tables exist

### Pricing Page
- **Location**: `packages/web/src/app/pricing/page.tsx`
- **Plans Displayed**: Starter ($99), Growth ($299), Enterprise (Custom)
- **Limits Shown**: Reconciliation volumes (10k, 100k, unlimited)
- **Issue**: Pricing copy doesn't match enforcement - no centralized entitlement check

### Subscription Status Detection
- **Location**: `packages/web/src/lib/get-subscription-status.ts`
- **Logic**: Queries `subscriptions` table → Determines tier via `determineSubscriptionTier()`
- **Fallback**: Returns `unsubscribed` on any error (fail-safe)
- **Issue**: Multiple code paths for same check (console-gate.ts, subscription-access.ts, get-subscription-status.ts)

## Current Operational Checks

### Reality Scripts (from package.json)

1. **validate:billing** (`scripts/validate-billing-reality.ts`)
   - Creates test Stripe products/prices
   - Simulates payments, cancellations
   - Verifies entitlement updates
   - **Status**: Exists, tests Stripe integration

2. **check:production** (`scripts/check-production-readiness.ts`)
   - Runs: repo-integrity → lint → typecheck → build → vercel-parity → smoke-test
   - **Status**: Comprehensive but doesn't verify Node version parity

3. **verify:production-parity** (`scripts/verify-production-parity.ts`)
   - Runs: schema introspection → contract mapping → edge functions → pipe dream detection
   - **Status**: Exists but may require DATABASE_URL

4. **qa:reality** (`playwright test tests/e2e/site-reality-audit.spec.ts`)
   - E2E tests for site reality
   - **Status**: Exists

5. **qa:dom-reality** (`playwright test --project=dom-reality`)
   - DOM reality enforcement tests
   - **Status**: Exists

### Gaps in Reality Scripts
- No single "one button" command that runs all checks
- Node version parity not enforced (engines says >=24, but no CI/Vercel pin)
- No verification that subscription gates don't fail open
- No test for value metrics/ledger (doesn't exist yet)

## Known Risks

### Node Engine Requirements
- **Current**: `package.json` engines specifies `node >= 24.0.0`
- **Risk**: Vercel may use different Node version → Build/runtime mismatch
- **Missing**: 
  - `vercel.json` with Node version pin
  - GitHub Actions `setup-node` version pin
  - Boot-time Node version check

### Environment Validation
- **Current**: `packages/web/src/lib/env/validator.ts` exists (referenced in console layout)
- **Behavior**: Console shows friendly error if Supabase env missing
- **Gap**: No validation for Stripe env vars in user routes (webhook has it, but user routes don't)

### Subscription Check Fail-Open
- **Location**: `packages/web/src/lib/auth/console-gate.ts` lines 50-56, 89-93
- **Risk**: If Stripe/DB fails, users get paid access without payment
- **Impact**: Revenue leakage, security issue

### Pricing Enforcement Scattered
- **Current**: Multiple places check subscription:
  - `console-gate.ts` - Console access
  - `subscription-access.ts` - Feature access
  - `get-subscription-status.ts` - Status detection
  - `pricing-gate.ts` - UI gating
- **Risk**: Inconsistency, hard to maintain, easy to miss a gate

### Missing Value Metrics
- **Current**: No value ledger or metrics tracking
- **Impact**: Can't prove ROI to users or investors
- **Gap**: No DB table for value events (reconciliations completed, receipts processed, etc.)

### Fragile Routes
- **Current**: Middleware has try/catch, but some routes may still 500
- **Risk**: User-facing routes could hard fail
- **Mitigation**: Middleware fails open for public routes (good), but console routes could still error

### "Pipe Dream" Sections
- **Current**: Script exists to detect pipe dreams (`verify:pipe-dreams`)
- **Risk**: Features claimed but not implemented
- **Status**: Need to run this check

## File References

### Core Gating
- `packages/web/middleware.ts` - Route hardening, trace IDs, public route bypass
- `packages/web/src/app/console/layout.tsx` - Console gate with env validation
- `packages/web/src/lib/auth/console-gate.ts` - **FAILS OPEN ON ERROR** (line 55, 92)

### Subscription/Billing
- `packages/web/src/lib/get-subscription-status.ts` - Status detection (fails safe)
- `packages/web/src/lib/subscription-access.ts` - Tier definitions
- `packages/web/src/lib/pricing-gate.ts` - UI-level gating
- `packages/web/src/app/api/stripe/webhook/route.ts` - Webhook handler
- `prisma/schema.prisma` - BillingAccount, Subscription, UsageEvent models

### Product Loop
- `prisma/schema.prisma` - ReconJob, ReconciliationRun, ReconciliationMatch, IngestionSource
- `packages/web/src/app/pricing/page.tsx` - Pricing UI (may not match enforcement)

### Reality Scripts
- `scripts/validate-billing-reality.ts` - Billing validation
- `scripts/check-production-readiness.ts` - Production check
- `scripts/verify-production-parity.ts` - Parity verification

## Next Steps

1. **Fix fail-open subscription gates** - Replace with "temporarily unavailable" message
2. **Centralize entitlements** - Single source of truth for plan → features
3. **Add value ledger** - Track measurable outcomes
4. **Lock Node version** - Vercel + CI + boot check
5. **Run reality scripts** - Capture outputs, identify gaps
