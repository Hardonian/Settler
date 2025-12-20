# Pilot Success Criteria

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Define what makes a pilot successful (and what doesn't)

## Overview

Success criteria are **measurable, objective, and demonstrable**. No subjective judgments. Every criterion must be trackable in-product.

**Philosophy:** If you can't measure it, you can't manage it.

---

## Primary Success Criteria (Required for Conversion)

### Criterion 1: First Reconciliation
**Definition:** Customer runs at least one successful reconciliation during pilot.

**Measurement:**
- **Metric:** Number of successful reconciliations run
- **Threshold:** ≥1 successful reconciliation
- **Tracking:** `reconciliation_jobs` table, `status = 'completed'`
- **Validation:** Reconciliation completes without errors, produces results

**Why It Matters:**
- **Proof of Value:** Customer sees Settler working
- **Engagement:** Customer is actively using the platform
- **Conversion Signal:** Strong indicator of conversion intent

**Failure Indicators:**
- ❌ No reconciliations run during pilot
- ❌ All reconciliations fail (errors, no results)
- ❌ Customer doesn't complete setup (API connections not working)

---

### Criterion 2: Time-to-Value
**Definition:** Customer sees value within 7 days of pilot start.

**Measurement:**
- **Metric:** Days until first value (first successful reconciliation)
- **Threshold:** ≤7 days
- **Tracking:** `reconciliation_jobs` table, `created_at` vs pilot start date
- **Validation:** First reconciliation completes successfully within 7 days

**Why It Matters:**
- **Engagement:** Fast time-to-value increases engagement
- **Conversion:** Customers who see value quickly are more likely to convert
- **Retention:** Fast value realization improves retention

**Failure Indicators:**
- ❌ First reconciliation takes >7 days
- ❌ Customer doesn't complete setup within 7 days
- ❌ Customer doesn't see value (no time savings, no accuracy improvement)

---

### Criterion 3: Usage
**Definition:** Customer processes at least 1K transactions during pilot.

**Measurement:**
- **Metric:** Total transactions processed during pilot
- **Threshold:** ≥1,000 transactions
- **Tracking:** `reconciliation_jobs` table, sum of `transaction_count`
- **Validation:** Total transactions across all reconciliations ≥1K

**Why It Matters:**
- **Volume:** Proves Settler handles customer's volume
- **Value:** More transactions = more time saved
- **Conversion Signal:** High usage indicates strong conversion intent

**Failure Indicators:**
- ❌ <1K transactions processed during pilot
- ❌ Low transaction volume (not enough to justify automation)
- ❌ Customer doesn't have enough data to test

---

### Criterion 4: Accuracy
**Definition:** Customer achieves 95%+ match rate.

**Measurement:**
- **Metric:** Match rate (matched transactions / total transactions)
- **Threshold:** ≥95%
- **Tracking:** `reconciliation_jobs` table, `match_rate` field
- **Validation:** Average match rate across all reconciliations ≥95%

**Why It Matters:**
- **Quality:** High accuracy proves Settler works well
- **Value:** High accuracy = less manual work
- **Conversion Signal:** High accuracy increases conversion likelihood

**Failure Indicators:**
- ❌ Match rate <95% (too many unmatched transactions)
- ❌ Low accuracy (customer doesn't see value)
- ❌ Data quality issues (poor data = poor accuracy)

---

### Criterion 5: Engagement
**Definition:** Customer logs in at least 3 times during pilot.

**Measurement:**
- **Metric:** Number of logins during pilot
- **Threshold:** ≥3 logins
- **Tracking:** `user_sessions` table, count of sessions during pilot period
- **Validation:** Total logins during pilot ≥3

**Why It Matters:**
- **Adoption:** High engagement indicates adoption
- **Value:** Customers who log in frequently see more value
- **Conversion Signal:** High engagement increases conversion likelihood

**Failure Indicators:**
- ❌ <3 logins during pilot (low engagement)
- ❌ Customer signs up but never uses platform
- ❌ Customer doesn't see value (no reason to log in)

---

## Secondary Success Criteria (Nice to Have)

### Criterion 6: Multiple Reconciliations
**Definition:** Customer runs multiple reconciliations during pilot.

**Measurement:**
- **Metric:** Number of reconciliations run
- **Threshold:** ≥3 reconciliations
- **Tracking:** `reconciliation_jobs` table, count of reconciliations
- **Validation:** Total reconciliations run ≥3

**Why It Matters:**
- **Adoption:** Multiple reconciliations indicate adoption
- **Value:** More reconciliations = more value realized
- **Conversion Signal:** Strong indicator of conversion intent

---

### Criterion 7: Multiple Integrations
**Definition:** Customer connects multiple systems during pilot.

**Measurement:**
- **Metric:** Number of integrations connected
- **Threshold:** ≥2 integrations
- **Tracking:** `integrations` table, count of active integrations
- **Validation:** Total active integrations ≥2

**Why It Matters:**
- **Use Case:** Multiple integrations prove multi-system reconciliation use case
- **Value:** More integrations = more value
- **Conversion Signal:** Strong indicator of conversion intent

---

### Criterion 8: Export Usage
**Definition:** Customer exports reconciliation reports during pilot.

**Measurement:**
- **Metric:** Number of exports during pilot
- **Threshold:** ≥1 export
- **Tracking:** `export_events` table, count of exports
- **Validation:** Total exports during pilot ≥1

**Why It Matters:**
- **Value:** Exports indicate customer is using results
- **Adoption:** Exports indicate adoption
- **Conversion Signal:** Strong indicator of conversion intent

---

### Criterion 9: API Integration
**Definition:** Customer integrates via API during pilot.

**Measurement:**
- **Metric:** API calls made during pilot
- **Threshold:** ≥10 API calls
- **Tracking:** `api_usage` table, count of API calls
- **Validation:** Total API calls during pilot ≥10

**Why It Matters:**
- **Integration:** API integration indicates serious usage
- **Value:** API integration = more value
- **Conversion Signal:** Strong indicator of conversion intent

---

### Criterion 10: Team Adoption
**Definition:** Multiple team members use the platform during pilot.

**Measurement:**
- **Metric:** Number of unique users during pilot
- **Threshold:** ≥2 users
- **Tracking:** `user_sessions` table, count of unique users
- **Validation:** Total unique users during pilot ≥2

**Why It Matters:**
- **Adoption:** Team adoption indicates organizational value
- **Value:** More users = more value
- **Conversion Signal:** Strong indicator of conversion intent

---

## Success Scoring

### Scoring System
- **Primary Criteria:** Each criterion is worth 20 points (5 criteria × 20 = 100 points)
- **Secondary Criteria:** Each criterion is worth 10 points (5 criteria × 10 = 50 points)
- **Total Score:** 150 points maximum

### Conversion Thresholds
- **Convert (Go):** ≥80 points (meets all primary criteria + some secondary)
- **Extend (Maybe):** 60-79 points (meets most primary criteria, needs more time)
- **Stop (No-Go):** <60 points (doesn't meet primary criteria)

### Scoring Example
**Example 1: Strong Pilot (Convert)**
- ✅ First Reconciliation: 20 points
- ✅ Time-to-Value: 20 points
- ✅ Usage: 20 points
- ✅ Accuracy: 20 points
- ✅ Engagement: 20 points
- ✅ Multiple Reconciliations: 10 points
- ✅ Multiple Integrations: 10 points
- **Total:** 120 points → **Convert**

**Example 2: Weak Pilot (Stop)**
- ✅ First Reconciliation: 20 points
- ❌ Time-to-Value: 0 points (>7 days)
- ❌ Usage: 0 points (<1K transactions)
- ❌ Accuracy: 0 points (<95% match rate)
- ❌ Engagement: 0 points (<3 logins)
- **Total:** 20 points → **Stop**

---

## Success Tracking

### Automated Tracking
- **Database Queries:** Track all criteria automatically via database queries
- **Dashboard:** Display success criteria in Console dashboard
- **Alerts:** Alert when criteria are met/failed

### Manual Tracking
- **Sales Check-Ins:** Sales team checks in at day 7 and day 14
- **Customer Feedback:** Collect feedback on pilot experience
- **Success Review:** Review success criteria before conversion decision

---

## Related Documents

- `/docs/PILOT_PROGRAM.md` - Pilot program design
- `/docs/PILOT_RISKS.md` - Risk analysis
- `/docs/ONBOARDING_GUIDE.md` - Onboarding guide
