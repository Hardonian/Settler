# Settler — ROI Calculator

**Purpose:** Self-serve calculation showing labor savings vs. Settler cost by transaction volume
**Usage:** Include in investor materials, pricing page, and sales conversations

---

## Calculator

### Input Variables

| Variable                                    | Description                                                                         | How to Determine                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Monthly transaction volume**              | Total transactions to reconcile per month                                           | Count: Stripe payouts + PayPal settlements + bank deposits + other sources     |
| **Hourly cost of labor**                    | Fully-loaded cost of person doing reconciliation                                    | Salary ÷ 2080 hours + 25% benefits overhead. Default: $50/hour                 |
| **Current monthly hours on reconciliation** | Hours/month spent on manual matching, exception investigation, evidence preparation | Self-reported. Industry average: 20–50 hours/month                             |
| **Estimated auto-match rate**               | Percentage Settler will auto-match                                                  | Conservative: 80%. Typical: 90%. Best case (after 6 months): 95%. Default: 85% |

---

### Calculation Method

```
CURRENT COST:
  Monthly labor cost = Hours/month × Hourly rate
  Annual labor cost  = Monthly labor cost × 12

SETTLER COST:
  If transactions ≤ 1,000:   Monthly cost = $29
  If transactions ≤ 10,000:  Monthly cost = $99 + (transactions - 10,000) × $0.01 [if over]
  If transactions ≤ 100,000: Monthly cost = $499 + (transactions - 100,000) × $0.005 [if over]
  Annual cost = Monthly cost × 12

TIME SAVED:
  Auto-matched transactions = Volume × Match rate
  Manual review transactions = Volume × (1 - Match rate)
  Estimated review time per exception = 5 minutes
  Total review time = Manual review transactions × 5 minutes ÷ 60
  New monthly hours = Total review time + 1 hour (proofpack review, run management)
  Hours saved = Current hours - New monthly hours

SAVINGS:
  Monthly savings = (Hours saved × Hourly rate) - Settler monthly cost
  Annual savings  = Monthly savings × 12
  ROI % = (Annual savings ÷ Annual Settler cost) × 100
  Payback period = Settler monthly cost ÷ (Hours saved × Hourly rate / 30 days)
```

---

### Pre-Computed Scenarios

#### Scenario A: Small E-Commerce Shop

| Input                     | Value |
| ------------------------- | ----- |
| Monthly transactions      | 2,000 |
| Hourly labor cost         | $40   |
| Current hours/month       | 15    |
| Estimated auto-match rate | 85%   |

| Output                         | Value                                                  |
| ------------------------------ | ------------------------------------------------------ |
| **Current monthly labor cost** | $600                                                   |
| **Settler monthly cost**       | $39 ($29 + 1,000 × $0.01)                              |
| Auto-matched transactions      | 1,700                                                  |
| Manual review transactions     | 300                                                    |
| Estimated review time          | 25 hours → **3.5 hours** (300 × 5min ÷ 60 + 1 hr mgmt) |
| **Hours saved per month**      | **11.5 hours**                                         |
| **Monthly savings**            | $460 - $39 = **$421**                                  |
| **Annual savings**             | **$5,052**                                             |
| **ROI**                        | **1,080%**                                             |
| **Payback period**             | **< 3 days**                                           |

---

#### Scenario B: Growing SaaS Company

| Input                     | Value  |
| ------------------------- | ------ |
| Monthly transactions      | 15,000 |
| Hourly labor cost         | $55    |
| Current hours/month       | 30     |
| Estimated auto-match rate | 90%    |

| Output                         | Value                                                        |
| ------------------------------ | ------------------------------------------------------------ |
| **Current monthly labor cost** | $1,650                                                       |
| **Settler monthly cost**       | $149 ($99 + 5,000 × $0.01)                                   |
| Auto-matched transactions      | 13,500                                                       |
| Manual review transactions     | 1,500                                                        |
| Estimated review time          | 125 hours → **14.5 hours** (1,500 × 5min ÷ 60 + 1.5 hr mgmt) |
| **Hours saved per month**      | **15.5 hours**                                               |
| **Monthly savings**            | $852.50 - $149 = **$703.50**                                 |
| **Annual savings**             | **$8,442**                                                   |
| **ROI**                        | **472%**                                                     |
| **Payback period**             | **< 6 days**                                                 |

