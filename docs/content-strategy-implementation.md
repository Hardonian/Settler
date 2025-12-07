# Content Strategy Implementation Guide

**Date:** 2025-01-XX  
**Purpose:** Complete implementation guide for content strategy deliverables

---

## Executive Summary

This document provides implementation guidance for the complete content strategy system, including:

- All deliverables created
- Implementation priorities
- Code integration points
- Testing checklist
- Success metrics

---

## Deliverables Created

### 1. Content Surface Map

**File:** `docs/content_surface_map.md`

**Contents:**

- Complete inventory of all content locations
- Pages, components, system messages, notifications
- Copy quality issues identified
- Missing content opportunities
- Automation opportunities

**Use This For:**

- Understanding all content surfaces
- Prioritizing copy improvements
- Identifying integration points

---

### 2. Content Backfill Plan

**File:** `docs/content_backfill_plan.md`

**Contents:**

- Prioritized list of all missing content
- Proposed copy for each piece (short, medium, long variants)
- Tone recommendations
- Personalization opportunities

**Use This For:**

- Copy implementation
- Content creation
- Tone consistency

---

### 3. Monthly Cadence Engine

**File:** `docs/monthly_cadence_engine.md`

**Contents:**

- Complete 30-day trial sequence
- Paid monthly subscription cadence
- Email templates with dynamic fields
- Content gating strategy
- Retention system

**Use This For:**

- Email automation setup
- Lifecycle marketing
- User engagement

---

### 4. Email Template System

**Location:** `emails/`

**Structure:**

```
/emails/
  lifecycle/          # Lifecycle email templates
  shared/
    components/       # Reusable components
    styles/          # Email CSS
  fields/            # Dynamic field definitions
  README.md          # Email system documentation
```

**Use This For:**

- Email template implementation
- Dynamic field system
- Email automation

---

### 5. Marketing Strategy

**File:** `docs/marketing_strategy.md`

**Contents:**

- 7 content pillars
- Monthly publishing calendar
- SEO and discovery optimization
- Free vs paid content gating
- Social snippet generator

**Use This For:**

- Content marketing planning
- SEO optimization
- Content production

---

## Implementation Priorities

### Phase 1: Critical (Week 1-2)

**Priority:** Highest conversion impact

1. **Homepage Hero Rewrite**
   - File: `packages/web/src/app/page.tsx`
   - Status: ✅ Already improved (line 160)
   - Action: Verify copy matches recommendations

2. **Pricing Plan Descriptions**
   - File: `packages/web/src/app/pricing/page.tsx`
   - Action: Rewrite plan descriptions with outcome-focused language

3. **Signup Page Trial Messaging**
   - File: `packages/web/src/app/signup/page.tsx`
   - Action: Add "30-Day Free Trial" emphasis, "No credit card required"

4. **Lifecycle Email Templates**
   - Location: `emails/lifecycle/`
   - Action: Implement email automation system
   - Integration: `packages/api/src/lib/email.ts`

5. **Trial Countdown Banner**
   - Location: Dashboard components
   - Action: Create banner component with trial countdown
   - File: New component needed

---

### Phase 2: High Impact (Week 3-4)

**Priority:** Engagement and retention

1. **Content Gating Implementation**
   - File: `packages/web/src/components/PlanFeatureGate.tsx`
   - Status: ✅ Basic implementation exists
   - Action: Add gating to cookbooks, docs, playground

2. **User-Specific Dashboard**
   - File: `packages/web/src/app/dashboard/page.tsx`
   - Status: Currently shows public metrics
   - Action: Create user-specific reconciliation dashboard

3. **Upgrade Prompts**
   - Location: Throughout app
   - Action: Add context-aware upgrade prompts
   - Files: Multiple components

4. **Error Messages with Upgrade Prompts**
   - File: `packages/web/src/components/ui/error-state.tsx`
   - Action: Add trial-specific error messages

5. **Onboarding Hints**
   - File: `packages/web/src/components/OnboardingFlow.tsx`
   - Action: Add tooltips, help text, progress indicators

---

### Phase 3: Engagement (Week 5-6)

**Priority:** User experience polish

1. **Tooltip System**
   - Location: Throughout app
   - Action: Implement comprehensive tooltip system
   - Files: New component needed

2. **Success Messages**
   - Location: Various components
   - Action: Add contextual success messages with next steps

3. **Walkthrough System**
   - Location: First-time user experience
   - Action: Create guided tour/walkthrough
   - Files: New component needed

