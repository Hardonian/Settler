# Content & Jargon Audit Report

**Date:** 2025-01-XX  
**Scope:** Marketing site and app UI content audit for clarity, brevity, and conversion optimization

---

## Executive Summary

This audit identifies content that is too technical, verbose, or jargon-heavy, and provides recommendations for simplification. The goal is to make the site feel clear, sharp, and benefit-driven while maintaining credibility and pushing toward a single primary action: **Start 30-Day Free Trial**.

---

## Page Inventory

### Table of Pages

| Route          | Purpose                                  | Primary CTA                           | Secondary CTAs                   | Funnel Stage               |
| -------------- | ---------------------------------------- | ------------------------------------- | -------------------------------- | -------------------------- |
| `/` (Homepage) | Top-of-funnel awareness, problem framing | "Start Free Trial" → `/playground`    | "View Documentation" → `/docs`   | Awareness                  |
| `/pricing`     | Bottom-of-funnel conversion              | "Start Free Trial" → `/playground`    | "Contact Sales" → `/enterprise`  | Conversion                 |
| `/enterprise`  | Mid-to-bottom funnel (enterprise leads)  | "Contact Sales" → `#demo-form`        | "View Pricing" → `/pricing`      | Consideration → Conversion |
| `/docs`        | Mid-funnel education                     | "Try Playground" → `/playground`      | "View Pricing" → `/pricing`      | Consideration              |
| `/playground`  | Top-to-mid funnel trial activation       | "Get API Key" → `/pricing`            | "View Documentation" → `/docs`   | Awareness → Consideration  |
| `/signup`      | Post-signup onboarding                   | "Create Account" → `/dashboard`       | "Go to Dashboard" → `/dashboard` | Post-Signup                |
| `/dashboard`   | Post-signup engagement                   | None (metrics display)                | N/A                              | Retention                  |
| `/cookbooks`   | Mid-funnel education/use cases           | "Try Playground" → `/playground`      | "View Documentation" → `/docs`   | Consideration              |
| `/community`   | Retention/engagement                     | None (community engagement)           | N/A                              | Retention                  |
| `/edge-ai`     | Feature education                        | "Deploy Edge Node" → `/edge-ai/nodes` | "Learn More" → `/edge-ai`        | Consideration              |

---

## Per-Page Analysis

### 1. Homepage (`/`)

**File:** `packages/web/src/app/page.tsx`

#### Issues Identified:

1. **Hero Section (Lines 157-173)**
   - **Issue Type:** Jargon + Verbosity
   - **Location:** Hero heading and description
   - **Current Text:**
     - Heading: "Make Reconciliation As Simple As Email"
     - Description: "Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems. One API. All platforms. Real-time."
   - **Problems:**
     - "Reconciliation" is technical jargon (should be benefit-first)
     - "Fragmented SaaS and e-commerce ecosystems" is verbose
     - Doesn't clearly state the pain point or outcome
   - **Suggested Target:** Grade 7-9 reading level, 1-2 short sentences
   - **Recommendation:**
     - Heading: "Stop Wasting Hours on Manual Financial Matching"
     - Description: "Automatically match transactions between any platforms. Get accurate results in minutes, not hours."

2. **Features Section (Lines 38-75)**
   - **Issue Type:** Feature-focused, not benefit-focused
   - **Location:** Features grid
   - **Problems:**
     - "5-Minute Integration" - good, but could be more outcome-focused
     - "Enterprise Security" - jargon (SOC 2, GDPR, PCI-DSS mentioned elsewhere)
     - "Real-Time Processing" - technical term
     - "99.7% Accuracy" - good metric, but needs context
     - "50+ Integrations" - feature, not benefit
     - "Complete Visibility" - vague
   - **Recommendation:** Rewrite to focus on outcomes:
     - "Get Started in 5 Minutes" → "Save 10+ Hours Per Week"
     - "Enterprise Security" → "Bank-Level Security" (simpler)
     - "Real-Time Processing" → "See Results Instantly"
     - "99.7% Accuracy" → "99.7% Accurate - No More Manual Errors"
     - "50+ Integrations" → "Works with Your Existing Tools"
     - "Complete Visibility" → "See Every Transaction Matched"

