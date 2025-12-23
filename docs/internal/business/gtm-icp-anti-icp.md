# Settler ICP & Anti-ICP Definitions

**Classification:** Internal - Strategic  
**Date:** January 2026  
**Purpose:** Precise customer profile definitions that filter wrong buyers and attract right buyers

---

## Ideal Customer Profile (ICP)

### Primary ICP: Mid-Market Companies ($1M-$50M ARR) Processing 1,000+ Transactions/Month

#### Firmographic Criteria

**Company Size:**
- **Revenue:** $1M-$50M ARR
- **Employees:** 10-500 employees
- **Stage:** Growth-stage companies scaling operations

**Transaction Volume:**
- **Minimum:** 1,000 transactions/month
- **Optimal:** 10,000-100,000 transactions/month
- **Maximum:** 1M+ transactions/month (Enterprise tier)

**Platform Complexity:**
- **Minimum:** 3+ platforms (payment processor + e-commerce + accounting)
- **Optimal:** 5-15 platforms
- **Examples:** Stripe + Shopify + QuickBooks + NetSuite + PayPal

**Industry:**
- E-commerce (online retailers, marketplaces)
- SaaS (subscription businesses, B2B software)
- Fintech (payment processors, financial services)
- Marketplace platforms (multi-vendor, multi-payment)

#### Behavioral Criteria

**Current State:**
- **Manual reconciliation:** 2-4 hours daily spent matching transactions
- **Custom scripts:** Built in-house reconciliation code
- **Spreadsheets:** Using Excel/Google Sheets for reconciliation
- **Pain points:** Revenue leakage, compliance failures, operational delays

**Compliance Requirements:**
- SOC 2 audits
- Financial audits
- Regulatory obligations (GDPR, CCPA, PCI-DSS)
- Industry-specific compliance (healthcare, finance)

**Technical Capability:**
- Engineering team OR technical finance team
- API integration experience
- Comfortable with technical tools

**Risk Sensitivity:**
- Cannot tolerate revenue leakage
- Cannot tolerate compliance failures
- Need audit trails for financial reporting
- Need deterministic guarantees

#### Buyer Personas

**1. Finance Director / CFO (Business Buyer)**

**Demographics:**
- Title: Finance Director, CFO, VP Finance, Controller
- Reports to: CEO, Board
- Budget authority: $500-$2,000/month
- Decision timeframe: 1-3 months

**Pain Points:**
- **Manual reconciliation:** 2-4 hours daily spent matching transactions
- **Revenue leakage:** $6K-$24K/year in undetected discrepancies
- **Compliance risk:** $50K-$500K+ in regulatory fines
- **Audit preparation:** $20K-$100K/year in audit costs
- **Operational delays:** 2-5 day delays in financial visibility

**Goals:**
- Eliminate manual reconciliation work
- Ensure compliance (SOC 2, financial audits)
- Prevent revenue leakage
- Create audit trails for financial reporting
- Reduce operational risk

**Decision Criteria:**
- Compliance guarantees (SOC 2, audit trails)
- Risk elimination (revenue leakage, compliance failures)
- ROI (7-42x compared to building in-house)
- Support (dedicated account manager for enterprise)

