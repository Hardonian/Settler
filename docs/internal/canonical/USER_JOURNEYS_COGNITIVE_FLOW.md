# Settler.dev — Canonical User Journeys & Cognitive Flow (Mobile-First)

**Version:** 1.0  
**Date:** January 2026  
**Status:** FINALIZED — PHASE III COMPLETE  
**Classification:** Internal — Canonical Reference

---

## Purpose

This document ensures Settler makes sense end-to-end for real users on real screens. It maps user journeys, identifies cognitive friction points, and provides mobile-first audit findings.

**This document is non-negotiable.** All UX decisions must align with these journey maps and friction analysis.

---

## Journey Map 1: First-Time Visitor

### Persona
- **Role:** Finance Manager / Developer at small e-commerce business
- **Pain Point:** Spending 2-3 hours daily manually matching Stripe payments to Shopify orders
- **Goal:** Understand if Settler solves their problem
- **Context:** First time hearing about Settler, on mobile phone during commute

### Journey Flow

```
1. Lands on homepage (/)
   ↓
2. Reads hero headline and subheadline
   ↓
3. Scrolls through features section
   ↓
4. Checks pricing page (/pricing)
   ↓
5. Reads FAQ or documentation
   ↓
6. Decision: Sign up or leave
```

### Cognitive Friction Points

#### 1. Hero Headline (Mobile)
**Where:** Homepage hero section
**Current:** "Automate Financial Reconciliation in Minutes, Not Hours"
**Problem:** 
- "Reconciliation" is jargon—user may not understand
- Doesn't clearly state the problem being solved
- On mobile, headline may be cut off or require scrolling

**Fix:**
- **Headline:** "Stop Manually Matching Payments to Orders"
- **Subheadline:** "Settler automatically matches your Stripe payments with Shopify orders, QuickBooks entries, and 50+ other platforms. No more spreadsheets, no more errors—just accurate financial records."
- **Mobile:** Ensure headline fits on one line (max 40 characters), subheadline wraps cleanly

#### 2. Feature Names (Mobile)
**Where:** Features section
**Current:** "Reconcile Anything," "Deterministic Convert," "Developer-First Flags"
**Problem:**
- Technical terms don't explain benefits
- On mobile, feature cards stack vertically—too much scrolling
- Feature descriptions are too long for mobile screens

**Fix:**
- **Feature Names:** "Match Transactions Automatically," "Accurate Currency Conversion," "Feature Flags for Developers"
- **Mobile:** Use accordion/collapsible sections to reduce scrolling
- **Descriptions:** One sentence per feature, benefit-focused

#### 3. Pricing Jargon (Mobile)
**Where:** Pricing page
**Current:** "Pay per reconciliation. Exceptions requiring review cost extra."
**Problem:**
- "Reconciliation" and "exception" aren't defined
- On mobile, pricing cards are stacked—hard to compare
- No explanation of what user is actually paying for

**Fix:**
- **Add "How It Works" section before pricing cards:**
  - "What is a reconciliation? A reconciliation is when Settler matches one transaction (like a Stripe payment) to another (like a Shopify order). Each match counts as one reconciliation."
  - "What are exceptions? Exceptions are transactions that Settler can't match automatically. Settler explains why they don't match, so you can review them quickly."
- **Mobile:** Use tabs or accordion for pricing tiers to reduce scrolling

#### 4. Code Example Too Early
**Where:** Homepage, before playground section
**Current:** Code example appears after features
**Problem:**
- Code intimidates non-developers
- On mobile, code blocks are hard to read
- No playground option before code

**Fix:**
- **Add "Try Playground" section before code example**
- **Move code example after playground section**
- **Mobile:** Show playground link prominently, code example in collapsible section

### Mobile Audit: First-Time Visitor

#### Reading Order
- ✅ Hero headline appears first (above fold on mobile)
- ❌ Features section requires scrolling (too long)
- ❌ Pricing page requires scrolling (too long)
- **Fix:** Use accordion/collapsible sections, reduce content density

#### Text Density
- ❌ Hero subheadline too long (3 lines on mobile)
- ❌ Feature descriptions too long (2-3 lines each)
- ❌ Pricing descriptions too long (4-5 lines per card)
- **Fix:** Reduce to 1-2 lines per section, use progressive disclosure

#### Hierarchy Clarity
- ✅ Headline is largest text
- ❌ Subheadline same size as body text (should be smaller)
- ❌ Feature names same size as descriptions (should be larger)
- **Fix:** Establish clear typographic hierarchy (headline > subheadline > feature name > description)

