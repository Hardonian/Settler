# Settler Implementation Discovery Notes

## Current Architecture Overview

### Data Flow
```
Next.js App Router → API Route Handler → Supabase/Prisma → UI Components
```

### Key Findings

#### 1. Database Schema
- **Tenants**: `tenants` table with `tenant_users` for membership (Supabase)
- **Reconciliation**: `recon_jobs`, `recon_results`, `recon_graph_nodes` (Supabase)
- **Receipts**: Uses Prisma with `billingAccount` model (mixed approach)
- **Alerts**: `alerts` table exists (Supabase)
- **Feature Flags**: `tenant_feature_flags` table exists (Supabase)

#### 2. Current Issues

**RLS Policies:**
- RLS uses `current_setting('app.current_tenant_id')` which must be set in middleware
- Prisma bypasses RLS - receipts domain manually verifies `billingAccountId` ownership
- Need unified tenant resolution

**Receipts:**
- Uses Prisma (`billingAccount` model) instead of Supabase tenant system
- No hash chain for tamper-evident receipts
- No "why this matters" explanations
- Missing evidence references

**Reconciliation:**
- Mostly mock/demo implementation (`/api/v1/recon/jobs`)
- No meaningful change detection
- No impact ranking
- No "why this matters" engine

**Alerts:**
- Basic implementation exists
- No business policy flags for thresholds
- No explanation of why alert triggered

**Feature Flags:**
- Legacy system exists (`/lib/features/flags.ts`)
- Not aligned to business policy (alert thresholds, sensitivity, etc.)
- Need registry with typed definitions

**500 Errors:**
- Console page has good error handling (no hard 500s found)
- API routes return empty arrays/objects on error (defensive)
- Need to verify all routes follow this pattern

#### 3. File Structure

**API Routes:**
- `/api/console/receipts` - Uses Prisma, returns empty array on error
- `/api/v1/recon/jobs` - Mock implementation, returns demo data
- `/api/console/alerts` - Basic Supabase query

**Domain Logic:**
- `/domain/console/receipts.ts` - Prisma-based, manual tenant verification
- `/domain/billing/reconciliation.ts` - Stripe reconciliation (not data reconciliation)

**UI Pages:**
- `/console/receipts` - Good error handling, empty states
- `/console/playground/reconcile` - Mock reconciliation UI
- `/console/page.tsx` - Comprehensive error handling

#### 4. Missing Components

1. **Meaningful Changes Feed**
   - No "what changed" view with impact ranking
   - No explanation engine
   - No confidence scoring

2. **Receipt Integrity**
   - No hash chain
   - No canonical JSON serialization
   - No evidence references

3. **Judgment Layer**
   - No rules engine for "why this matters"
   - No impact calculation
   - No urgency scoring

4. **Feature Flags Registry**
   - No typed registry
   - No business policy mapping
   - No validation

5. **Service Layer**
   - No unified `/lib/server/settler/*` service functions
   - Queries scattered across domain files

## Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│  /console, /api/console/*, /api/v1/recon/*                  │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              API Route Handlers (Error Boundaries)           │
│  - Input validation (Zod)                                    │
│  - Tenant resolution (session → tenant_id)                   │
│  - Error handling (never 500, graceful degradation)        │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Service Layer (/lib/server/settler/*)           │
│  - listMeaningfulChanges()                                   │
│  - runReconciliation()                                       │
│  - createReceipt()                                           │
│  - listAlerts()                                              │
│  - getFeatureFlags()                                         │
└──────────────────────┬──────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│   Supabase       │          │     Prisma       │
│   (Tenants,      │          │   (Receipts,     │
│    Recon,        │          │    Billing)      │
│    Alerts)       │          │                  │
└──────────────────┘          └──────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              RLS Policies (Tenant Isolation)                 │
│  - All tables: tenant_id = current_setting('app.tenant_id') │
│  - Prisma bypasses RLS → manual verification in code        │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Foundation (Current)
1. ✅ Discovery complete
2. ⏳ Create domain types (`/lib/domain/*`)
3. ⏳ Fix any 500 routes
4. ⏳ DB migrations for missing columns
5. ⏳ RLS hardening

### Phase 2: Service Layer
1. ⏳ Create `/lib/server/settler/*` service functions
2. ⏳ Add Zod validators
3. ⏳ Tenant resolution middleware

### Phase 3: Core Features
1. ⏳ Meaningful changes feed
2. ⏳ Reconciliation with impact ranking
3. ⏳ Receipt hash chain
4. ⏳ "Why this matters" rules engine

### Phase 4: UI & Polish
1. ⏳ Update console views
2. ⏳ Feature flags registry
3. ⏳ Alerts with explanations
4. ⏳ Verification & testing

## Implementation Status

### ✅ Completed

1. ✅ Domain types created (`/lib/domain/types.ts`)
2. ✅ Judgment layer rules engine (`/lib/judgment/rules.ts`)
3. ✅ Service layer (`/lib/server/settler/*`)
4. ✅ Feature flags registry (`/lib/flags/registry.ts`)
5. ✅ DB migrations for receipts (hash, prev_hash, evidence_refs)
6. ✅ RLS hardening (tenant isolation)
7. ✅ API routes with error handling
8. ✅ Receipt hash chain implementation

### ⏳ Pending (Follow-up)

1. ⏳ UI components for meaningful changes feed
2. ⏳ UI components for reconciliation view
3. ⏳ UI components for receipts with hash display
4. ⏳ UI components for alerts with explanations
5. ⏳ UI components for feature flags (business policy)
6. ⏳ TypeScript compilation verification (needs dependencies)
7. ⏳ Runtime smoke tests
8. ⏳ Integration tests for RLS

## Next Steps

1. Install dependencies and run typecheck
2. Create UI components for new features
3. Add integration tests
4. Deploy migrations to production
5. Monitor for 500 errors