4. **Usage Limit Indicators**
   - Location: Playground, dashboard
   - Action: Show usage limits, prompt upgrade when reached

5. **Banner System**
   - Location: Dashboard, various pages
   - Action: Implement trial countdown, usage limits, feature unlock banners

---

### Phase 4: Content Production (Ongoing)

**Priority:** Long-term content marketing

1. **Blog Infrastructure**
   - Location: New `/blog` route
   - Action: Set up blog with content management

2. **Content Calendar Execution**
   - Reference: `docs/marketing_strategy.md`
   - Action: Start producing content per calendar

3. **SEO Optimization**
   - Location: All pages
   - Action: Implement SEO improvements from strategy

4. **Case Studies**
   - Location: New `/case-studies` route
   - Action: Create case study pages

---

## Code Integration Points

### 1. Email System Integration

**Current Implementation:**

- File: `packages/api/src/lib/email.ts`
- Status: Basic email sending with Resend

**Integration Steps:**

1. **Add Template Rendering:**

```typescript
// packages/api/src/lib/email-templates.ts
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import { join } from "path";

export async function renderEmailTemplate(
  templateName: string,
  data: Record<string, any>
): Promise<string> {
  const templatePath = join(process.cwd(), "emails", "lifecycle", `${templateName}.html`);
  const templateSource = readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(templateSource);
  return template(data);
}
```

2. **Add Lifecycle Email Functions:**

```typescript
// packages/api/src/lib/email-lifecycle.ts
import { sendEmail } from "./email";
import { renderEmailTemplate } from "./email-templates";

export async function sendTrialWelcomeEmail(
  user: { email: string; firstName: string },
  trialEndDate: string
) {
  const html = await renderEmailTemplate("trial_welcome", {
    user: { first_name: user.firstName },
    trial_end_date: trialEndDate,
    dashboard_url: `${process.env.APP_URL}/dashboard`,
    // ... other fields
  });

  return sendEmail({
    to: user.email,
    subject: "Welcome to Settler! 🎉",
    html,
    text: generatePlainText(html),
  });
}
```

3. **Add Email Triggers:**

```typescript
// packages/api/src/routes/users.ts (or similar)
// Trigger on user signup
await sendTrialWelcomeEmail(user, trialEndDate);

// packages/api/src/jobs/email-scheduler.ts
// Scheduled job for lifecycle emails
cron.schedule("0 9 * * *", async () => {
  // Send Day 7, 14, 21, 27-29 emails based on trial date
});
```

---

### 2. Content Gating Integration

**Current Implementation:**

- File: `packages/web/src/components/PlanFeatureGate.tsx`
- File: `config/plans.ts`

**Integration Steps:**

1. **Add Gating to Cookbooks:**

```typescript
// packages/web/src/app/cookbooks/page.tsx
import { PlanFeatureGate } from '@/components/PlanFeatureGate';

// In cookbook card:
<PlanFeatureGate
  userPlan={userPlan}
  contentId={cookbook.id}
  contentType="cookbook"
  title="Upgrade to Unlock"
  description="This advanced cookbook is available on Commercial plans."
  teaserContent={<TeaserContent>{cookbook.description}</TeaserContent>}
>
  {/* Full cookbook content */}
</PlanFeatureGate>
```

2. **Add Gating to Documentation:**

```typescript
// packages/web/src/app/docs/page.tsx
<PlanFeatureGate
  userPlan={userPlan}
  contentId="api-reference-advanced"
  contentType="doc"
  title="Upgrade to View Full Documentation"
>
  {/* Advanced docs content */}
</PlanFeatureGate>
```

3. **Add Usage Limits:**

```typescript
// packages/web/src/app/playground/page.tsx
const { runsToday, runsLimit } = usePlaygroundUsage();

if (runsToday >= runsLimit && userPlan === 'free') {
  return <UsageLimitReached limit={runsLimit} upgradeUrl="/pricing" />;
}
```

---

### 3. Dashboard Integration

**Current Implementation:**

- File: `packages/web/src/app/dashboard/page.tsx`
- Status: Shows public ecosystem metrics

**Integration Steps:**

1. **Create User Dashboard Component:**