#### Hidden or Collapsed Actions
- ❌ "Try Playground" not visible above fold
- ❌ "Sign Up" button below fold on mobile
- ❌ "Get Started" CTA buried in features section
- **Fix:** Make primary CTAs sticky or always visible, add "Try Playground" button in hero

---

## Journey Map 2: Trial User

### Persona
- **Role:** Developer at mid-market SaaS company
- **Pain Point:** Building custom reconciliation code that breaks when platforms change APIs
- **Goal:** Get Settler working in production within 24 hours
- **Context:** Just signed up, logged into Console for first time

### Journey Flow

```
1. Signs up (/signup)
   ↓
2. Redirected to Console (/console)
   ↓
3. Sees onboarding wizard
   ↓
4. Gets API key
   ↓
5. Tries playground or installs SDK
   ↓
6. Creates first reconciliation run
   ↓
7. Views first results
   ↓
8. Decision: Continue or abandon
```

### Cognitive Friction Points

#### 1. Signup Page Expectations
**Where:** Signup page
**Current:** "Create your account and reconciliation starts automatically. No credit card required."
**Problem:**
- "Starts automatically" is vague—user doesn't know what happens next
- No clear next steps
- On mobile, signup form may feel overwhelming

**Fix:**
- **Hero:** "Create your account and get instant access to Settler. You'll start with 1,000 free reconciliations per month—perfect for testing."
- **Add "What happens next" section:**
  - "Get your API key (takes 30 seconds)"
  - "Try the playground (no code required)"
  - "Connect your first integration (Stripe, Shopify, etc.)"
- **Mobile:** Use single-column form, reduce fields, add progress indicator

#### 2. Console Dashboard Sequencing
**Where:** Console dashboard (/console)
**Current:** Shows everything at once (wizard, stats, actions)
**Problem:**
- New users don't know where to start
- Too many options overwhelm user
- On mobile, dashboard is cluttered

**Fix:**
- **Welcome banner:** "Welcome! Your first step: Get your API key"
- **Onboarding wizard:** Don't allow dismissing until Step 1 complete
- **Quick stats:** Show "Start using Settler to see your stats here" if zeros
- **Quick actions:** Show only "Get API Key" and "Try Playground" initially
- **Mobile:** Use single-column layout, hide secondary actions behind "More" menu

#### 3. Onboarding Wizard Guidance
**Where:** Onboarding wizard component
**Current:** Title: "Getting Started," allows skip on all steps, can be dismissed immediately
**Problem:**
- Wizard feels optional—user may skip important steps
- No clear progress indicator
- On mobile, wizard may cover entire screen

**Fix:**
- **Title:** "Complete Setup (2 minutes)"
- **Don't allow dismissing until Step 1 complete**
- **After Step 1, allow dismissing but show reminder banner**
- **Mobile:** Use full-screen modal on mobile, sidebar on desktop

#### 4. API Key Generation
**Where:** Console API keys page
**Current:** API key generation may fail silently or show unclear errors
**Problem:**
- User doesn't know if API key was created successfully
- No clear copy button or usage instructions
- On mobile, API key may be cut off or hard to copy

**Fix:**
- **Show success message:** "API key created successfully"
- **Add copy button:** One-click copy with confirmation
- **Add usage instructions:** "Use this key in your API requests: `Authorization: Bearer <key>`"
- **Mobile:** Use full-width input with copy button below, ensure key is fully visible

#### 5. Playground vs SDK Choice
**Where:** Console dashboard, after API key creation
**Current:** User must choose between playground and SDK without guidance
**Problem:**
- User doesn't know which to use first
- No clear recommendation
- On mobile, both options may be hidden or hard to find

**Fix:**
- **Recommendation:** "New to Settler? Try the playground first (no code required)"
- **Show playground link prominently:** Large button above SDK installation instructions
- **Mobile:** Show playground as primary CTA, SDK as secondary

### Mobile Audit: Trial User

#### Reading Order
- ✅ Welcome banner appears first
- ❌ Onboarding wizard may be dismissed before completion
- ❌ Quick stats appear before user has data (confusing)
- **Fix:** Sequence content: welcome → wizard → stats (only if data exists)

#### Text Density
- ❌ Console dashboard too dense (stats, actions, wizard all visible)
- ❌ Onboarding wizard steps too long (2-3 paragraphs each)
- **Fix:** Reduce content density, use progressive disclosure, shorter wizard steps

