# Pilot Program Design

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Design a standard pilot program that converts to paid contracts

## Overview

The pilot program is **the real sell**. Customers want proof before contracts. This document defines:
- **Duration:** How long the pilot lasts
- **Scope:** What's included vs excluded
- **Success Criteria:** What defines a successful pilot
- **Data Required:** What customers need to provide
- **Responsibilities:** You vs customer
- **Exit Paths:** Convert / extend / stop

**Philosophy:** Pilots should be low-friction, high-value, and convert to paid contracts.

---

## Standard Pilot Structure

### Duration
- **Standard Pilot:** 14 days
- **Extended Pilot:** 30 days (for enterprise customers or complex integrations)
- **Trial Period:** 14 days (self-service, no sales involvement)

### Scope

#### Included
- ✅ **Full API Access:** All reconciliation, receipts, and feature flag APIs
- ✅ **Unlimited Usage:** No usage limits during pilot (within reason)
- ✅ **Standard Integrations:** Stripe, Shopify, QuickBooks, PayPal, Xero
- ✅ **Developer Console:** Full access to Console dashboard
- ✅ **Support:** Email support (24-48 hour response)
- ✅ **Documentation:** Full access to documentation and guides
- ✅ **Onboarding:** Self-service onboarding with guided setup

#### Explicitly Excluded
- ❌ **Custom Integrations:** No custom integrations during pilot
- ❌ **On-Premise Deployment:** No on-premise options
- ❌ **White-Label Solutions:** No white-label options
- ❌ **Dedicated Support:** No dedicated support during pilot
- ❌ **SLA Guarantees:** No SLA guarantees during pilot
- ❌ **Custom Contracts:** No custom contract terms during pilot

### Success Criteria

#### Primary Success Criteria (Required for Conversion)
1. **First Reconciliation:** Customer runs at least one successful reconciliation
2. **Time-to-Value:** Customer sees value within 7 days
3. **Usage:** Customer processes at least 1K transactions during pilot
4. **Accuracy:** Customer achieves 95%+ match rate
5. **Engagement:** Customer logs in at least 3 times during pilot

#### Secondary Success Criteria (Nice to Have)
1. **Multiple Reconciliations:** Customer runs multiple reconciliations
2. **Multiple Integrations:** Customer connects multiple systems
3. **Export Usage:** Customer exports reconciliation reports
4. **API Integration:** Customer integrates via API (not just Console)
5. **Team Adoption:** Multiple team members use the platform

### Data Required

#### Required from Customer
- **API Access:** API keys for Stripe, Shopify, QuickBooks, etc.
- **Sample Data:** At least 1K transactions for testing
- **Contact Information:** Email, name, company
- **Use Case:** What they're trying to solve

#### Optional from Customer
- **Historical Data:** Past reconciliation data for comparison
- **Integration Details:** Specific integration requirements
- **Compliance Requirements:** Any compliance needs

### Responsibilities

#### Your Responsibilities
- ✅ **Setup Support:** Help with API connections and initial setup
- ✅ **Documentation:** Provide clear documentation and guides
- ✅ **Support:** Respond to questions within 24-48 hours
- ✅ **Onboarding:** Guide through first reconciliation
- ✅ **Success Check-ins:** Check in at day 7 and day 14

#### Customer Responsibilities
- ✅ **API Access:** Provide API keys and access
- ✅ **Data:** Provide sample data for testing
- ✅ **Testing:** Run at least one reconciliation
- ✅ **Feedback:** Provide feedback on pilot experience
- ✅ **Decision:** Make go/no-go decision by end of pilot

---

## Pilot Conversion Criteria

### Convert to Paid (Go)
**Customer should convert if:**
- ✅ Meets all primary success criteria
- ✅ Sees clear ROI (time saved, accuracy improved)
- ✅ Has budget approved
- ✅ Plans to use Settler ongoing

### Extend Pilot (Maybe)
**Customer should extend if:**
- ⚠️ Needs more time to evaluate (complex integration, large dataset)
- ⚠️ Needs to test specific use case (multi-currency, compliance)
- ⚠️ Budget approval pending (but likely to approve)

**Extension Terms:**
- **Duration:** Additional 14 days
- **Scope:** Same as standard pilot
- **Limit:** Maximum one extension per customer