3. **Code Example Section (Lines 268-301)**
   - **Issue Type:** Too technical for homepage
   - **Location:** Code block section
   - **Problems:**
     - Full code example on homepage may intimidate non-technical visitors
     - Technical details (adapters, configs) should be gated
   - **Recommendation:**
     - Show simplified preview with "View Full Example" CTA
     - Gate detailed code behind trial signup

4. **Edge AI Section (Line 358)**
   - **Issue Type:** Advanced feature may confuse top-of-funnel visitors
   - **Location:** EdgeAIMarketingSection component
   - **Recommendation:** Move to mid-funnel or gate as paid feature

#### Primary CTA Issues:

- Hero CTA links to `/playground` instead of direct trial signup
- Multiple CTAs compete for attention
- No clear "30-Day Free Trial" messaging

---

### 2. Pricing Page (`/pricing`)

**File:** `packages/web/src/app/pricing/page.tsx`

#### Issues Identified:

1. **Hero Section (Lines 120-124)**
   - **Issue Type:** Unclear value proposition
   - **Current Text:** "Choose Your Plan" / "Start free, scale as you grow. All plans include our core reconciliation engine."
   - **Problems:**
     - "Reconciliation engine" is jargon
     - Doesn't explain what you get in free vs paid
   - **Recommendation:**
     - "Start Your 30-Day Free Trial"
     - "Try everything free for 30 days. No credit card required."

2. **Plan Descriptions (Lines 19-90)**
   - **Issue Type:** Technical limits, not outcomes
   - **Problems:**
     - "1,000 reconciliations/month" - what does this mean in practice?
     - "2 platform adapters" - technical term
     - "7-day log retention" - technical detail
     - Features list is feature-focused, not benefit-focused
   - **Recommendation:** Add outcome context:
     - "1,000 reconciliations/month" → "Perfect for small businesses (up to ~1,000 transactions/month)"
     - "2 platform adapters" → "Connect 2 platforms (e.g., Shopify + Stripe)"
     - Add "What you get" vs "What you unlock" sections

3. **FAQ Section (Lines 92-113)**
   - **Issue Type:** Technical explanations
   - **Problems:**
     - "OSS (Open Source)" explanation is technical
     - "14-day free trial" mentioned but should be "30-day"
   - **Recommendation:** Simplify and update to 30 days

#### Primary CTA Issues:

- "Start Free Trial" links to `/playground` - should link to signup/trial activation
- No clear differentiation between free tier and paid trial

---

### 3. Enterprise Page (`/enterprise`)

**File:** `packages/web/src/app/enterprise/page.tsx`

#### Issues Identified:

1. **Hero Section (Lines 70-80)**
   - **Issue Type:** Jargon-heavy
   - **Current Text:** "Enterprise-Grade Reconciliation Platform" / "Custom solutions for large organizations with advanced security, compliance, and scale requirements."
   - **Problems:**
     - "Enterprise-Grade" is buzzword
     - "Advanced security, compliance, and scale" is vague
   - **Recommendation:**
     - "Built for Enterprise Scale"
     - "Custom solutions with dedicated support, SSO, and unlimited scale."

2. **Features Grid (Lines 25-56)**
   - **Issue Type:** Feature list, not outcomes
   - **Problems:**
     - "SOC 2 Type II, SSO, SAML, RBAC" - acronym soup
     - "Unlimited Scale" - vague
     - "24/7 support with SLA guarantees" - technical
   - **Recommendation:** Add benefit context:
     - "Enterprise Security" → "Meet Compliance Requirements (SOC 2, GDPR, PCI-DSS)"
     - "Unlimited Scale" → "Handle Millions of Transactions"
     - "24/7 Support" → "Get Help When You Need It (Under 4-Hour Response)"