#### Hierarchy Clarity
- ✅ Welcome banner is prominent
- ❌ Quick stats same size as quick actions (should be smaller)
- ❌ Onboarding wizard title same size as step content (should be larger)
- **Fix:** Establish clear hierarchy: welcome > wizard > stats > actions

#### Hidden or Collapsed Actions
- ❌ "Try Playground" hidden in quick actions (should be prominent)
- ❌ "Get API Key" hidden in navigation (should be in welcome banner)
- **Fix:** Make primary actions (Get API Key, Try Playground) always visible

---

## Journey Map 3: Paying Customer

### Persona
- **Role:** Finance Manager at growing e-commerce business
- **Pain Point:** Managing exceptions and ensuring accuracy as transaction volume grows
- **Goal:** Monitor reconciliation accuracy, handle exceptions efficiently
- **Context:** Using Settler in production, checking Console weekly

### Journey Flow

```
1. Logs into Console (/console)
   ↓
2. Views reconciliation reports (/console/reconciliation-view)
   ↓
3. Reviews exceptions (/console/reconciliation-view?tab=exceptions)
   ↓
4. Checks usage and billing (/console/billing)
   ↓
5. Adjusts matching rules if needed (/console/runs/[runId])
   ↓
6. Exports reports for accounting
```

### Cognitive Friction Points

#### 1. Reconciliation Reports Clarity
**Where:** Reconciliation view page
**Current:** May show "matches" and "exceptions" without clear definitions
**Problem:**
- User may not understand what "matches" vs "exceptions" mean
- No clear explanation of report structure
- On mobile, reports may be hard to read

**Fix:**
- **Add report header:** "Reconciliation Report: 1,234 matches, 12 exceptions"
- **Define terms:** "Matches: Transactions that Settler matched automatically. Exceptions: Transactions that need your review."
- **Mobile:** Use tabs for matches/exceptions, ensure tables are scrollable

#### 2. Exception Handling Guidance
**Where:** Exception report page
**Current:** Shows exceptions but may not explain why they don't match or how to fix
**Problem:**
- User doesn't know why exception occurred
- No clear action items
- On mobile, exception details may be cut off

**Fix:**
- **Add exception explanation:** "This transaction doesn't match because: [reason]"
- **Add action items:** "Suggested actions: [list]"
- **Mobile:** Use accordion for exception details, ensure full explanation is visible

#### 3. Usage and Billing Clarity
**Where:** Billing page (/console/billing)
**Current:** May show usage but not explain what counts toward limits
**Problem:**
- User may not understand what "reconciliations" means in billing context
- No clear explanation of overage charges
- On mobile, billing table may be hard to read

**Fix:**
- **Add usage explanation:** "Reconciliations: Number of transaction matches processed this month"
- **Add overage explanation:** "Overage: Usage beyond plan limits, charged at $0.001 per reconciliation"
- **Mobile:** Use cards instead of table, ensure all information is visible

#### 4. Matching Rule Adjustment
**Where:** Reconciliation run detail page
**Current:** May allow rule adjustment but not explain impact
**Problem:**
- User doesn't know how rule changes affect matching
- No preview of rule changes
- On mobile, rule configuration may be complex

**Fix:**
- **Add rule impact preview:** "This rule change will affect approximately X transactions"
- **Add rule explanation:** "This rule matches transactions by [field] with [tolerance]"
- **Mobile:** Use step-by-step wizard for rule configuration, ensure each step is clear

### Mobile Audit: Paying Customer

#### Reading Order
- ✅ Reconciliation reports appear first
- ❌ Exception details may be buried in tabs
- ❌ Billing information may require scrolling
- **Fix:** Ensure key information (matches, exceptions, usage) is visible above fold

#### Text Density
- ❌ Exception reports too dense (multiple exceptions per page)
- ❌ Billing table too dense (multiple rows)
- **Fix:** Use pagination or infinite scroll, reduce rows per page on mobile

#### Hierarchy Clarity
- ✅ Report header is prominent
- ❌ Exception details same size as exception list (should be smaller)
- ❌ Billing table headers same size as data (should be larger)
- **Fix:** Establish clear hierarchy: report header > exception list > exception details

#### Hidden or Collapsed Actions
- ❌ "Export report" hidden in menu (should be prominent)
- ❌ "Adjust rules" hidden in run detail page (should be visible)
- **Fix:** Make primary actions (Export, Adjust Rules) always visible

---

## Journey Map 4: Admin / Operator

### Persona
- **Role:** DevOps Engineer / Platform Operator
- **Pain Point:** Monitoring system health, handling errors, ensuring compliance
- **Goal:** Monitor Settler operations, handle incidents, ensure data accuracy
- **Context:** Daily monitoring, incident response, compliance audits