### Stop Pilot (No-Go)
**Customer should stop if:**
- ❌ Doesn't meet primary success criteria
- ❌ Doesn't see ROI
- ❌ Doesn't have budget
- ❌ Wrong use case (doesn't need multi-system reconciliation)

---

## Pilot Program Types

### Type 1: Self-Service Trial (Standard)
- **Duration:** 14 days
- **Setup:** Self-service, no sales involvement
- **Support:** Email support only
- **Conversion:** Self-service upgrade to paid plan
- **Target:** E-commerce Finance Manager, SaaS Operations Lead, E-commerce Developer/Founder

### Type 2: Sales-Assisted Pilot (Standard)
- **Duration:** 14 days
- **Setup:** Sales-assisted setup, guided onboarding
- **Support:** Email support + sales check-ins
- **Conversion:** Sales-assisted conversion to paid plan
- **Target:** Accounting Firm Partner, Fintech Operations Manager

### Type 3: Enterprise Pilot (Extended)
- **Duration:** 30 days
- **Setup:** Sales-assisted setup, dedicated onboarding
- **Support:** Email support + sales check-ins + dedicated support
- **Conversion:** Sales-assisted conversion to Enterprise plan
- **Target:** Enterprise customers, high-value prospects

---

## Pilot Onboarding Flow

### Day 0: Pilot Start
1. **Sign Up:** Customer signs up for pilot (self-service or sales-assisted)
2. **Welcome Email:** Send welcome email with onboarding guide
3. **Account Setup:** Customer creates account, sets up workspace
4. **API Connections:** Customer connects APIs (Stripe, Shopify, QuickBooks)

### Day 1-3: First Reconciliation
1. **Onboarding Guide:** Customer follows onboarding guide
2. **First Reconciliation:** Customer runs first reconciliation
3. **Results Review:** Customer reviews results in Console
4. **Support:** Answer questions, provide guidance

### Day 4-7: Value Realization
1. **Multiple Reconciliations:** Customer runs multiple reconciliations
2. **Value Check:** Customer sees time savings, accuracy improvement
3. **Check-In:** Sales check-in (if sales-assisted)
4. **Feedback:** Collect feedback on pilot experience

### Day 8-14: Conversion Preparation
1. **Continued Usage:** Customer continues using platform
2. **Success Metrics:** Track success criteria (usage, accuracy, engagement)
3. **Conversion Discussion:** Discuss conversion to paid plan
4. **Final Check-In:** Final check-in before pilot ends

### Day 14: Pilot End
1. **Pilot Expiration:** Pilot expires automatically
2. **Conversion:** Customer converts to paid plan (or extends/stops)
3. **Follow-Up:** Follow up with non-converters (understand why)

---

## Pilot Expiration Logic

### Automatic Expiration
- **Trial End Date:** Set at pilot start (14 days from start)
- **Automatic Expiration:** Pilot expires automatically at trial end date
- **Grace Period:** 7-day grace period after expiration (read-only access)
- **Hard Expiration:** Full access revoked after grace period

### Expiration Warnings
- **7 Days Before:** Email warning: "Your pilot expires in 7 days"
- **3 Days Before:** Email warning: "Your pilot expires in 3 days"
- **1 Day Before:** Email warning: "Your pilot expires tomorrow"
- **Day of Expiration:** Email: "Your pilot has expired. Upgrade to continue."

### Post-Expiration Options
1. **Convert to Paid:** Upgrade to paid plan (full access restored)
2. **Extend Pilot:** Request extension (if eligible)
3. **Stop:** Let pilot expire (access revoked after grace period)

---

## Pilot Success Metrics

### Primary Metrics
- **Conversion Rate:** % of pilots that convert to paid (target: 30%+)
- **Time-to-Value:** Days until first value (target: <7 days)
- **Usage:** Transactions processed during pilot (target: 1K+)
- **Accuracy:** Match rate achieved (target: 95%+)
- **Engagement:** Logins during pilot (target: 3+)

### Secondary Metrics
- **Multiple Reconciliations:** % running multiple reconciliations (target: 50%+)
- **Multiple Integrations:** % connecting multiple systems (target: 40%+)
- **API Integration:** % integrating via API (target: 30%+)
- **Team Adoption:** % with multiple users (target: 20%+)

---

## Pilot Risks & Mitigation

### Risk 1: Low Conversion Rate
- **Risk:** Pilots don't convert to paid (<20% conversion)
- **Mitigation:** 
  - Improve onboarding (clearer guides, better support)
  - Better qualification (only qualified prospects get pilots)
  - Better success criteria (clearer definition of success)

### Risk 2: High Support Burden
- **Risk:** Pilots require too much support (not scalable)
- **Mitigation:**
  - Self-service onboarding (reduce support needs)
  - Better documentation (answer common questions)
  - Automated check-ins (reduce manual check-ins)

### Risk 3: Wrong Use Case
- **Risk:** Customers use pilot for wrong use case (don't convert)
- **Mitigation:**
  - Better qualification (disqualify bad fits early)
  - Clear scope (what's included vs excluded)
  - Better discovery (understand use case before pilot)

### Risk 4: Pilot Abuse
- **Risk:** Customers abuse pilot (unlimited usage, no intent to pay)
- **Mitigation:**
  - Usage limits (reasonable limits during pilot)
  - Qualification (only qualified prospects get pilots)
  - Monitoring (track usage, flag abuse)

---

## Related Documents

- `/docs/PILOT_SUCCESS_CRITERIA.md` - Detailed success criteria
- `/docs/PILOT_RISKS.md` - Detailed risk analysis
- `/docs/ONBOARDING_GUIDE.md` - Onboarding guide for pilots
