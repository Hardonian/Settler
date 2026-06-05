# Settler — 3-Year Financial Model

**Date:** June 2026
**Stage:** Pre-Seed
**Status:** Pre-Revenue — All Figures Are Projections
**Disclaimer:** This model is for fundraising planning purposes. All assumptions are clearly labeled and must be validated against actual customer data as it becomes available.

---

## Key Assumptions

| Assumption              | Value                     | Basis                                                       |
| ----------------------- | ------------------------- | ----------------------------------------------------------- |
| Average Starter ARPU    | $45/month                 | $29 base + ~$16 avg overage                                 |
| Average Growth ARPU     | $175/month                | $99 base + ~$76 avg overage                                 |
| Average Enterprise ARPU | $2,000/month              | Custom pricing, mid-range                                   |
| Blended ARPU (Year 1)   | $85/month                 | Weighted by expected tier mix                               |
| Blended ARPU (Year 2)   | $110/month                | Mix shifts toward Growth/Enterprise                         |
| Blended ARPU (Year 3)   | $140/month                | Enterprise share increases                                  |
| Monthly logo churn      | 6% (Y1), 4% (Y2), 3% (Y3) | Pre-seed SaaS typical; no customer data to validate         |
| Gross margin            | 85%                       | Infrastructure ~15% of revenue                              |
| CAC (founder-led)       | $200 (Y1)                 | Content, SEO, founder outbound. No paid acquisition budget. |
| CAC (scaled)            | $350 (Y2), $400 (Y3)      | Adding paid channels, partnerships                          |
| Months to first revenue | 3                         | Product is built; need first 10 customers                   |

---

## Scenario A: Base Case

### Revenue Projections

| Month        | New Customers | Churned | Total Customers | Blended ARPU | MRR    | ARR (annualized) |
| ------------ | ------------- | ------- | --------------- | ------------ | ------ | ---------------- |
| **Month 1**  | 2             | 0       | 2               | $85          | $170   | $2,040           |
| **Month 2**  | 2             | 0       | 4               | $85          | $340   | $4,080           |
| **Month 3**  | 3             | 0       | 7               | $85          | $595   | $7,140           |
| **Month 4**  | 3             | 0       | 10              | $85          | $850   | $10,200          |
| **Month 5**  | 4             | 1       | 13              | $85          | $1,105 | $13,260          |
| **Month 6**  | 5             | 1       | 17              | $85          | $1,445 | $17,340          |
| **Month 7**  | 6             | 1       | 22              | $85          | $1,870 | $22,440          |
| **Month 8**  | 7             | 1       | 28              | $85          | $2,380 | $28,560          |
| **Month 9**  | 8             | 2       | 34              | $85          | $2,890 | $34,680          |
| **Month 10** | 10            | 2       | 42              | $85          | $3,570 | $42,840          |
| **Month 11** | 12            | 3       | 51              | $85          | $4,335 | $52,020          |
| **Month 12** | 14            | 3       | 62              | $85          | $5,270 | $63,240          |

**Year 1 Summary:**

- Ending MRR: **$5,270**
- Ending ARR: **$63,240**
- Total customers at end of Y1: **62**
- Total revenue earned (cumulative MRR): **~$24,830**
- New customers added: **76**
- Customers lost to churn: **14**

### Year 2 (Monthly Aggregated to Quarters)

| Quarter   | New Customers | Churned | End Customers | ARPU | End MRR | End ARR  |
| --------- | ------------- | ------- | ------------- | ---- | ------- | -------- |
| **Q1 Y2** | 50            | 10      | 102           | $100 | $10,200 | $122,400 |
| **Q2 Y2** | 65            | 12      | 155           | $105 | $16,275 | $195,300 |
| **Q3 Y2** | 80            | 14      | 221           | $110 | $24,310 | $291,720 |
| **Q4 Y2** | 100           | 16      | 305           | $115 | $35,075 | $420,900 |

**Year 2 Summary:**

- Ending MRR: **$35,075**
- Ending ARR: **$420,900**
- Ending customers: **305**
- Total revenue earned Y2: **~$257,600**

### Year 3 (Monthly Aggregated to Quarters)

| Quarter   | New Customers | Churned | End Customers | ARPU | End MRR  | End ARR    |
| --------- | ------------- | ------- | ------------- | ---- | -------- | ---------- |
| **Q1 Y3** | 130           | 18      | 417           | $125 | $52,125  | $625,500   |
| **Q2 Y3** | 160           | 20      | 557           | $130 | $72,410  | $868,920   |
| **Q3 Y3** | 200           | 22      | 735           | $135 | $99,225  | $1,190,700 |
| **Q4 Y3** | 250           | 25      | 960           | $140 | $134,400 | $1,612,800 |

