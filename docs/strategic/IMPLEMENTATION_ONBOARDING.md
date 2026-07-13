# Implementation: Guided Onboarding Flow

**Priority:** 🔴 CRITICAL  
**ROI:** High retention and satisfaction - reduces time-to-value  
**Estimated Effort:** 3-4 days  
**Status:** Ready for Implementation

---

## Problem Statement

No structured onboarding flow after signup. Users are dropped into dashboard without guidance, leading to:

- High time-to-value
- Increased churn
- Support burden
- Poor first experience

---

## Solution Overview

Implement guided onboarding with:

1. Progress tracking
2. Step-by-step checklist
3. Contextual help and tooltips
4. Quick wins (first reconciliation job, API key, etc.)

---

## Implementation Plan

### Phase 1: Onboarding Schema (Day 1)

**File:** `prisma/schema.prisma` (additions)

```prisma
model OnboardingProgress {
  id                String    @id @default(uuid())
  userId            String    @db.Uuid @unique
  currentStep       String    @default("welcome")
  completedSteps    String[]  @default([])
  skippedSteps      String[]  @default([])
  progress          Int       @default(0) // 0-100
  completedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
  @@index([currentStep])
}
```

### Phase 2: Onboarding Service (Day 1-2)

**File:** `packages/web/src/lib/onboarding/service.ts` (NEW)

Track onboarding progress and provide next steps.

### Phase 3: Onboarding UI (Day 2-3)

**File:** `packages/web/src/components/onboarding/OnboardingWizard.tsx` (NEW)

Interactive onboarding wizard component.

### Phase 4: Dashboard Integration (Day 3-4)

**File:** `packages/web/src/app/dashboard/page.tsx`

Integrate onboarding wizard into dashboard.

---

## Onboarding Steps

1. **Welcome** - Product overview and value proposition
2. **Create API Key** - First API key creation
3. **Try Playground** - Test API in playground
4. **First Reconciliation** - Create first reconciliation job
5. **Invite Team** (optional) - Team collaboration setup
6. **Complete** - Onboarding complete, show dashboard

---

## Success Metrics

- Time to first API call: < 5 minutes
- Onboarding completion rate: > 70%
- Support tickets during onboarding: < 10%
- 7-day retention: > 60%

---

**Status:** Ready for implementation  
**Owner:** Product Team  
**Timeline:** 3-4 days