### Journey Flow

```
1. Logs into Console (/console)
   ↓
2. Checks system health (/console/performance)
   ↓
3. Reviews error logs (/console/alerts-view)
   ↓
4. Monitors usage and costs (/console/costs)
   ↓
5. Reviews audit logs (/console/activity)
   ↓
6. Handles incidents or escalates
```

### Cognitive Friction Points

#### 1. System Health Clarity
**Where:** Performance monitoring page
**Current:** May show metrics but not explain what's normal vs abnormal
**Problem:**
- Operator doesn't know if metrics are healthy
- No clear alerts or thresholds
- On mobile, metrics may be hard to read

**Fix:**
- **Add health indicators:** Green/yellow/red status for each metric
- **Add thresholds:** "Normal: <100ms latency, <1% error rate"
- **Mobile:** Use cards for each metric, ensure status is visible

#### 2. Error Log Clarity
**Where:** Alerts view page
**Current:** May show errors but not explain severity or impact
**Problem:**
- Operator doesn't know which errors to prioritize
- No clear action items
- On mobile, error details may be cut off

**Fix:**
- **Add severity indicators:** Critical/High/Medium/Low
- **Add impact explanation:** "This error affects X% of transactions"
- **Add action items:** "Suggested actions: [list]"
- **Mobile:** Use accordion for error details, ensure full explanation is visible

#### 3. Usage and Cost Clarity
**Where:** Costs page (/console/costs)
**Current:** May show costs but not explain what drives costs
**Problem:**
- Operator doesn't know how to reduce costs
- No clear cost breakdown
- On mobile, cost table may be hard to read

**Fix:**
- **Add cost breakdown:** "Costs: API calls (X%), Storage (Y%), Processing (Z%)"
- **Add cost optimization tips:** "Reduce costs by: [list]"
- **Mobile:** Use cards instead of table, ensure all information is visible

#### 4. Audit Log Clarity
**Where:** Activity feed page
**Current:** May show activity but not explain what each action means
**Problem:**
- Operator doesn't know which activities are important
- No clear filtering or search
- On mobile, activity feed may be too long

**Fix:**
- **Add activity explanations:** "This action: [explanation]"
- **Add filtering:** Filter by user, action type, date range
- **Mobile:** Use infinite scroll, ensure filters are accessible

### Mobile Audit: Admin / Operator

#### Reading Order
- ✅ System health appears first
- ❌ Error logs may require scrolling
- ❌ Audit logs may be too long
- **Fix:** Ensure key information (health status, critical errors) is visible above fold

#### Text Density
- ❌ Error logs too dense (multiple errors per page)
- ❌ Audit logs too dense (multiple activities per page)
- **Fix:** Use pagination or infinite scroll, reduce items per page on mobile

#### Hierarchy Clarity
- ✅ Health status is prominent
- ❌ Error details same size as error list (should be smaller)
- ❌ Audit log entries same size as headers (should be smaller)
- **Fix:** Establish clear hierarchy: health status > error list > error details

#### Hidden or Collapsed Actions
- ❌ "Export logs" hidden in menu (should be prominent)
- ❌ "Filter errors" hidden in menu (should be visible)
- **Fix:** Make primary actions (Export, Filter) always visible

---

## Explicit Mobile Audit

### Reading Order

**Issues:**
- Hero headline may be cut off on mobile (requires horizontal scroll)
- Features section requires too much scrolling
- Pricing page requires too much scrolling
- Console dashboard requires too much scrolling

**Fixes:**
- Ensure all text fits within viewport width (no horizontal scroll)
- Use accordion/collapsible sections to reduce vertical scrolling
- Prioritize content: show most important information first
- Use progressive disclosure: show summary first, details on tap

### Text Density

**Issues:**
- Hero subheadline too long (3 lines on mobile)
- Feature descriptions too long (2-3 lines each)
- Pricing descriptions too long (4-5 lines per card)
- Console dashboard too dense (stats, actions, wizard all visible)

**Fixes:**
- Reduce to 1-2 lines per section
- Use progressive disclosure: show summary first, details on tap
- Increase spacing between sections
- Use cards instead of dense tables

### Hierarchy Clarity

**Issues:**
- Subheadline same size as body text (should be smaller)
- Feature names same size as descriptions (should be larger)
- Exception details same size as exception list (should be smaller)
- Billing table headers same size as data (should be larger)

