# Reality Scripts Summary

**Generated:** 2025-12-24  
**Note:** Scripts require full environment setup (dependencies, env vars). Documenting their purpose here.

## Scripts Identified

### 1. validate:billing (`scripts/validate-billing-reality.ts`)
**Purpose**: Validates end-to-end Stripe billing
- Creates test products/prices
- Simulates payments (success/failure)
- Tests cancellation/downgrade
- Verifies entitlement updates
- Checks graceful degradation

**Status**: Exists, requires STRIPE_SECRET_KEY

### 2. check:production (`scripts/check-production-readiness.ts`)
**Purpose**: Canonical production readiness check
**Steps**:
1. repo-integrity (workspaces, packages)
2. lint (all packages)
3. typecheck (all packages)
4. build (all deployable apps)
5. vercel-parity (Vercel build verification)
6. smoke-test (no hard 500s)

**Status**: Exists, comprehensive

### 3. verify:production-parity (`scripts/verify-production-parity.ts`)
**Purpose**: Production parity verification
**Steps**:
1. Schema introspection (requires DATABASE_URL)
2. Frontend-backend contract mapping
3. Edge functions verification
4. Pipe dream signal detection

**Status**: Exists, some steps optional

### 4. qa:reality (`playwright test tests/e2e/site-reality-audit.spec.ts`)
**Purpose**: E2E site reality audit
**Status**: Exists

### 5. qa:dom-reality (`playwright test --project=dom-reality`)
**Purpose**: DOM reality enforcement
**Status**: Exists

### 6. validate:onboarding (`scripts/validate-onboarding-reality.ts`)
**Purpose**: Onboarding flow validation
**Status**: Exists

### 7. validate:tenant-isolation (`scripts/validate-tenant-isolation.ts`)
**Purpose**: Tenant isolation checks
**Status**: Exists

## Gaps Identified

1. **No single "one button" command** - Need `qa:reality` that runs all checks
2. **Node version parity not enforced** - Engines says >=24, but no CI/Vercel pin
3. **No subscription gate verification** - Should test that gates don't fail open
4. **No value metrics check** - Value ledger doesn't exist yet

## Next Steps

- Create unified `qa:reality` script
- Add Node version checks
- Add subscription gate tests
- Implement value ledger (Phase 2)