3. **Benefits Section (Lines 160-209)**
   - **Issue Type:** Good structure, but could be more outcome-focused
   - **Recommendation:** Add ROI/outcome metrics where possible

---

### 4. Documentation Page (`/docs`)

**File:** `packages/web/src/app/docs/page.tsx`

#### Issues Identified:

1. **Introduction (Lines 26-34)**
   - **Issue Type:** Technical definition
   - **Current Text:** "Settler is a Open Source Reconciliation Engine API that automates financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems."
   - **Problems:**
     - "Open Source Reconciliation Engine API" is jargon
     - "Fragmented SaaS and e-commerce ecosystems" is verbose
   - **Recommendation:**
     - "Settler automatically matches transactions between any two platforms—Shopify to Stripe, QuickBooks to PayPal, and more. No manual work required."

2. **API Reference Section (Lines 104-185)**
   - **Issue Type:** Should be gated for paid users
   - **Recommendation:** Show teaser for free users, full docs for paid

---

### 5. Playground Page (`/playground`)

**File:** `packages/web/src/app/playground/page.tsx`

#### Issues Identified:

1. **Hero Section (Lines 114-118)**
   - **Issue Type:** Technical focus
   - **Current Text:** "Try Settler API" / "Test the API, see examples, and experiment with reconciliation jobs"
   - **Problems:**
     - "API" and "reconciliation jobs" are technical terms
   - Doesn't emphasize free trial value
   - **Recommendation:**
     - "Try Settler Free for 30 Days"
     - "Test our platform with real examples. No credit card required."

2. **Code Editor Section**
   - **Issue Type:** Full code access should be gated
   - **Recommendation:** Show simplified demo, gate full access behind trial

---

### 6. Cookbooks Page (`/cookbooks`)

**File:** `packages/web/src/app/cookbooks/page.tsx`

#### Issues Identified:

1. **Hero Section (Lines 454-463)**
   - **Issue Type:** Technical language
   - **Current Text:** "Pre-built reconciliation workflows and recipes for common use cases."
   - **Recommendation:**
     - "Ready-to-use templates for common scenarios. Copy, customize, deploy."

2. **Cookbook Cards**
   - **Issue Type:** Some cookbooks should be gated (advanced features)
   - **Recommendation:**
     - Free: Basic e-commerce, scheduled reconciliations
     - Paid: Real-time webhooks, multi-currency, advanced analytics

---

### 7. Signup Page (`/signup`)

**File:** `packages/web/src/app/signup/page.tsx`

#### Issues Identified:

1. **Hero Section (Lines 104-109)**
   - **Issue Type:** Unclear value proposition
   - **Current Text:** "Join the Community" / "Create your account to participate in the ecosystem"
   - **Problems:**
     - "Ecosystem" is vague
     - Doesn't mention free trial
   - **Recommendation:**
     - "Start Your Free Trial"
     - "Create your account and get 30 days free. No credit card required."

2. **Data Flow Info (Lines 128-135)**
   - **Issue Type:** Technical detail that shouldn't be on signup page
   - **Recommendation:** Remove or move to developer docs

---

### 8. Dashboard Page (`/dashboard`)

**File:** `packages/web/src/app/dashboard/page.tsx`

#### Issues Identified:

1. **Purpose Confusion**
   - **Issue Type:** This appears to be a public metrics dashboard, not a user dashboard
   - **Problems:**
     - Shows ecosystem metrics, not user-specific data
     - No clear CTA for trial users
   - **Recommendation:**
     - If this is public: Add CTA to start trial
     - If this is user dashboard: Show user-specific reconciliation data

---

## Top 10 Priority Sections for Rewriting

### Priority 1: Homepage Hero (Critical - Highest Traffic)

