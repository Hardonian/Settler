# First Value Milestone

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Define the first value milestone customers must achieve (<7 days)

## Overview

The **First Value Milestone** is the moment when customers see clear value from Settler. This must happen within **7 days** of signup.

**Philosophy:** If first value >7 days, fix it.

---

## First Value Milestone Definition

### Milestone: First Successful Reconciliation

**Definition:** Customer runs at least one successful reconciliation that produces results.

**Requirements:**

1. **API Connections:** Customer connects at least 2 APIs (e.g., Stripe + Shopify)
2. **Reconciliation Job:** Customer creates and runs a reconciliation job
3. **Results:** Reconciliation completes successfully with results
4. **Time:** Achieved within 7 days of signup

**Success Criteria:**

- ✅ Reconciliation completes without errors
- ✅ Results show matched/unmatched transactions
- ✅ Customer sees time savings or accuracy improvement
- ✅ Customer understands value (time saved, errors reduced)

---

## Time-to-Value Breakdown

### Target: <7 Days

**Breakdown:**

- **Day 0:** Sign up, create account (5 minutes)
- **Day 1:** Connect APIs, create reconciliation job (30 minutes)
- **Day 1:** Run first reconciliation (5 minutes)
- **Day 1:** See results, understand value (10 minutes)
- **Total:** <1 hour to first value

**Reality Check:**

- Most customers: 1-3 days to first value
- Some customers: 3-7 days (need help)
- Few customers: >7 days (need intervention)

---

## First Value Checklist

### Pre-Value (Setup)

- [ ] Account created
- [ ] Workspace created
- [ ] APIs connected (at least 2)
- [ ] Sample data available (at least 1K transactions)

### Value Achievement

- [ ] Reconciliation job created
- [ ] Reconciliation job run successfully
- [ ] Results viewed in Console
- [ ] Value understood (time saved, accuracy improved)

### Post-Value (Activation)

- [ ] Multiple reconciliations run
- [ ] Results exported
- [ ] Value realized (saves time, reduces errors)
- [ ] Conversion intent (wants to continue using)

---

## First Value Metrics

### Key Metrics

- **Time-to-First-Value:** Days from signup to first successful reconciliation (target: <7 days)
- **First-Value Rate:** % of customers achieving first value (target: 70%+)
- **Value Realization:** % of customers who see value (target: 80%+)
- **Conversion Rate:** % of customers who convert after first value (target: 40%+)

### Tracking

- **Database:** Track first reconciliation in `reconciliation_jobs` table
- **Analytics:** Track time-to-value in analytics
- **Dashboard:** Display first-value metrics in admin dashboard

---

## First Value Interventions

### If First Value >7 Days

**Interventions:**

1. **Onboarding Support:** Proactive check-in, offer help
2. **Documentation:** Provide clearer guides, video tutorials
3. **Simplification:** Reduce setup steps, automate where possible
4. **Support:** Offer live support, screen share session

### If First Value Not Achieved

**Interventions:**

1. **Disqualification:** May not be a good fit (wrong use case)
2. **Extended Support:** Offer extended pilot, more help
3. **Re-engagement:** Reconnect after 30 days, check if situation changed

---

## Related Documents

- `/docs/ONBOARDING_GUIDE.md` - Onboarding guide
- `/docs/PILOT_SUCCESS_CRITERIA.md` - Pilot success criteria
