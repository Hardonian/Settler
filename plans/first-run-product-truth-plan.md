# Phase 3: First-Run Product Truth Implementation Plan

## Executive Summary

The goal is to make incompleteness truthful and navigable. The app should never betray the user by:
- Showing misleading blank states
- Having broken redirects
- Crashing when env or seed data is absent
- Implying production readiness where local config is incomplete
- Missing "what to do next" guidance
- Having dead CTAs in empty states
- Blurring distinctions between "nothing here yet" vs "setup incomplete" vs "feature unavailable"

---

## Current State Analysis

### ✅ Existing Good Patterns

1. **Environment Validation** (`/console/layout.tsx`)
   - Shows `EnvErrorPanel` when Supabase env vars are missing
   - Has setup-check diagnostics at `/console/setup-check`

2. **Tenant Boundary Handling** (`/app/layout.tsx`)
   - Has `SignedOutScreen` for unauthenticated users
   - Has `NoTenantScreen` for users without workspace assignment

3. **Empty State Components**
   - `BrandMessages.empty` in `messaging.ts` 
   - Consistent `EmptyState` components in `/components/ui/empty-state.tsx` and `/components/console/EmptyState.tsx`

4. **Demo Data Infrastructure**
   - `scripts/seed-demo.ts` generates demo data
   - Demo data exists in `demo/data/`

---

## Issues Identified

### 1. Homepage CTA Misleads
**Location:** `packages/web/src/app/page.tsx`
**Issue:** "Open Console" links to `/app/runs` without indicating:
- Login required (will redirect)
- Local setup may be incomplete
- No "what to do next" after clicking

### 2. No Local vs Production Context
**Issue:** No visual distinction between:
- Running locally (needs .env setup)
- Connected to production (works out of box)
- Missing demo data

### 3. NoTenantScreen Lacks Actionable Guidance  
**Location:** `packages/web/src/app/app/layout.tsx`
**Issue:** Shows "No workspace assigned" but:
- Doesn't explain how to create one
- No link to onboarding
- Links to docs which may not help

### 4. EnvErrorPanel Needs Enhancement
**Location:** `packages/web/src/components/env/EnvErrorPanel.tsx`
**Current:** Shows missing vars and links to setup-check
**Missing:**
- Clear distinction between "first run" vs "broken config"
- Quick actions for local dev

### 5. Empty States Lack Differentiation
**Location:** `packages/web/src/lib/brand/messaging.ts`
**Issue:** Messages like "No runs yet" don't clarify:
- Is this because no data seeded?
- Is this because setup incomplete?
- What should user do first?

### 6. Console Pages Have No First-Run Guidance
**Location:** Various console pages (`runs`, `api-keys`, `webhooks`, etc.)
**Issue:** Empty states show CTAs like "Create API Key" but:
- New users don't know what API key is for
- No onboarding flow guidance
- No demo data option

---

## Implementation Tasks

### Task 1: Enhance Homepage with Environment Context
**Files:** `packages/web/src/app/page.tsx`

**Changes:**
- Add environment indicator badge (Local Dev / Production)
- Modify CTA to show login requirement tooltip
- Add "Getting Started" section for first-time users

### Task 2: Improve NoTenantScreen with Setup Wizard
**Files:** `packages/web/src/app/app/layout.tsx`

**Changes:**
- Add link to workspace creation/onboarding
- Show "Create your workspace" as primary CTA
- Add admin contact info if already has access

### Task 3: Enhance EnvErrorPanel with First-Run Context
**Files:** `packages/web/src/components/env/EnvErrorPanel.tsx`

**Changes:**
- Detect if first-run (no .env.local exists)
- Show "Welcome - Let's get started" for first-run
- Add "Run seed data" button for local dev
- Show setup checklist progress

### Task 4: Differentiate Empty State Messages
**Files:** `packages/web/src/lib/brand/messaging.ts`

**Changes:**
Add new message categories:
```typescript
empty: {
  // Existing...
  runs: {
    noData: 'No reconciliation runs yet.',
    noSetup: 'Complete workspace setup to start running reconciliations.',
    noSeed: 'No demo data loaded. Run "pnpm demo:seed" to populate sample data.',
  },
  // Similar for apiKeys, webhooks, etc.
}
```

### Task 5: Add First-Run Guidance to Console Pages
**Files:** Various console pages (`/console/runs`, `/console/api-keys`, etc.)

**Changes:**
- Detect if first visit (no data + no setup)
- Show contextual "What to do next" panel
- Add "Load Demo Data" option for exploration

### Task 6: Add Demo Data Seeding to Empty States
**Files:** `packages/web/src/components/console/EmptyState.tsx`

**Changes:**
- Check if demo data exists
- If no data + first-run, show "Load Demo Data" CTA
- Link to appropriate seed script

### Task 7: Add Local Dev Mode Banner
**Files:** Create new `LocalDevBanner` component

**Changes:**
- Detect `NODE_ENV === 'development'`
- Show subtle banner when running locally
- Link to .env setup instructions

---

## Acceptance Criteria

1. **Homepage** - Shows appropriate context for local vs production
2. **First Visit** - Clear "Getting Started" path visible
3. **Empty States** - Always explain WHY empty and WHAT to do next
4. **No Crash** - Never 500 when env missing, always graceful degradation
5. **Demo Data** - Easy way to load sample data for exploration
6. **Setup Guidance** - Clear path from "no account" to "first reconciliation run"

---

## Key Files to Modify

| File | Change Type |
|------|-------------|
| `packages/web/src/app/page.tsx` | Enhancement |
| `packages/web/src/app/app/layout.tsx` | Enhancement |
| `packages/web/src/components/env/EnvErrorPanel.tsx` | Enhancement |
| `packages/web/src/lib/brand/messaging.ts` | New content |
| `packages/web/src/components/console/EmptyState.tsx` | Enhancement |
| `packages/web/src/components/ui/empty-state.tsx` | Enhancement |
| New: `packages/web/src/components/env/LocalDevBanner.tsx` | New component |

---

## Diagram: First-Run Flow

```
User visits homepage
        │
        ▼
┌───────────────────┐
│ Local or Prod?    │
└───────────────────┘
        │
   ┌────┴────┐
   ▼         ▼
Local     Production
   │         │
   ▼         ▼
┌───────────────────────┐
│ Show Env Setup CTA   │
│ (if .env missing)    │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Click "Open Console" │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Auth Check           │
└───────────────────────┘
        │
   ┌────┴────┐
   ▼         ▼
Signed Out  Signed In
   │         │
   ▼         ▼
┌────────┐  ┌───────────────────┐
│ Login  │  │ Tenant Check      │
│ Screen │  └───────────────────┘
└────────┘          │
               ┌────┴────┐
               ▼         ▼
         No Tenant    Has Tenant
               │         │
               ▼         ▼
        ┌───────────┐  ┌──────────────────┐
        │ NoTenant  │  │ Show Console     │
        │ Screen    │  │ with First-Run   │
        │ + Setup   │  │ Guidance         │
        │ Wizard    │  └──────────────────┘
        └───────────┘
```
