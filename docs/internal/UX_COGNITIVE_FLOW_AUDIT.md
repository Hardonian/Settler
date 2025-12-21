# Settler.dev — Canonical User Journey, UX & Cognitive Flow Audit

**Version:** 1.0  
**Date:** January 2026  
**Status:** Complete  
**Auditor Role:** User, UX Analyst, Cognitive Load Auditor  
**Mode:** No Code — Copy & Flow Recommendations Only

---

## Executive Summary

This audit maps the complete user journeys for Settler.dev, identifies friction points, cognitive load issues, and mobile-first concerns. All recommendations focus on **copy clarity** and **flow sequencing** — no code or design system changes.

**Key Findings:**
- **Critical:** Landing page hero copy is too technical for first-time visitors
- **Critical:** Signup → Console transition lacks context
- **High:** Pricing page uses jargon ("reconciliations", "exceptions") without clear definitions upfront
- **High:** Console dashboard assumes prior knowledge of Settler's capabilities
- **Medium:** Mobile navigation has too many items (12 links)
- **Medium:** Onboarding wizard appears but doesn't guide first action

---

## Journey Maps

### Journey 1: First-Time Visitor

**Entry Point:** Landing page (`/`)

**Current Flow:**
1. **Landing Page Hero** → "Automate Financial Reconciliation in Minutes, Not Hours"
   - **Subhead:** "Reconciliation happens automatically across Stripe, Shopify, QuickBooks, and 50+ platforms. No configuration, no manual work—just continuous matching that runs continuously."
   - **CTA:** "Start Free Trial - No Credit Card"
   - **Secondary CTA:** "View Docs"

2. **Scroll Down** → Features grid ("Core Primitives")
   - "Reconcile Anything"
   - "Receipts → JSON"
   - "Deterministic Convert"
   - "AI-Powered Insights"
   - "Developer-First Flags"

3. **Code Example Section** → "Developer Experience First"
   - Shows TypeScript code example
   - Lists SDKs and features

4. **Trust Signals** → Trust badges, testimonials, social proof

5. **Final CTA** → "Ready to Transform Your Financial Operations?"

**Friction Points Identified:**

#### F1.1: Hero Copy Assumes Knowledge
**Location:** Landing page hero  
**Issue:** "Reconciliation" is financial jargon. First-time visitors may not understand what this means or why they need it.

**Current Copy:**
> "Automate Financial Reconciliation in Minutes, Not Hours"
> "Reconciliation happens automatically across Stripe, Shopify, QuickBooks, and 50+ platforms."

**Problem:**
- "Reconciliation" requires domain knowledge
- No clear problem statement (what problem does this solve?)
- No "before/after" context

**Recommendation:**
> "Stop Manually Matching Payments to Orders"
> "Settler automatically matches your Stripe payments with Shopify orders, QuickBooks entries, and 50+ other platforms. No more spreadsheets, no more errors—just accurate financial records."

**Rationale:**
- Leads with the problem ("manually matching")
- Uses concrete examples (Stripe + Shopify)
- Explains the outcome ("accurate financial records")

---

#### F1.2: Feature Names Are Too Technical
**Location:** Features grid  
**Issue:** "Reconcile Anything", "Deterministic Convert", "Developer-First Flags" assume technical knowledge.

**Current Copy:**
- "Reconcile Anything" — "Match transactions across Stripe, Shopify, databases..."
- "Deterministic Convert" — "Precise unit and currency conversion without floating point errors"

**Problem:**
- "Reconcile" still requires explanation
- "Deterministic" and "floating point errors" are developer jargon
- Features don't explain **why** they matter

**Recommendation:**
- "Match Transactions Automatically" — "Connect Stripe, Shopify, QuickBooks, and more. Settler matches payments to orders automatically, so you never miss a transaction."
- "Accurate Currency Conversion" — "Convert currencies and units without rounding errors. Perfect for international businesses."

**Rationale:**
- Uses plain language
- Explains the benefit, not just the feature
- Removes technical jargon

---

#### F1.3: Code Example Appears Too Early
**Location:** Code example section  
**Issue:** Shows TypeScript code before visitor understands what Settler does.

**Current Flow:**
1. Hero (what it does)
2. Features (what it includes)
3. **Code example** ← Too early
4. Trust signals

**Problem:**
- Code intimidates non-developers
- Assumes visitor is ready to integrate
- No "try it first" option before code

