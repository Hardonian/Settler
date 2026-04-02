# Pricing Policy Memo

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Why We Price This Way

### Decision Framework

**1. Free Tier — Acquisition Funnel**

- Free tier is not a revenue strategy; it's an acquisition strategy
- Target: Developers and small teams who become advocates
- Conversion goal: 5-10% within 6 months
- Cost: Minimal (limited usage, community support)

**2. Starter ($29) — Entry Point**

- Lowest paid tier must be accessible for small businesses
- Price reflects minimal viable business, not maximum extraction
- Target customer: Single e-commerce store, <100 orders/month
- Strategic: This tier often upgrades when they grow

**3. Growth ($99) — Primary Revenue**

- This is where we expect most revenue to come from
- Price reflects real business value (hours saved, errors prevented)
- Target customer: Growing e-commerce, multiple platforms
- Sweet spot: $0.02 per transaction (very low friction)

**4. Scale ($299) — Volume Efficiency**

- For customers with high transaction volumes
- Price reflects infrastructure savings (dedicated resources)
- Target customer: Large e-commerce, multi-entity
- Competitive: Still cheaper than manual reconciliation labor

**5. Enterprise — Value Capture**

- Custom pricing based on customer value
- Target: >$10K ACV for large customers
- Includes everything + customization + SLAs
- Revenue model: 5% of total revenue

### Why Not Usage-Based Only?

**Reasoning:**

1. Predictability matters for both sides
2. Reduces billing complexity
3. Aligns with customer value (they know costs)
4. Makes financial planning easier

**When to Consider Pure Usage-Based:**

- Enterprise with highly variable volumes
- Customers requesting it (negotiation)
- When we have better cost visibility

---

## When to Discount

### Approved Discount Scenarios

| Scenario                        | Maximum Discount   | Approval Required |
| ------------------------------- | ------------------ | ----------------- |
| Annual billing (all tiers)      | 17%                | Automatic         |
| Non-profit organizations        | 30%                | Founder           |
| Startup program (YC, Techstars) | 50% for 1 year     | Founder           |
| Pilot to paid conversion        | 20% for first year | Founder           |
| Volume (3+ seats)               | 15%                | Automatic         |
| Competitive win                 | Case-by-case       | Founder           |

### Discount Approval Workflow

1. Customer requests discount
2. Operator checks discount matrix
3. If within limits → Apply discount
4. If outside limits → Escalate to founder
5. Document discount in customer record
6. Log decision in `decisions/`

### Discount Anti-Patterns (Avoid)

- ❌ Discounting just to close a deal
- ❌ Matching competitor pricing without analysis
- ❌ Giving discounts without term commitment
- ❌ Discounting below cost-plus margin
- ❌ Discounting without documented rationale

---

## Enterprise Pricing Negotiation

### Negotiation Principles

**1. Know Your BATNA**

- Worst case: Customer uses manual process or competitor
- Best case: Customer pays full list price

**2. Create Value Before Discounting**

- Demonstrate value first
- Quantify ROI before discussing price
- Position discount as "thank you for commitment"

**3. Trade, Don't Give**

- Customer wants 20% off? → Offer 2-year term instead
- Customer wants net-60? → Offer annual prepay for same discount
- Always trade something for discount

**4. Anchor High**

- Start at higher price, negotiate down
- Never start at your minimum acceptable price
- Enterprise customers expect to negotiate

### Enterprise Deal Stages

| Stage       | Action                | Typical Discount |
| ----------- | --------------------- | ---------------- |
| Discovery   | Understand needs      | None             |
| Proposal    | Present solution      | 10%              |
| Negotiation | Trade for concessions | 15-20%           |
| Commitment  | Final terms           | Up to 25%        |
| Signature   | Lock in               | Final terms      |

---

## Pricing Changes

### When to Change Prices

**Consider price increases when:**

- Costs increase significantly
- Product value increases (new features)
- Market conditions change
- Competitors raise prices

**Consider price decreases when:**

- Costs decrease significantly
- Acquiring market share against cheaper competitors
- Entering new geographic market

### Price Change Process

1. **Proposal** — Document rationale, analysis, recommendation
2. **Decision** — Founder approval required
3. **Notice** — 30 days for existing customers
4. **Communication** — Proactive outreach to affected customers
5. **Documentation** — Log in `decisions/` folder

**Never:**

- Change prices retroactively
- Apply new prices to existing contracts
- Change pricing without notice

---

## Related Documents

| Document                            | Purpose                |
| ----------------------------------- | ---------------------- |
| `00_PRICING_CANONICAL.md`           | Full pricing reference |
| `../decisions/README.md`            | Decision log process   |
| `../runbooks/FIRST_SALE_RUNBOOK.md` | Sales process          |
