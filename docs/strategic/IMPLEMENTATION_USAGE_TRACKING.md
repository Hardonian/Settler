# Implementation: Usage Tracking & Billing Enforcement

**Priority:** 🔴 CRITICAL  
**ROI:** Direct revenue impact - prevents revenue leakage  
**Estimated Effort:** 2-3 days  
**Status:** Ready for Implementation

---

## Problem Statement

Current usage tracking implementation always allows requests without checking actual usage against limits. This causes:

- Revenue leakage (users exceeding limits without enforcement)
- Inaccurate billing
- Poor unit economics visibility

---

## Solution Overview

Implement database-backed usage tracking with:

1. Real-time usage counters (Redis + PostgreSQL)
2. Rate limiting enforcement at API level
3. Usage dashboard for visibility
4. Automated billing enforcement

---

## Implementation Plan

### Phase 1: Database Schema (Day 1)

**File:** `prisma/schema.prisma` (additions)

```prisma
model UsageCounter {
  id                String   @id @default(cuid())
  billingAccountId String
  service           String   // 'reconcile', 'receipts', 'featureFlags', 'playground'
  period           String   // 'daily', 'monthly'
  periodStart      DateTime
  count            Int      @default(0)
  limit            Int
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  billingAccount   BillingAccount @relation(fields: [billingAccountId], references: [id], onDelete: Cascade)

  @@unique([billingAccountId, service, period, periodStart])
  @@index([billingAccountId, service, period])
}

model UsageEvent {
  id                String   @id @default(cuid())
  billingAccountId String
  service           String
  operation         String
  quantity          Int      @default(1)
  metadata          Json?
  createdAt         DateTime @default(now())

  billingAccount    BillingAccount @relation(fields: [billingAccountId], references: [id], onDelete: Cascade)

  @@index([billingAccountId, service, createdAt])
  @@index([createdAt])
}
```

### Phase 2: Usage Tracking Service (Day 1-2)

**File:** `packages/web/src/lib/usage/tracking.ts` (NEW)

```typescript
/**
 * Usage Tracking Service
 *
 * Tracks and enforces usage limits for billing accounts.
 */

import { prisma } from "@/shared/db/prismaClient";
import { Redis } from "@/lib/redis/client";

export type ServiceCode = "reconcile" | "receipts" | "featureFlags" | "playground";
export type Period = "daily" | "monthly";

interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  reason?: string;
}

/**
 * Get current usage for a billing account and service
 */
export async function getCurrentUsage(
  billingAccountId: string,
  service: ServiceCode,
  period: Period = "monthly"
): Promise<UsageCheckResult> {
  // Implementation details in actual file
}

/**
 * Check if usage is allowed and increment if so
 */
export async function checkAndIncrementUsage(
  billingAccountId: string,
  service: ServiceCode,
  quantity: number = 1,
  period: Period = "monthly"
): Promise<UsageCheckResult> {
  // Implementation details in actual file
}
```

### Phase 3: Update Subscription Service (Day 2)

**File:** `packages/web/src/lib/console/subscription.ts`

Update `canMakePlaygroundRequest()` to use real usage tracking.

### Phase 4: API Middleware Integration (Day 2-3)

**File:** `packages/web/src/middleware/usage-enforcement.ts` (NEW)

Create middleware that enforces usage limits before processing requests.

### Phase 5: Usage Dashboard (Day 3)

**File:** `packages/web/src/app/console/usage/page.tsx`

Update to show real-time usage vs. limits with visual indicators.

---

## Testing Strategy

1. **Unit Tests:** Usage tracking logic
2. **Integration Tests:** API enforcement
3. **E2E Tests:** Full flow from request to billing
4. **Load Tests:** Performance under high usage

---

## Migration Plan

1. Deploy database migration
2. Deploy code changes (backward compatible)
3. Enable usage tracking gradually (feature flag)
4. Monitor for issues
5. Full rollout

---

## Rollback Plan

1. Feature flag to disable enforcement
2. Keep old code path as fallback
3. Database migration is additive (no breaking changes)

---

## Success Metrics

- Usage tracking accuracy: 99.9%+
- Billing enforcement: 100% of requests checked
- Performance impact: <10ms overhead
- Revenue leakage: 0%

---

**Status:** Ready for implementation  
**Owner:** Engineering Team  
**Timeline:** 2-3 days