**Recommendation:**
**Sequence Change:**
1. Hero (what it does)
2. Features (what it includes)
3. **"Try Playground" section** ← Add here
4. Trust signals
5. Code example (for developers who want to integrate)

**New Copy for Playground Section:**
> "Try Settler Without Code"
> "Use our interactive playground to test reconciliation, parse receipts, and explore features. No signup required—just click and try."

**Rationale:**
- Lowers barrier to entry
- Allows exploration before commitment
- Separates "try" from "integrate"

---

### Journey 2: Trial User (After Signup)

**Entry Point:** Signup page (`/signup`)

**Current Flow:**
1. **Signup Form** → Email, password, name (optional), terms checkbox
   - **Headline:** "Start Your Free Trial"
   - **Subhead:** "Create your account and reconciliation starts automatically. No credit card required."

2. **After Signup** → Redirects to `/console?welcome=true`

3. **Console Dashboard** → Shows:
   - Welcome banner
   - Usage warning banner (if applicable)
   - Onboarding wizard
   - Quick stats (API calls, API keys, receipts, flags)
   - Usage breakdown
   - Quick actions

**Friction Points Identified:**

#### F2.1: Signup Page Doesn't Set Expectations
**Location:** Signup page  
**Issue:** "reconciliation starts automatically" is vague. What does this mean?

**Current Copy:**
> "Create your account and reconciliation starts automatically. No credit card required."

**Problem:**
- "Starts automatically" implies magic—but user still needs to configure integrations
- No mention of what happens next
- No mention of free tier limits

**Recommendation:**
> "Create your account and get instant access to Settler. You'll start with 1,000 free reconciliations per month—perfect for testing."
> 
> **What happens next:**
> - Get your API key (takes 30 seconds)
> - Try the playground (no code required)
> - Connect your first integration (Stripe, Shopify, etc.)

**Rationale:**
- Sets clear expectations
- Explains free tier
- Provides next steps

---

#### F2.2: Console Dashboard Overwhelms New Users
**Location:** Console dashboard (`/console`)  
**Issue:** Dashboard shows everything at once—stats, wizard, actions, usage. New users don't know where to start.

**Current Layout:**
- Welcome banner
- Usage warning banner
- Onboarding wizard
- Quick stats (4 cards)
- Usage breakdown
- Quick actions (3 cards)

**Problem:**
- Too many things competing for attention
- No clear "first action"
- Stats show zeros (not helpful)
- Wizard appears but doesn't guide strongly

**Recommendation:**
**Flow Sequencing:**
1. **Welcome banner** (prominent, dismissible)
   - "Welcome! Let's get you started in 3 steps"
   - Shows progress: Step 1 of 3

2. **Onboarding wizard** (expanded, prominent)
   - Step 1: "Get your API key" → Link to API keys page
   - Step 2: "Try the playground" → Link to playground
   - Step 3: "Connect your first integration" → Link to integrations

3. **Quick stats** (collapsed/hidden until user has data)
   - Show only if user has made API calls
   - Otherwise show: "Start using Settler to see your stats here"

4. **Quick actions** (simplified)
   - Only show actions relevant to current step
   - Hide advanced features until user completes onboarding

**Copy Changes:**
- Welcome banner: "Welcome! Let's get you started" → "Welcome! Your first step: Get your API key"
- Stats cards: Show "0" → Show "Start using Settler to see stats here"
- Quick actions: Show all → Show only "Get API Key" and "Try Playground" initially

---

#### F2.3: Onboarding Wizard Doesn't Guide First Action
**Location:** Console dashboard — Onboarding wizard  
**Issue:** Wizard shows steps but doesn't force or strongly guide the first action.

**Current Behavior:**
- Shows progress bar
- Shows current step
- Allows "Skip" on optional steps
- Doesn't block access to other parts of console

**Problem:**
- User can dismiss wizard and explore console
- No clear "you must do this first"
- Wizard feels optional, not required

**Recommendation:**
**Copy Changes:**
- Title: "Getting Started" → "Complete Setup (2 minutes)"
- Description: "Complete these steps to get the most out of Settler" → "Finish these 3 steps to start using Settler"
- Current step: Make action button more prominent
- Skip button: Change to "I'll do this later" (less dismissive)

**Flow Change:**
- Don't allow dismissing wizard until Step 1 is complete
- After Step 1, allow dismissing but show reminder banner
- After all steps, show success message and hide wizard

---

### Journey 3: Paying Customer