- **File:** `packages/web/src/app/page.tsx` (Lines 157-173)
- **Issue:** Jargon-heavy, not benefit-driven
- **Impact:** First impression, highest conversion potential
- **Target:** Grade 7-9, 1-2 sentences, clear outcome

### Priority 2: Pricing Hero & Plan Descriptions

- **File:** `packages/web/src/app/pricing/page.tsx` (Lines 120-124, 19-90)
- **Issue:** Technical limits, unclear value
- **Impact:** Direct conversion page
- **Target:** Outcome-focused, clear free vs paid boundaries

### Priority 3: Homepage Features Section

- **File:** `packages/web/src/app/page.tsx` (Lines 38-75)
- **Issue:** Feature-focused, not benefit-focused
- **Impact:** High visibility, conversion influence
- **Target:** Benefit-first language, outcome metrics

### Priority 4: Signup Page Hero

- **File:** `packages/web/src/app/signup/page.tsx` (Lines 104-109)
- **Issue:** Unclear value, no trial messaging
- **Impact:** Conversion friction
- **Target:** Clear "30-Day Free Trial" messaging

### Priority 5: Playground Hero

- **File:** `packages/web/src/app/playground/page.tsx` (Lines 114-118)
- **Issue:** Technical focus, no trial emphasis
- **Impact:** Trial activation page
- **Target:** Trial-first messaging

### Priority 6: Enterprise Hero & Features

- **File:** `packages/web/src/app/enterprise/page.tsx` (Lines 70-80, 25-56)
- **Issue:** Jargon-heavy, acronym soup
- **Impact:** Enterprise lead generation
- **Target:** Simplified, outcome-focused

### Priority 7: Docs Introduction

- **File:** `packages/web/src/app/docs/page.tsx` (Lines 26-34)
- **Issue:** Technical definition, jargon
- **Impact:** Mid-funnel education
- **Target:** Plain language, benefit-first

### Priority 8: Homepage Code Example

- **File:** `packages/web/src/app/page.tsx` (Lines 268-301)
- **Issue:** Too technical, should be gated
- **Impact:** May intimidate non-technical visitors
- **Target:** Simplified preview, gate full code

### Priority 9: Cookbooks Hero

- **File:** `packages/web/src/app/cookbooks/page.tsx` (Lines 454-463)
- **Issue:** Technical language
- **Impact:** Use case education
- **Target:** Plain language, outcome-focused

### Priority 10: Pricing FAQ

- **File:** `packages/web/src/app/pricing/page.tsx` (Lines 92-113)
- **Issue:** Technical explanations, wrong trial length
- **Impact:** Conversion objections
- **Target:** Simplified answers, correct trial info

---

## Common Patterns & Recommendations

### Jargon to Replace:

- "Reconciliation" → "Matching transactions" or "Matching payments"
- "Open Source Reconciliation Engine API" → "Automatic transaction matching"
- "Fragmented SaaS and e-commerce ecosystems" → "Different platforms"
- "Platform adapters" → "Platform connections" or "Integrations"
- "Enterprise-Grade" → "Built for enterprise" or "Enterprise-ready"
- "Real-time processing" → "Instant results" or "See results immediately"

### Verbosity Issues:

- Long paragraphs should be split into 2-3 short sentences
- Feature lists should be bullet points, not paragraphs
- Technical explanations should be simplified or moved to docs

### Missing Elements:

- Clear "30-Day Free Trial" messaging on key pages
- Outcome-focused language (save time, reduce errors, increase accuracy)
- Clear free vs paid boundaries
- Social proof/testimonials with specific outcomes

---

## Next Steps

1. **Phase 2:** Map pages to funnel stages and define free vs paid content boundaries
2. **Phase 3:** Design 30-day trial cadence and conversion flow
3. **Phase 4:** Implement copy rewrites and content gating

---

**Report Generated:** 2025-01-XX  
**Next Review:** After Phase 4 implementation