**Fixes:**
- Establish clear typographic hierarchy: headline > subheadline > feature name > description
- Use consistent spacing and sizing
- Ensure hierarchy is visible on mobile (not lost in small screens)

### Hidden or Collapsed Actions

**Issues:**
- "Try Playground" not visible above fold
- "Sign Up" button below fold on mobile
- "Export report" hidden in menu
- "Adjust rules" hidden in run detail page

**Fixes:**
- Make primary CTAs sticky or always visible
- Use floating action buttons (FAB) for important actions
- Ensure primary actions are accessible without scrolling
- Use bottom navigation for frequently accessed pages

---

## Cognitive Load Assessment

### Terminology Jumps

**Issues:**
- "Reconciliation" used without definition in marketing copy
- "Exception" used without definition in pricing page
- "Adapter" used without definition in documentation
- "Matching rule" used without definition in console

**Fixes:**
- Define technical terms on first use in marketing/landing pages
- Use plain language in marketing copy, technical terms in console/docs
- Add tooltips or glossary links for technical terms
- Provide context: "Reconciliation (matching transactions)" on first use

### Assumption Leaks

**Issues:**
- Assumes user knows what "reconciliation" means
- Assumes user knows what "exception" means
- Assumes user knows how to configure matching rules
- Assumes user knows how to handle exceptions

**Fixes:**
- Explain concepts before using them: "What is reconciliation? [definition]"
- Provide examples: "Example: Matching Stripe payment to Shopify order"
- Add guided tutorials: "Learn how to configure matching rules"
- Provide templates: "Use this template for common scenarios"

### Unnecessary Decisions

**Issues:**
- User must choose between playground and SDK without guidance
- User must choose between multiple pricing tiers without clear comparison
- User must choose between multiple matching rule options without recommendations

**Fixes:**
- Provide recommendations: "New to Settler? Try the playground first"
- Add comparison tool: "Compare plans: [interactive tool]"
- Provide defaults: "Recommended matching rules: [list]"
- Add wizards: "Guided setup: [step-by-step wizard]"

---

## Copy-Level and Sequencing Fixes

### Landing Page

**Current Sequence:**
1. Hero headline
2. Features section
3. Code example
4. Pricing section
5. FAQ

**Fixed Sequence:**
1. Hero headline (problem-focused, not solution-focused)
2. "Try Playground" section (before code example)
3. Features section (benefit-focused names)
4. Code example (after playground)
5. Pricing section (with "How It Works" explanation)
6. FAQ

**Copy Fixes:**
- Hero headline: "Stop Manually Matching Payments to Orders"
- Hero subheadline: "Settler automatically matches your Stripe payments with Shopify orders, QuickBooks entries, and 50+ other platforms. No more spreadsheets, no more errors—just accurate financial records."
- Feature names: "Match Transactions Automatically," "Accurate Currency Conversion," "Feature Flags for Developers"

### Signup Page

**Current Sequence:**
1. Signup form
2. "Create your account" message

**Fixed Sequence:**
1. Hero: "Create your account and get instant access to Settler. You'll start with 1,000 free reconciliations per month—perfect for testing."
2. "What happens next" section:
   - "Get your API key (takes 30 seconds)"
   - "Try the playground (no code required)"
   - "Connect your first integration (Stripe, Shopify, etc.)"
3. Signup form

### Console Dashboard

**Current Sequence:**
1. Onboarding wizard (dismissible)
2. Quick stats (always visible)
3. Quick actions (all visible)

**Fixed Sequence:**
1. Welcome banner: "Welcome! Your first step: Get your API key"
2. Onboarding wizard (not dismissible until Step 1 complete)
3. Quick stats (only if data exists, otherwise placeholder)
4. Quick actions (only "Get API Key" and "Try Playground" initially)

### Pricing Page

**Current Sequence:**
1. Hero: "Pay per reconciliation"
2. Pricing cards

**Fixed Sequence:**
1. Hero: "Simple Pricing: Pay Per Transaction Match"
2. "How It Works" section:
   - "What is a reconciliation? [definition]"
   - "What are exceptions? [definition]"
3. Pricing cards (with tooltips)

---

## Completion Marker

**PHASE III — COMPLETE**

This document serves as the canonical user journey and cognitive flow reference for Settler.dev. All UX decisions must align with these journey maps and friction analysis.

**Next Phase:** PHASE IV — Failure Modes, Expectation Setting & Trust Preservation

---

**Document Status:** FINALIZED  
**Last Updated:** January 2026  
**Maintained By:** Product Team  
**Review Cycle:** Quarterly