**Year 3 Summary:**

- Ending MRR: **$134,400**
- Ending ARR: **$1,612,800**
- Ending customers: **960**
- Total revenue earned Y3: **~$1,074,500**

---

## Cost Model

### Year 1 — Cost Structure

| Category                  | Monthly (Avg) | Annual      | Notes                                                                                                     |
| ------------------------- | ------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| **Infrastructure**        | $350          | $4,200      | Supabase Pro ($25), Vercel Pro ($20), Upstash ($10), Sentry ($30), domains/misc ($15). Scales with usage. |
| **Founder salary**        | $5,000        | $60,000     | Below-market; founder drawing minimum.                                                                    |
| **Legal / Accounting**    | $500          | $6,000      | Entity formation, basic bookkeeping, contract review.                                                     |
| **Sales / Marketing**     | $500          | $6,000      | Content hosting, SEO tools, minor paid. No FTE hires Y1.                                                  |
| **Tools / Subscriptions** | $200          | $2,400      | GitHub, analytics, email, CRM starter.                                                                    |
| **Contingency (10%)**     | $655          | $7,860      | Buffer for unexpected costs.                                                                              |
| **Total burn**            | **$7,205**    | **$86,460** |                                                                                                           |

### Year 1 P&L

| Item                  | Amount        |
| --------------------- | ------------- |
| Total Revenue         | $24,830       |
| COGS (15% of revenue) | ($3,725)      |
| **Gross Profit**      | **$21,105**   |
| Operating Expenses    | ($82,735)     |
| **Net Loss**          | **($61,630)** |

### Year 2 — Cost Structure

| Category                 | Monthly (Avg) | Annual       | Notes                                       |
| ------------------------ | ------------- | ------------ | ------------------------------------------- |
| Infrastructure           | $1,200        | $14,400      | Scaled usage.                               |
| Founder salary           | $8,000        | $96,000      | Modest increase.                            |
| First hire (eng/support) | $6,000        | $72,000      | Part-time or contract initially. Starts Q2. |
| Sales / Marketing        | $2,000        | $24,000      | Content, SEO, early paid experiments.       |
| Legal / Accounting       | $750          | $9,000       | SOC 2 prep begins.                          |
| Tools / Subscriptions    | $400          | $4,800       | Expanded tooling.                           |
| Contingency              | $1,835        | $22,020      |                                             |
| **Total burn**           | **$20,185**   | **$242,220** |                                             |

### Year 2 P&L

| Item               | Amount       |
| ------------------ | ------------ |
| Total Revenue      | $257,600     |
| COGS (15%)         | ($38,640)    |
| **Gross Profit**   | **$218,960** |
| Operating Expenses | ($203,580)   |
| **Net Profit**     | **$15,380**  |

### Year 3 — Cost Structure

| Category              | Monthly (Avg) | Annual       | Notes                             |
| --------------------- | ------------- | ------------ | --------------------------------- |
| Infrastructure        | $4,000        | $48,000      | Significant scale.                |
| Founder salary        | $12,000       | $144,000     | Market-rate approach.             |
| Engineering (2 FTE)   | $20,000       | $240,000     | Two full-time engineers.          |
| Sales / CS (1 FTE)    | $8,000        | $96,000      | Dedicated sales/CS hire.          |
| Sales / Marketing     | $5,000        | $60,000      | Content, partnerships, paid.      |
| Legal / Accounting    | $2,000        | $24,000      | SOC 2 Type I, ongoing compliance. |
| Tools / Subscriptions | $800          | $9,600       | Full tool stack.                  |
| Office / Misc         | $1,000        | $12,000      | Co-working, travel, events.       |
| Contingency           | $5,280        | $63,360      |                                   |
| **Total burn**        | **$58,080**   | **$696,960** |                                   |

### Year 3 P&L

| Item               | Amount       |
| ------------------ | ------------ |
| Total Revenue      | $1,074,500   |
| COGS (15%)         | ($161,175)   |
| **Gross Profit**   | **$913,325** |
| Operating Expenses | ($535,785)   |
| **Net Profit**     | **$377,540** |

---

## Scenario B: Conservative Case (30% slower growth)

| Metric              | Year 1    | Year 2    | Year 3     |
| ------------------- | --------- | --------- | ---------- |
| Ending customers    | 43        | 210       | 670        |
| Ending MRR          | $3,655    | $24,150   | $93,800    |
| Ending ARR          | $43,860   | $289,800  | $1,125,600 |
| Annual revenue      | $17,380   | $180,300  | $752,150   |
| Net profit / (loss) | ($69,080) | ($62,000) | $55,190    |

