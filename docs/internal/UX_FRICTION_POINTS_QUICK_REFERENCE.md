# UX Friction Points — Quick Reference

**Version:** 1.0  
**Date:** January 2026  
**Purpose:** Quick reference for prioritized UX fixes

---

## P0: Critical Fixes (Do First)

### 1. Landing Page Hero Copy

**File:** `/packages/web/src/app/page.tsx` (line ~182)

**Current:**
```
"Automate Financial Reconciliation in Minutes, Not Hours"
"Reconciliation happens automatically across Stripe, Shopify, QuickBooks, and 50+ platforms..."
```

**Fix:**
```
"Stop Manually Matching Payments to Orders"
"Settler automatically matches your Stripe payments with Shopify orders, QuickBooks entries, and 50+ other platforms. No more spreadsheets, no more errors—just accurate financial records."
```

**Why:** "Reconciliation" is jargon. Lead with the problem, not the solution.

---

### 2. Pricing Page Jargon

**File:** `/packages/web/src/app/pricing/page.tsx` (line ~109)

**Current:**
```
"Pay per reconciliation. Exceptions requiring review cost extra. That's it."
```

**Fix:**
```
"Simple Pricing: Pay Per Transaction Match"
"Settler matches your payments to orders automatically. You pay $0.01 per match. If a match needs your review, it costs $0.10. That's it."
```

**Add Before Pricing Cards:**
```
## How It Works

**What is a reconciliation?**
A reconciliation is when Settler matches one transaction (like a Stripe payment) to another (like a Shopify order). Each match counts as one reconciliation.

**What are exceptions?**
Exceptions are transactions that Settler can't match automatically. Settler explains why they don't match, so you can review them quickly. Most exceptions are handled automatically—you only pay for ones that need your attention.
```

**Why:** Terms aren't defined until FAQ. Define them upfront.

---

### 3. Console Dashboard Sequencing

**File:** `/packages/web/src/app/console/page.tsx` (line ~380)

**Current:** Shows everything at once (wizard, stats, actions)

**Fix:**
1. **Welcome banner:** "Welcome! Your first step: Get your API key"
2. **Onboarding wizard:** Don't allow dismissing until Step 1 complete
3. **Quick stats:** Show "Start using Settler to see your stats here" if zeros
4. **Quick actions:** Show only "Get API Key" and "Try Playground" initially

**Why:** New users don't know where to start. Sequence onboarding.

---

## P1: High Priority Fixes

### 4. Signup Page Expectations

**File:** `/packages/web/src/app/signup/page.tsx` (line ~146)

**Current:**
```
"Create your account and reconciliation starts automatically. No credit card required."
```

**Fix:**
```
"Create your account and get instant access to Settler. You'll start with 1,000 free reconciliations per month—perfect for testing."

**What happens next:**
- Get your API key (takes 30 seconds)
- Try the playground (no code required)
- Connect your first integration (Stripe, Shopify, etc.)
```

**Why:** "Starts automatically" is vague. Set clear expectations.

---

### 5. Onboarding Wizard Guidance

**File:** `/packages/web/src/components/onboarding/OnboardingWizard.tsx` (line ~63)

**Current:**
- Title: "Getting Started"
- Allows skip on all steps
- Can be dismissed immediately

**Fix:**
- Title: "Complete Setup (2 minutes)"
- Don't allow dismissing until Step 1 complete
- After Step 1, allow dismissing but show reminder banner

**Why:** Wizard feels optional. Make it guide first action.

---

### 6. Mobile Navigation Clutter

**File:** `/packages/web/src/components/Navigation.tsx` (line ~11)

**Current:** 12 items in mobile menu

**Fix:**
- **Primary (always visible):** Console, Playground, Docs, Pricing
- **Secondary (in "More" menu):** Cookbook, Runbooks, Schematics, Receipts API, Feature Flags, Enterprise, Community, Support

**Why:** Too many items to scan. Prioritize important features.

---

## P2: Medium Priority Fixes

### 7. Feature Names Too Technical

**File:** `/packages/web/src/app/page.tsx` (line ~82)

**Current:**
- "Reconcile Anything"
- "Deterministic Convert"
- "Developer-First Flags"

**Fix:**
- "Match Transactions Automatically"
- "Accurate Currency Conversion"
- "Feature Flags for Developers"

**Why:** Technical terms don't explain benefits.

---

### 8. Code Example Too Early

**File:** `/packages/web/src/app/page.tsx` (line ~307)

**Current:** Code example appears after features

**Fix:** Move code example after playground section, add "Try Playground" section first

**Why:** Code intimidates non-developers. Show playground first.

---

### 9. Terminology Inconsistencies

**All Files:** Use "reconciliation" consistently

**Current:**
- Console: "API Calls"
- Console: "Matches"
- Docs: "reconciliation job"

**Fix:**
- Console: "Reconciliations" (not "API Calls")
- Console: "Reconciled Transactions" (not "Matches")
- Docs: Use "reconciliation" consistently

**Why:** Multiple terms confuse users. Standardize terminology.

---

## Copy Changes Checklist

### Landing Page (`/packages/web/src/app/page.tsx`)
- [ ] Hero headline: "Stop Manually Matching Payments to Orders"
- [ ] Hero subhead: Rewrite to explain problem, not solution
- [ ] Features: Rename to benefit-focused names
- [ ] Features: Rewrite descriptions to explain benefits
- [ ] Add "Try Playground" section before code example
- [ ] Move code example after playground section

### Signup Page (`/packages/web/src/app/signup/page.tsx`)
- [ ] Hero: Add free tier mention
- [ ] Add "What happens next" section
- [ ] List 3 next steps clearly

### Console Dashboard (`/packages/web/src/app/console/page.tsx`)
- [ ] Welcome banner: "Your first step: Get your API key"
- [ ] Onboarding wizard: Don't allow dismissing until Step 1 complete
- [ ] Quick stats: Show placeholder if zeros
- [ ] Quick actions: Show only first 2 actions initially

### Pricing Page (`/packages/web/src/app/pricing/page.tsx`)
- [ ] Hero: "Simple Pricing: Pay Per Transaction Match"
- [ ] Add "How It Works" section before pricing cards
- [ ] Define "reconciliation" and "exception" upfront
- [ ] Add tooltips to pricing cards

### Navigation (`/packages/web/src/components/Navigation.tsx`)
- [ ] Group mobile navigation (primary vs. secondary)
- [ ] Add "More" menu for secondary items

### Onboarding Wizard (`/packages/web/src/components/onboarding/OnboardingWizard.tsx`)
- [ ] Title: "Complete Setup (2 minutes)"
- [ ] Don't allow dismissing until Step 1 complete
- [ ] Show reminder banner after Step 1 if dismissed

---

## Testing Checklist

After implementing fixes, test with:

1. **First-time visitor** (no prior knowledge)
   - [ ] Understands value prop from hero
   - [ ] Can navigate to signup without confusion
   - [ ] Understands pricing model

2. **Trial user** (after signup)
   - [ ] Knows first action after signup
   - [ ] Can complete onboarding wizard
   - [ ] Can find playground

3. **Mobile user** (on phone)
   - [ ] Can find important features in navigation
   - [ ] Can read hero copy without scrolling
   - [ ] Can use console dashboard

---

**Document Status:** Quick Reference  
**Last Updated:** January 2026  
**Full Audit:** See `UX_COGNITIVE_FLOW_AUDIT.md`