**Entry Point:** Console dashboard (after upgrade)

**Current Flow:**
1. **Console Dashboard** → Shows usage stats, API keys, receipts, flags
2. **Usage Warning Banner** → Shows if approaching limits
3. **Quick Actions** → Create API key, manage flags, view docs
4. **Usage Analytics** → Service breakdown, live feed, insights

**Friction Points Identified:**

#### F3.1: Usage Warning Banner Uses Jargon
**Location:** Console dashboard — Usage warning banner  
**Issue:** Banner mentions "reconciliations" and "exceptions" without clear context.

**Current Copy (assumed):**
> "You've used 8,500 of 10,000 reconciliations this month"

**Problem:**
- "Reconciliations" requires explanation
- Doesn't explain what happens when limit is reached
- No clear action (upgrade? optimize?)

**Recommendation:**
> "You've matched 8,500 transactions this month (of 10,000 included)"
> 
> **What this means:** Each time Settler matches a payment to an order, that counts as one reconciliation.
> 
> **When you reach the limit:** You can upgrade to continue, or wait until next month.

**Rationale:**
- Explains terminology
- Clarifies what happens at limit
- Provides clear next steps

---

#### F3.2: Pricing Page Jargon Without Context
**Location:** Pricing page (`/pricing`)  
**Issue:** Page uses "reconciliations" and "exceptions" without clear definitions upfront.

**Current Copy:**
> "Pay per reconciliation. Exceptions requiring review cost extra. That's it."
> 
> "How it works: Reconciliation runs automatically. You pay $0.01 per reconciliation. If exceptions require human review, they cost $0.10 each."

**Problem:**
- "Reconciliation" and "exception" aren't defined until FAQ
- Pricing explanation assumes knowledge
- No concrete examples upfront

**Recommendation:**
**Restructure Pricing Page:**

1. **Hero Section:**
   > "Simple Pricing: Pay Per Transaction Match"
   > 
   > "Settler matches your payments to orders automatically. You pay $0.01 per match. If a match needs your review, it costs $0.10. That's it."

2. **Add "How It Works" Section Before Pricing Cards:**
   > **What is a reconciliation?**
   > A reconciliation is when Settler matches one transaction (like a Stripe payment) to another (like a Shopify order). Each match counts as one reconciliation.
   > 
   > **What are exceptions?**
   > Exceptions are transactions that Settler can't match automatically. Settler explains why they don't match, so you can review them quickly. Most exceptions are handled automatically—you only pay for ones that need your attention.

3. **Pricing Cards:** Keep as-is, but add tooltips:
   - Hover over "reconciliation volume" → "Number of transaction matches included per month"
   - Hover over "exception rate" → "Percentage of transactions that need review"

**Rationale:**
- Defines terms before showing pricing
- Uses concrete examples
- Makes pricing model clear upfront

---

### Journey 4: Admin/Operator

**Entry Point:** Console dashboard (admin view)

**Current Flow:**
1. **Console Dashboard** → Shows all features
2. **RBAC Gates** → Some features hidden based on tier
3. **Quick Actions** → Create API key, manage flags, view docs

**Friction Points Identified:**

#### F4.1: RBAC Gates Don't Explain Why Features Are Hidden
**Location:** Console dashboard — RBAC gates  
**Issue:** Features are hidden but don't explain why or how to unlock.

**Current Behavior:**
- Features hidden if user doesn't have required tier
- No explanation of why hidden
- No clear upgrade path

**Recommendation:**
**Copy Changes:**
- Instead of hiding features, show them with "locked" state:
  - "API Keys" → "API Keys (Available on Starter+ plan)"
  - Show upgrade button: "Upgrade to unlock"
  - Link to pricing page with plan comparison

**Rationale:**
- Shows what's available
- Explains how to unlock
- Provides clear upgrade path

---

## Mobile-First Reality Check

### Mobile Navigation Issues

**Current State:**
- Navigation has 12 items (Docs, Cookbook, Runbooks, Schematics, Receipts API, Feature Flags, Console, Playground, Pricing, Enterprise, Community, Support)
- Mobile menu shows all items in a list
- No prioritization or grouping

**Problems:**
- Too many items to scan
- No visual hierarchy
- Important items (Console, Playground) buried in list

**Recommendation:**
**Group Navigation Items:**

**Primary (always visible):**
- Console
- Playground
- Docs
- Pricing

