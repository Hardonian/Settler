# GTM Conversion Flow - Phase 7

**Generated**: 2025-01-27

## Overview

This document validates the Go-To-Market (GTM) reality: pricing page, lead capture, conversion tracking, and cold conversion path simulation.

## Required Components

### 1. Pricing Page

#### Requirements

- [ ] Display pricing tiers (Free, Pro, Enterprise)
- [ ] Show feature comparisons
- [ ] Clear CTAs (Call-to-Action) buttons
- [ ] Track CTA clicks
- [ ] Mobile-responsive design

**Status**: ⚠️ **NEEDS IMPLEMENTATION**

**Evidence**:

- Pricing configuration exists: `packages/api/src/config/pricing.ts`
- Plan configuration: `packages/web/src/domain/billing/planConfig.ts`
- Pricing page UI needs to be created

**Next Steps**:

1. Create `/pricing` page component
2. Add pricing tier display
3. Add feature comparison table
4. Implement CTA tracking

### 2. Lead Capture

#### Requirements

- [ ] Email capture form
- [ ] Name capture (optional)
- [ ] Company name (optional)
- [ ] Lead source tracking
- [ ] Store leads in database
- [ ] Email validation

**Status**: ⚠️ **NEEDS IMPLEMENTATION**

**Evidence**:

- Database schema may support leads table
- Email service exists: `packages/api/src/services/email/`
- Lead capture form needs to be created

**Next Steps**:

1. Create leads table migration (if not exists)
2. Create lead capture API endpoint
3. Create lead capture form component
4. Implement email validation
5. Add lead source tracking

### 3. Conversion Tracking

#### Requirements

- [ ] Track sign-up conversions
- [ ] Track trial starts
- [ ] Track paid conversions
- [ ] Track feature usage
- [ ] Conversion funnel analytics
- [ ] Attribution tracking

**Status**: ⚠️ **PARTIAL**

**Evidence**:

- User lifecycle tracking exists: `supabase/migrations/20260120000008_user_lifecycle_tracking.sql`
- Usage tracking exists: `supabase/migrations/20260115000003_usage_tracking.sql`
- Conversion tracking needs to be implemented

**Next Steps**:

1. Create conversion events table
2. Implement conversion tracking API
3. Add conversion tracking to sign-up flow
4. Add conversion tracking to billing flow
5. Create conversion analytics dashboard

### 4. Cold Conversion Path Simulation

#### Requirements

- [ ] Simulate anonymous visitor
- [ ] Track page views
- [ ] Track CTA clicks
- [ ] Track form submissions
- [ ] Track sign-up completion
- [ ] Track trial activation
- [ ] Track first value delivery

**Status**: ⚠️ **NEEDS IMPLEMENTATION**

**Next Steps**:

1. Create conversion path simulation script
2. Test anonymous → sign-up flow
3. Test sign-up → trial flow
4. Test trial → paid conversion
5. Measure conversion rates

## Implementation Plan

### Phase 1: Pricing Page

**Files to Create**:

- `packages/web/src/app/pricing/page.tsx` - Pricing page component
- `packages/web/src/components/pricing/PricingTable.tsx` - Pricing table
- `packages/web/src/components/pricing/PricingTier.tsx` - Individual tier component

**API Endpoints**:

- `GET /api/pricing/tiers` - Get pricing tiers
- `POST /api/pricing/track-cta` - Track CTA clicks

### Phase 2: Lead Capture

**Files to Create**:

- `packages/web/src/components/lead-capture/LeadForm.tsx` - Lead capture form
- `packages/api/src/routes/leads.ts` - Lead capture API

**Database Migration**:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  source TEXT,
  campaign TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 3: Conversion Tracking

**Files to Create**:

- `packages/api/src/services/analytics/conversion-tracker.ts` - Conversion tracking service
- `packages/api/src/routes/analytics/conversions.ts` - Conversion API

**Database Migration**:

```sql
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  conversion_type TEXT NOT NULL, -- signup, trial, paid, feature_usage
  source TEXT,
  campaign TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 4: Cold Conversion Simulation

**Script to Create**:

- `scripts/simulate-cold-conversion.ts` - Conversion path simulation

**Simulation Steps**:

1. Anonymous page view → `/`
2. View pricing → `/pricing`
3. Click CTA → Track event
4. Fill lead form → Submit lead
5. Sign up → Create account
6. Start trial → Activate trial
7. First value → Complete onboarding
8. Convert to paid → Subscribe

## Tracking Implementation

### CTA Click Tracking

```typescript
// Track CTA clicks
async function trackCTAClick(ctaId: string, location: string, userId?: string) {
  await supabase.from("conversion_events").insert({
    event_type: "cta_click",
    cta_id: ctaId,
    location,
    user_id: userId,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}
```

### Conversion Tracking

```typescript
// Track conversions
async function trackConversion(
  userId: string,
  conversionType: "signup" | "trial" | "paid",
  source?: string
) {
  await supabase.from("conversions").insert({
    user_id: userId,
    conversion_type: conversionType,
    source,
    created_at: new Date(),
  });
}
```

## Analytics Dashboard

### Metrics to Track

1. **Traffic Metrics**
   - Page views
   - Unique visitors
   - Bounce rate
   - Time on site

2. **Conversion Metrics**
   - Sign-up rate
   - Trial activation rate
   - Paid conversion rate
   - Feature adoption rate

3. **Funnel Metrics**
   - Visitor → Lead
   - Lead → Sign-up
   - Sign-up → Trial
   - Trial → Paid

4. **Attribution Metrics**
   - Source attribution
   - Campaign attribution
   - Channel attribution

## Current Status

| Component            | Status                  | Evidence                   |
| -------------------- | ----------------------- | -------------------------- |
| Pricing Page         | ⚠️ Needs Implementation | Config exists, UI needed   |
| Lead Capture         | ⚠️ Needs Implementation | Schema needed, form needed |
| Conversion Tracking  | ⚠️ Partial              | Lifecycle tracking exists  |
| Cold Conversion Path | ⚠️ Needs Implementation | Simulation script needed   |

## Next Steps

1. **Immediate (Week 1)**
   - Create pricing page component
   - Implement CTA tracking
   - Create lead capture form

2. **Short-term (Week 2-3)**
   - Implement conversion tracking API
   - Create conversion events table
   - Build analytics dashboard

3. **Medium-term (Month 1)**
   - Implement cold conversion simulation
   - Test full conversion funnel
   - Measure conversion rates

## Evidence Files

- `packages/api/src/config/pricing.ts` - Pricing configuration
- `packages/web/src/domain/billing/planConfig.ts` - Plan configuration
- `supabase/migrations/20260120000008_user_lifecycle_tracking.sql` - User lifecycle
- `packages/api/src/services/email/` - Email service