```typescript
// packages/web/src/components/UserDashboard.tsx
export function UserDashboard({ user, userPlan, trialEndDate }) {
  return (
    <div>
      {userPlan === 'trial' && (
        <TrialCountdownBanner endDate={trialEndDate} />
      )}

      <UsageStats userPlan={userPlan} />

      <RecentReconciliations userId={user.id} />

      <QuickActions />

      <PersonalizedRecommendations user={user} />
    </div>
  );
}
```

2. **Add Trial Countdown Banner:**

```typescript
// packages/web/src/components/TrialCountdownBanner.tsx
export function TrialCountdownBanner({ endDate }: { endDate: string }) {
  const daysRemaining = calculateDaysRemaining(endDate);

  return (
    <Banner variant="warning">
      Your trial ends in {daysRemaining} days.{" "}
      <Link href="/pricing">Upgrade to unlock all features</Link>
    </Banner>
  );
}
```

---

### 4. Onboarding Integration

**Current Implementation:**

- File: `packages/web/src/components/OnboardingFlow.tsx`

**Integration Steps:**

1. **Add Pre-Test Questionnaire:**

```typescript
// packages/web/src/components/PreTestQuestionnaire.tsx
export function PreTestQuestionnaire({ onComplete }) {
  // Questions from content_backfill_plan.md
  // Save answers to user profile
  // Personalize experience based on answers
}
```

2. **Add Welcome Dashboard:**

```typescript
// packages/web/src/app/dashboard/page.tsx
// Show welcome content for first-time users
if (isFirstVisit) {
  return <WelcomeDashboard onComplete={markAsVisited} />;
}
```

---

## Testing Checklist

### Email Templates

- [ ] Test all lifecycle email templates render correctly
- [ ] Verify all dynamic fields are replaced
- [ ] Test in multiple email clients (Gmail, Outlook, Apple Mail)
- [ ] Test on mobile devices
- [ ] Verify plain text versions
- [ ] Check spam score
- [ ] Test unsubscribe functionality

### Content Gating

- [ ] Test gating on cookbooks (free vs paid)
- [ ] Test gating on documentation
- [ ] Test gating on playground features
- [ ] Verify upgrade prompts appear correctly
- [ ] Test teaser content displays properly

### Dashboard

- [ ] Test trial countdown banner
- [ ] Test usage limit indicators
- [ ] Test upgrade prompts
- [ ] Verify user-specific data displays
- [ ] Test personalized recommendations

### Onboarding

- [ ] Test pre-test questionnaire
- [ ] Verify welcome dashboard displays
- [ ] Test onboarding flow completion
- [ ] Verify personalization based on answers

---

## Success Metrics

### Conversion Metrics

**Trial → Paid:**

- Baseline: [Current conversion rate]
- Target: 25-30% conversion rate
- Measure: Trial signups → Paid conversions

**Content → Trial:**

- Target: 10% of content visitors sign up for trial
- Measure: Content views → Trial signups

### Engagement Metrics

**Email Engagement:**

- Open rate target: 30-40%
- Click-through rate target: 5-10%
- Conversion rate target: 2-5%

**Content Engagement:**

- Time on page: >2 minutes
- Bounce rate: <60%
- Social shares: Track per post

### Retention Metrics

**Trial Completion:**

- Target: 60% complete onboarding
- Target: 40% create first job
- Target: 30% run first reconciliation

**Paid Retention:**

- Monthly churn: <5%
- Annual retention: >80%

---

## Next Steps

1. **Review All Deliverables**
   - Read through all documentation
   - Understand the complete strategy
   - Identify immediate priorities

2. **Set Up Email System**
   - Install templating engine (Handlebars)
   - Integrate with Resend
   - Set up email scheduler

3. **Implement Content Gating**
   - Add gating to cookbooks
   - Add gating to documentation
   - Add usage limits to playground

4. **Create User Dashboard**
   - Build user-specific dashboard
   - Add trial countdown
   - Add usage stats

5. **Start Content Production**
   - Set up blog infrastructure
   - Create first blog post
   - Begin SEO optimization

---

## Support & Resources

**Documentation:**

- Content Surface Map: `docs/content_surface_map.md`
- Content Backfill Plan: `docs/content_backfill_plan.md`
- Monthly Cadence: `docs/monthly_cadence_engine.md`
- Marketing Strategy: `docs/marketing_strategy.md`
- Email System: `emails/README.md`

**Questions:**

- Content questions: content@settler.dev
- Technical questions: dev@settler.dev
- Marketing questions: marketing@settler.dev

---

**Report Generated:** 2025-01-XX  
**Status:** Complete - Ready for implementation