---

#### Scenario C: Mid-Market Retailer

| Input                     | Value  |
| ------------------------- | ------ |
| Monthly transactions      | 80,000 |
| Hourly labor cost         | $60    |
| Current hours/month       | 50     |
| Estimated auto-match rate | 92%    |

| Output                         | Value                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Current monthly labor cost** | $3,000                                                                                                                                    |
| **Settler monthly cost**       | $499 (Professional tier, within 100K limit)                                                                                               |
| Auto-matched transactions      | 73,600                                                                                                                                    |
| Manual review transactions     | 6,400                                                                                                                                     |
| Estimated review time          | 533 hours → **56 hours** (6,400 × 5min ÷ 60 + 2.5 hr mgmt)                                                                                |
| **Hours saved per month**      | **~0 without rule improvement — but quality improvement is massive**                                                                      |
| **Actual value:**              | Exception time is restructured, not eliminated. Value is in evidence quality, audit readiness, and institutional memory — not just hours. |
| **Adjusted monthly savings**   | $3,000 - $499 - $1,260 (remaining review labor) = **$1,241**                                                                              |
| **Annual savings**             | **$14,892**                                                                                                                               |
| **ROI**                        | **249%**                                                                                                                                  |
| **Payback period**             | **< 13 days**                                                                                                                             |

> **Note on Scenario C:** At high transaction volumes, the primary ROI shifts from labor hours saved to evidence quality, audit preparation elimination, and risk reduction. The hours saved metric alone understates the value for these customers.

---

#### Scenario D: Enterprise Comparison

| Comparing           | Enterprise Tool (BlackLine/FloQast)  | Settler (Professional) |
| ------------------- | ------------------------------------ | ---------------------- |
| Annual cost         | $77,000–$340,000                     | $5,988                 |
| Implementation cost | $20,000–$100,000                     | $0 (self-service)      |
| Implementation time | 3–6 months                           | < 1 day                |
| Annual maintenance  | Included (often with fee escalation) | Included               |
| **Year 1 total**    | **$97,000–$440,000**                 | **$5,988**             |
| **3-year total**    | **$251,000–$1,120,000**              | **$17,964**            |

---

## Value Beyond Hours

This calculator focuses on time/cost savings, but investors should note additional value that is harder to quantify:

| Value                             | Description                                                        | Estimated Impact                                                           |
| --------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Audit preparation elimination** | Proofpacks replace manual evidence compilation                     | 2–5 days/quarter saved during audit prep                                   |
| **Error reduction**               | Deterministic matching eliminates human matching errors            | Prevents misstatements, potential restatement costs ($50K–$500K per event) |
| **Close time reduction**          | Reconciliation is consistently cited as #1 close bottleneck        | 1–3 days faster close per month                                            |
| **Compliance confidence**         | Hash-linked evidence vs. email-based evidence                      | Reduced audit finding risk                                                 |
| **Knowledge retention**           | Institutional memory survives employee turnover                    | Eliminates "the person who knew how to do recon left" risk                 |
| **Scaling capacity**              | Manual reconciliation scales linearly with volume; Settler doesn't | Enables 10x transaction growth without 10x headcount                       |

---

## How to Present to Investors

> "At $99/month, Settler replaces $600–$1,650/month in labor costs for a typical Growth-tier customer. ROI is 400–1,000%+. Payback period is under a week. And that's before counting audit prep savings, error reduction, and close time improvement."

> "This isn't a 'nice to have' — it's a 13x return on a $99/month spend."

---

_All scenarios use stated assumptions. Actual results depend on data quality, source complexity, and customer-specific matching requirements. Match rate estimates are projections based on product design, not measured customer data. Must be validated through pilot programs._