**Willingness to Pay:**
- **Starter tier:** $99/month (too low, won't buy)
- **Growth tier:** $299/month (comfortable)
- **Enterprise tier:** $2K-$10K/month (willing to pay)

**Red Flags:**
- Price-only buyer
- No compliance requirements
- Single-platform business
- Very low transaction volume

---

**2. CTO / VP Engineering (Technical Buyer)**

**Demographics:**
- Title: CTO, VP Engineering, Engineering Director, Head of Engineering
- Reports to: CEO, CTO
- Budget authority: $200-$1,000/month
- Decision timeframe: 2-4 weeks

**Pain Points:**
- **Custom code maintenance:** 200-400 hours/year maintaining reconciliation scripts
- **API breakage:** External systems change, code breaks
- **Technical debt:** Reconciliation code becomes unmaintainable
- **Team velocity:** 20-40% of engineering time on non-core features
- **Integration complexity:** Managing 5-10+ platform integrations

**Goals:**
- Eliminate custom code maintenance
- Recover engineering time for core product
- Ensure API reliability
- Reduce technical debt
- Simplify integration complexity

**Decision Criteria:**
- API reliability (deterministic behavior, error handling)
- Maintenance elimination (we maintain adapters)
- Time recovery (200-400 hours/year back to core product)
- Integration simplicity (50+ platform adapters)

**Willingness to Pay:**
- **Starter tier:** $99/month (comfortable)
- **Growth tier:** $299/month (comfortable)
- **Enterprise tier:** $1K-$3K/month (willing to pay)

**Red Flags:**
- "We'll build it ourselves" (proud of custom code)
- No API integration experience
- Single-platform business
- Very low transaction volume

---

**3. Operations Manager (End User / Champion)**

**Demographics:**
- Title: Operations Manager, Finance Manager, Accounting Manager, Revenue Operations
- Reports to: Finance Director, CFO
- Budget authority: $0 (advocates, doesn't control budget)
- Decision timeframe: 1-2 months (needs to convince Finance Director)

**Pain Points:**
- **Daily grind:** 2-3 hours/day manually matching transactions
- **Exception handling:** 10-20 unmatched transactions daily requiring investigation
- **Report generation:** 1 hour/day creating reconciliation reports
- **Stress:** Constant fear of missing discrepancies
- **Work-life balance:** Working nights/weekends to catch up

**Goals:**
- Eliminate daily manual work
- Reduce stress and burnout risk
- Move from manual work to analysis
- Career growth (strategic work vs. manual work)

**Decision Criteria:**
- Eliminates manual work (automated matching, exception queue)
- Reduces stress (automated workflows, clear exception handling)
- Career growth (move to strategic work)
- Ease of use (but doesn't control budget)

**Willingness to Pay:**
- **Starter tier:** $29-$99/month (comfortable)
- **Growth tier:** $99-$199/month (needs justification)
- **Enterprise tier:** Doesn't control budget

**Red Flags:**
- Doesn't do manual reconciliation (wrong role)
- Happy with current process (no pain)
- Very low transaction volume

---

## Anti-ICP: Who Should NOT Buy Settler

### Explicit Disqualification Criteria

**Why explicit disqualification increases trust:**
- Demonstrates confidence and honesty
- Saves time and reduces churn
- Makes Settler feel inevitable for right buyer, unnecessary for wrong buyer

---

### Anti-ICP 1: Single-Platform Businesses

**Who they are:**
- Companies using only one platform (e.g., only Stripe, no other systems)
- No need to reconcile between platforms

**Why they shouldn't buy:**
- No reconciliation needed if only one platform
- Settler's value is in multi-platform reconciliation

**Qualification question:**
- "How many platforms do you reconcile between?"
- **Disqualify if:** Answer is 1 platform

**What to say:**
- "If you only use Stripe and nothing else, you don't need reconciliation. Settler's value is in reconciling transactions across multiple platforms. When you add Shopify or QuickBooks, come back to us."

---

### Anti-ICP 2: Very Small Businesses (<100 Transactions/Month)

**Who they are:**
- Companies processing <100 transactions/month
- Manual reconciliation is manageable at low volume

**Why they shouldn't buy:**
- Manual reconciliation is feasible at low volume
- Settler's value is in eliminating manual work at scale

**Qualification question:**
- "How many transactions do you process monthly?"
- **Disqualify if:** <100 transactions/month

**What to say:**
- "At <100 transactions/month, manual reconciliation is manageable. Settler's value is in eliminating manual work at scale. When you reach 1,000+ transactions/month, come back to us. Until then, our free tier (1,000 reconciliations/month) might be sufficient."

---

### Anti-ICP 3: Price-Only Buyers

**Who they are:**
- Companies that only care about price, not value
- Will churn when they find cheaper alternatives

**Why they shouldn't buy:**
- Will churn when competitors offer lower prices
- Don't value risk elimination, compliance guarantees

**Qualification question:**
- "What happens if reconciliation fails or is wrong?"
- **Disqualify if:** "Nothing serious" or "We'll deal with it"

**What to say:**
- "Settler's value is in eliminating $106K-$724K+ in annual risk. If that risk doesn't matter to you, Settler isn't the right fit. We focus on companies that value compliance guarantees and risk elimination."

---

### Anti-ICP 4: Build-It-Ourselves Companies

**Who they are:**
- Companies that want to build custom solutions regardless of cost
- Proud of their custom code

**Why they shouldn't buy:**
- Will build custom solutions regardless of cost
- Don't value maintenance elimination, compliance guarantees

**Qualification question:**
- "Have you built custom reconciliation code before?"
- **Disqualify if:** "Yes, and we're proud of it" or "We'll build it ourselves"

**What to say:**
- "If you want to build custom solutions, that's your choice. Settler's value is in eliminating maintenance burden, compliance drift, and long-term costs. If you prefer to build it yourself, we respect that. When you realize the maintenance burden, come back to us."

---

### Anti-ICP 5: Compliance-Immune Businesses

**Who they are:**
- Companies with no compliance requirements
- Don't care about audit trails, SOC 2, GDPR

**Why they shouldn't buy:**
- Don't value compliance guarantees
- Settler's value is in compliance-ready infrastructure

**Qualification question:**
- "Do you have compliance requirements?"
- **Disqualify if:** "No, and we don't care" or "We don't need compliance"

**What to say:**
- "Settler's value is in compliance-ready infrastructure (SOC 2, GDPR, audit trails). If you don't have compliance requirements, Settler might be overkill. When you need compliance (SOC 2 audits, financial audits), come back to us."

---

### Anti-ICP 6: Very Large Enterprises ($100M+ ARR)

**Who they are:**
- Companies with $100M+ ARR
- Dedicated finance teams, custom solutions

**Why they might not buy:**
- May prefer enterprise solutions (BlackLine, etc.)
- May have custom solutions already built

**Qualification question:**
- "What's your current reconciliation process?"
- **Disqualify if:** "We use BlackLine" or "We have a custom solution"

**What to say:**
- "Settler is optimized for mid-market companies ($1M-$50M ARR). If you're using BlackLine or have custom solutions, Settler might not be the right fit. However, if you're looking for a modern, API-first alternative, we'd be happy to discuss."

---

## ICP Scoring Matrix

### Qualification Score (0-10)

**Firmographic Criteria (0-3 points):**
- Revenue $1M-$50M ARR: 1 point
- 1,000+ transactions/month: 1 point
- 3+ platforms: 1 point

**Behavioral Criteria (0-3 points):**
- Manual reconciliation pain: 1 point
- Compliance requirements: 1 point
- Technical capability: 1 point

**Buyer Persona (0-2 points):**
- Finance Director/CFO: 2 points
- CTO/VP Engineering: 2 points
- Operations Manager: 1 point

**Risk Sensitivity (0-2 points):**
- Cannot tolerate revenue leakage: 1 point
- Cannot tolerate compliance failures: 1 point

**Scoring:**
- **8-10 points:** Strong ICP fit, prioritize
- **5-7 points:** Good ICP fit, qualify further
- **3-4 points:** Weak ICP fit, disqualify or free tier
- **0-2 points:** Anti-ICP, disqualify

---

## ICP Validation Checklist

**Before proceeding with sales conversation, confirm:**

- [ ] Revenue $1M-$50M ARR
- [ ] 1,000+ transactions/month
- [ ] 3+ platforms
- [ ] Manual reconciliation pain (2+ hours/day)
- [ ] Compliance requirements (SOC 2, financial audits)
- [ ] Technical capability (engineering team or technical finance team)
- [ ] Risk sensitivity (cannot tolerate revenue leakage or compliance failures)
- [ ] Budget authority ($99-$10K/month)
- [ ] Decision timeframe (1-3 months)

**If 7+ criteria met:** Strong ICP fit, proceed with sales conversation  
**If 5-6 criteria met:** Good ICP fit, qualify further  
**If <5 criteria met:** Weak ICP fit, disqualify or free tier

---

**Document Status:** Complete  
**Next Review:** Quarterly  
**Owner:** Sales & GTM Strategy Team