## Scenario C: Aggressive Case (50% faster growth)

| Metric              | Year 1    | Year 2   | Year 3     |
| ------------------- | --------- | -------- | ---------- |
| Ending customers    | 93        | 460      | 1,440      |
| Ending MRR          | $7,905    | $52,900  | $201,600   |
| Ending ARR          | $94,860   | $634,800 | $2,419,200 |
| Annual revenue      | $37,250   | $386,400 | $1,611,750 |
| Net profit / (loss) | ($49,210) | $107,000 | $737,000   |

---

## Runway Analysis (Based on Raise Amount)

| Raise Amount | Monthly Burn (Y1) | Runway (months) | Enough to Hit $5K MRR?         |
| ------------ | ----------------- | --------------- | ------------------------------ |
| $250K        | $7,205            | ~34 months      | Yes (Month 17–20 in base case) |
| $350K        | $7,205            | ~48 months      | Yes, with margin               |
| $500K        | $7,205            | ~69 months      | Yes, significant buffer        |

> **Note:** Runway assumes zero revenue contribution in early months. Actual runway extends as revenue kicks in.

---

## Unit Economics at Scale (Year 3 Base Case)

| Metric                    | Value                                 | Benchmark                     |
| ------------------------- | ------------------------------------- | ----------------------------- |
| Blended ARPU              | $140/month                            | —                             |
| Gross Margin              | 85%                                   | >80% = strong                 |
| CAC                       | $400                                  | —                             |
| LTV (at 3% monthly churn) | $140 × 33 = $4,620                    | —                             |
| LTV/CAC                   | **11.6:1**                            | >3:1 = healthy                |
| CAC Payback               | $400 / ($140 × 0.85) = **3.4 months** | <12 months = strong           |
| Monthly logo churn        | 3%                                    | <5% = acceptable for SMB SaaS |
| Rule of 40 check          | Revenue growth % + profit margin %    | Target: >40%                  |

---

## Loan Repayment Schedule (Hybrid Structure)

Assuming $150K loan component at 8% annual interest, 36-month term, 6-month deferral:

| Period       | Monthly Payment | Cumulative Paid              | Outstanding Balance         |
| ------------ | --------------- | ---------------------------- | --------------------------- |
| Months 1–6   | $0 (deferred)   | $0                           | $150,000 + accrued interest |
| Months 7–12  | $3,200          | $19,200                      | ~$136,800                   |
| Months 13–24 | $4,800          | $57,600 + $19,200 = $76,800  | ~$84,000                    |
| Months 25–36 | $7,500          | $90,000 + $76,800 = $166,800 | $0                          |

**Total repayment:** ~$166,800 on $150K principal (effective cost: ~$16,800 in interest)

> Note: Exact amortization depends on interest calculation method (simple vs. compound) and deferral terms. This is illustrative.

---

## Revenue-Based Financing Conversion Scenario

If investor converts $100K equity stake to RBF at Month 12 (when MRR = $5,270):

| Parameter                             | Value                          |
| ------------------------------------- | ------------------------------ |
| Revenue share rate                    | 5% of gross monthly revenue    |
| Repayment cap                         | 2.0x = $200,000                |
| Monthly payment at $5,270 MRR         | $263/month                     |
| Monthly payment at $35K MRR (Y2 end)  | $1,754/month                   |
| Monthly payment at $134K MRR (Y3 end) | $6,720/month                   |
| Estimated months to cap               | ~24–30 months after conversion |

---

## Key Sensitivities

| Variable                       | Impact of 10% Change                               |
| ------------------------------ | -------------------------------------------------- |
| ARPU                           | ±10% on all revenue projections                    |
| Churn rate                     | ±15–20% on LTV and ending customer count           |
| CAC                            | ±10% on required marketing spend; ±10% on LTV/CAC  |
| Months to first customer       | Shifts entire revenue timeline; ±$7K on Y1 revenue |
| Conversion rate (trial → paid) | Direct impact on customer acquisition volume       |

---

## What This Model Does NOT Include

- **No revenue from enterprise deals** in Year 1 (conservative — all customers assumed SMB)
- **No expansion revenue** modeled (upsells within existing accounts not counted)
- **No partner/channel revenue** (Stripe Apps, accounting firm partnerships not modeled)
- **No fundraising proceeds as revenue** (raise is balance sheet, not P&L)
- **No one-time implementation fees** (could add $5K–$25K per enterprise deal)
- **Tax effects not modeled** — RBF payment tax treatment varies by jurisdiction

---

_All projections are estimates based on stated assumptions. Actual results will vary. This model should be updated monthly once revenue data is available._