**Secondary (in "More" menu):**
- Cookbook
- Runbooks
- Schematics
- Receipts API
- Feature Flags
- Enterprise
- Community
- Support

**Copy Changes:**
- Add "More" button in mobile menu
- Group secondary items under "More"
- Keep primary items always visible

---

### Mobile Landing Page Issues

**Current State:**
- Hero section has long headline and subhead
- Features grid shows 5 items (2 columns on mobile)
- Code example section shows full code block

**Problems:**
- Text density too high on mobile
- Features grid cramped
- Code example hard to read on mobile

**Recommendation:**
**Copy Changes:**
- Hero headline: Shorten for mobile
  - Desktop: "Automate Financial Reconciliation in Minutes, Not Hours"
  - Mobile: "Automate Payment Matching"
- Hero subhead: Reduce to 1 sentence on mobile
  - Desktop: Full paragraph
  - Mobile: "Match Stripe payments to Shopify orders automatically. No spreadsheets, no errors."
- Features grid: Show 1 column on mobile, add "Swipe to see more" indicator
- Code example: Hide on mobile, show "View code example" button that expands

---

### Mobile Console Dashboard Issues

**Current State:**
- Dashboard shows 4 stat cards in grid
- Usage breakdown shows full table
- Quick actions show 3 cards

**Problems:**
- Stat cards too small on mobile
- Usage breakdown table hard to read
- Quick actions cramped

**Recommendation:**
**Flow Changes:**
- Stat cards: Show 2 columns on mobile (instead of 4)
- Usage breakdown: Convert table to cards (one per service)
- Quick actions: Show 1 column on mobile, add "View all actions" button

---

## Cognitive Load Audit

### Terminology Inconsistencies

**Issue:** Terms change unexpectedly across pages.

**Examples:**
- Landing page: "reconciliation"
- Pricing page: "reconciliation" + "exception"
- Console: "API calls", "reconciliations", "matches"
- Docs: "reconciliation job", "matching", "transaction matching"

**Problem:**
- User must learn multiple terms for same concept
- No glossary or consistent terminology guide

**Recommendation:**
**Create Terminology Guide:**
- **Primary term:** "Reconciliation" (use consistently)
- **Alternatives:** "Transaction matching", "Payment matching" (use only in context)
- **Avoid:** "API calls" (too generic), "matches" (unclear)

**Copy Changes:**
- Console: "API Calls" → "Reconciliations"
- Console: "Matches" → "Reconciled Transactions"
- Docs: Use "reconciliation" consistently

---

### Assumed Prior Knowledge

**Issue:** UI assumes users know what Settler does before using it.

**Examples:**
- Console dashboard shows "API Keys" without explaining what they're for
- Pricing page uses "reconciliation" without definition
- Features page uses technical terms without context

**Recommendation:**
**Add Contextual Help:**
- **Tooltips:** Add "?" icons next to terms with explanations
- **Inline explanations:** Add brief explanations in parentheses
- **Progressive disclosure:** Show basic info first, advanced on click

**Copy Changes:**
- "API Keys" → "API Keys (required to use Settler's API)"
- "Reconciliations" → "Reconciliations (transaction matches)"
- "Exceptions" → "Exceptions (transactions needing review)"

---

### Decision Points Without Guidance

**Issue:** Users face decisions without enough information.

**Examples:**
- Signup: No mention of free tier limits
- Console: No guidance on first action
- Pricing: No calculator or usage estimator

**Recommendation:**
**Add Guidance:**
- **Signup:** Add "What's included" section showing free tier
- **Console:** Add "Get started" checklist with first 3 actions
- **Pricing:** Add "Usage calculator" to estimate costs

**Copy Changes:**
- Signup page: Add "Free tier includes 1,000 reconciliations/month"
- Console: Add "Complete these 3 steps to get started"
- Pricing: Add "Estimate your monthly cost" calculator

---

## Prioritized Friction Points

### P0: Critical (Blocks Understanding)

1. **Hero copy assumes knowledge** (Landing page)
   - Impact: First-time visitors don't understand value prop
   - Fix: Rewrite hero to lead with problem, not solution

2. **Pricing page jargon** (Pricing page)
   - Impact: Users can't understand pricing model
   - Fix: Define terms before showing pricing

3. **Console dashboard overwhelms** (Console)
   - Impact: New users don't know where to start
   - Fix: Sequence onboarding, hide advanced features initially

---

### P1: High (Slows Progress)

4. **Signup page doesn't set expectations** (Signup)
   - Impact: Users don't know what happens after signup
   - Fix: Add "what happens next" section

5. **Onboarding wizard doesn't guide** (Console)
   - Impact: Users skip wizard and get lost
   - Fix: Make wizard more prominent, don't allow dismissing until Step 1 complete

6. **Mobile navigation too cluttered** (Navigation)
   - Impact: Mobile users can't find important features
   - Fix: Group navigation, prioritize primary items

---

### P2: Medium (Causes Confusion)

7. **Terminology inconsistencies** (All pages)
   - Impact: Users must learn multiple terms
   - Fix: Standardize terminology, add glossary

8. **Features assume prior knowledge** (Landing page)
   - Impact: Users don't understand feature benefits
   - Fix: Rewrite features to explain benefits, not just features

9. **Code example appears too early** (Landing page)
   - Impact: Non-developers intimidated
   - Fix: Move code example after playground section

---

## Copy & Flow Recommendations Summary

### Landing Page

**Hero Section:**
- **Current:** "Automate Financial Reconciliation in Minutes, Not Hours"
- **Recommended:** "Stop Manually Matching Payments to Orders"
- **Subhead:** "Settler automatically matches your Stripe payments with Shopify orders, QuickBooks entries, and 50+ other platforms. No more spreadsheets, no more errors—just accurate financial records."

**Features Section:**
- **Current:** "Reconcile Anything", "Deterministic Convert"
- **Recommended:** "Match Transactions Automatically", "Accurate Currency Conversion"
- **Add:** Benefit-focused descriptions, remove technical jargon

**Code Example:**
- **Current:** Appears after features
- **Recommended:** Move after playground section, add "Try Playground" section first

---

### Signup Page

**Hero:**
- **Current:** "Create your account and reconciliation starts automatically"
- **Recommended:** "Create your account and get instant access to Settler. You'll start with 1,000 free reconciliations per month—perfect for testing."

**Add Section:**
- **"What happens next:"**
  - Get your API key (takes 30 seconds)
  - Try the playground (no code required)
  - Connect your first integration (Stripe, Shopify, etc.)

---

### Console Dashboard

**Welcome Banner:**
- **Current:** "Welcome! Let's get you started"
- **Recommended:** "Welcome! Your first step: Get your API key"

**Onboarding Wizard:**
- **Current:** "Getting Started" with skip option
- **Recommended:** "Complete Setup (2 minutes)" — don't allow dismissing until Step 1 complete

**Quick Stats:**
- **Current:** Shows "0" for all stats
- **Recommended:** Show "Start using Settler to see your stats here" if no data

**Quick Actions:**
- **Current:** Shows all actions
- **Recommended:** Show only "Get API Key" and "Try Playground" initially, reveal more after onboarding

---

### Pricing Page

**Hero:**
- **Current:** "Pay per reconciliation. Exceptions requiring review cost extra."
- **Recommended:** "Simple Pricing: Pay Per Transaction Match"

**Add Section (Before Pricing Cards):**
- **"How It Works"**
  - Define "reconciliation" (transaction match)
  - Define "exception" (transaction needing review)
  - Add concrete examples

**Pricing Cards:**
- **Add:** Tooltips explaining "reconciliation volume" and "exception rate"
- **Add:** "Estimate your monthly cost" calculator

---

### Mobile Navigation

**Current:** 12 items in list
**Recommended:**
- **Primary (always visible):** Console, Playground, Docs, Pricing
- **Secondary (in "More" menu):** All other items

---

## Success Criteria

### Clarity Metrics
- ✅ First-time visitors understand value prop without prior knowledge
- ✅ New users know their first action after signup
- ✅ Pricing model is clear without reading FAQ
- ✅ Mobile users can find important features quickly

### Flow Metrics
- ✅ Landing → Signup → Console flow is clear
- ✅ Onboarding wizard guides first 3 actions
- ✅ Console dashboard doesn't overwhelm new users
- ✅ Mobile navigation prioritizes important features

---

## Next Steps

1. **Implement P0 fixes** (hero copy, pricing jargon, console sequencing)
2. **Implement P1 fixes** (signup expectations, onboarding guidance, mobile nav)
3. **Implement P2 fixes** (terminology, features, code example placement)
4. **Test with real users** (first-time visitors, trial users, paying customers)
5. **Iterate based on feedback**

---

**Document Status:** Complete  
**Last Updated:** January 2026  
**Next Review:** After implementing P0 fixes
