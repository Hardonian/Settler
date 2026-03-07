# Settler.dev — Canonical Product Narrative, Trust & Positioning

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Canonical — All marketing, UI, and docs must align with this  
**Purpose:** Single source of truth for what Settler is, what it does, and what it does not do

---

## Executive Summary

This document is the **canonical narrative** for Settler.dev. It defines:
- What Settler is (and is not)
- How to explain it at different levels of detail
- What trust signals are missing
- What language creates liability
- How to position without feature wars
- Explicit boundaries of what Settler does not do

**All marketing copy, UI language, documentation, and sales materials must align with this narrative.**

---

## Part 1: Canonical Product Story

### One-Sentence Value Proposition

**Settler automates financial reconciliation between payment processors, e-commerce platforms, and accounting systems—reducing manual reconciliation work from days to minutes through a single API.**

### 30-Second Explanation

**Finance teams spend 2-3 days every month manually matching transactions between Stripe, Shopify, QuickBooks, and other platforms. This is error-prone, doesn't scale, and creates compliance risk. Settler automates this matching via API—you connect your platforms once, and reconciliation runs automatically. Results: 95%+ time savings (days → minutes), 90%+ accuracy improvement, complete audit trail. It handles 10K-1M+ transactions/month without additional effort.**

### 2-Minute Explanation

**The Problem:**

Modern businesses operate across 10+ SaaS platforms: Stripe for payments, Shopify for orders, QuickBooks for accounting, NetSuite for ERP. Each platform has its own data format, timing quirks, and API structure. Finance teams spend 2-3 days every month manually reconciling transactions—exporting CSVs, using Excel VLOOKUPs, manually matching transactions, investigating discrepancies, and creating reconciliation reports. This process is:
- **Time-consuming:** 20-30 hours/month per finance team
- **Error-prone:** 5-10% mismatch rates are common
- **Non-scalable:** Volume growth multiplies the problem
- **Compliance risk:** Manual processes fail audits

**The Solution:**

Settler is reconciliation-as-a-service—a single API that normalizes, validates, and reconciles data across all platforms automatically. You:
1. Connect your platforms via API (one-time setup, ~15 minutes)
2. Create a reconciliation job (5 minutes)
3. Reconciliation runs automatically (scheduled or on-demand)
4. Get reports showing matched transactions, unmatched items, and complete audit trail

**The Results:**

- **Time savings:** 20-30 hours/month → <1 hour/month (95%+ reduction)
- **Accuracy:** 5-10% mismatch rate → <1% mismatch rate (90%+ improvement)
- **Cost savings:** $2K-$5K/month in labor costs
- **Scalability:** Handles 10K-1M+ transactions/month without additional effort
- **Compliance:** Complete audit trail for regulatory requirements

**Constraints:**

- Requires API access to your platforms (standard integrations)
- Works best for businesses processing 10K+ transactions/month
- Not a replacement for accounting software or payment processors

### 5-Minute Explanation

**What Settler Is:**

Settler is a specialized API platform for financial reconciliation. We solve one specific problem: matching transactions between different systems (payment processors, e-commerce platforms, accounting systems) automatically, accurately, and with complete audit trails.

**Core Capabilities:**

1. **Multi-Platform Reconciliation**
   - Connect 50+ platforms (Stripe, Shopify, QuickBooks, PayPal, Square, Xero, NetSuite, etc.)
   - Normalize data across different formats
   - Real-time or scheduled reconciliation

2. **Flexible Matching Rules**
   - Exact matching (order ID, amount)
   - Fuzzy matching (amount tolerance, date ranges)
   - Custom matching logic
   - Conflict resolution strategies

3. **Comprehensive Reporting**
   - JSON, CSV, PDF exports
   - White-label reports (Enterprise)
   - Audit trails
   - Exception reports

4. **Developer-Friendly API**
   - RESTful API with comprehensive documentation
   - TypeScript SDK (`@settler/sdk`)
   - Webhooks for real-time updates
   - Rate limiting and quotas

5. **Security & Compliance**
   - SOC 2 Type II planned (Q3 2026)
   - GDPR, CCPA, PIPEDA compliant
   - PCI-DSS ready
   - Data encryption at rest and in transit
   - Audit logs

**How It Works:**

1. **Setup (One-Time):**
   - Sign up for Settler account
   - Get API key from Developer Console
   - Connect your platforms (Stripe, Shopify, QuickBooks, etc.) via API credentials

2. **Configuration (5 Minutes):**
   - Create reconciliation job via API or Console
   - Define source and target systems
   - Configure matching rules (order ID, amount, date ranges)

3. **Execution (Automatic):**
   - Reconciliation runs automatically (scheduled or on-demand)
   - Settler fetches data from source and target systems
   - Normalizes data to common format
   - Applies matching rules
   - Generates reconciliation report

4. **Results (Immediate):**
   - View reconciliation results in Developer Console
   - Export reports (JSON, CSV, PDF)
   - Review unmatched transactions (exceptions)
   - Complete audit trail for compliance

**Use Cases:**

- **E-commerce Reconciliation:** Match Shopify orders with Stripe payments, PayPal refunds, and shipping costs
- **SaaS Revenue Recognition:** Reconcile Stripe subscriptions with QuickBooks revenue, handle upgrades/downgrades
- **Multi-Payment Provider:** Match transactions across Stripe, PayPal, Square, Apple Pay
- **Accounting Integration:** Sync Stripe/Shopify data with QuickBooks/NetSuite automatically
- **Compliance Auditing:** Generate audit trails for SOC 2, PCI-DSS, financial audits

**What Makes Settler Different:**

1. **Specialized:** We focus exclusively on reconciliation, not general automation or accounting
2. **Deterministic:** No floating-point errors in financial calculations
3. **Event-Sourced:** Complete audit trail and replay capability
4. **Developer-First:** API-first design with comprehensive SDKs
5. **Compliance-Ready:** Built-in audit trails and deterministic reporting

**Constraints & Limitations:**

- Requires API access to your platforms (standard integrations)
- Works best for businesses processing 10K+ transactions/month
- Not a replacement for accounting software or payment processors
- Single-region deployment (no automatic failover)
- Eventual consistency (not immediate)
- Best-effort support (not guaranteed SLA for non-Enterprise)

**Pricing:**

- **Starter:** $99/month — 100K reconciliations/month
- **Professional:** $499/month — 1M reconciliations/month
- **Enterprise:** Custom pricing — Unlimited usage, SLA guarantees

**Getting Started:**

1. Sign up at settler.io/signup
2. Get API key from Developer Console
3. Install SDK: `npm install @settler/sdk`
4. Create reconciliation job (see API Quick Start Guide)
5. Run reconciliation: `await settler.jobs.run(jobId)`

**Time to First Value:** <24 hours (target)

---

## Part 2: Mental Model Definition

### Before/After Problem Framing

**Before Settler:**

Finance teams manually reconcile transactions:
- Export CSVs from Stripe, Shopify, QuickBooks
- Use Excel VLOOKUPs to match transactions
- Manually investigate discrepancies
- Create reconciliation reports
- Repeat monthly (or more frequently)

**Problems:**
- Time-consuming (20-30 hours/month)
- Error-prone (5-10% mismatch rates)
- Non-scalable (volume growth multiplies the problem)
- Compliance risk (manual processes fail audits)
- Developer burden (custom reconciliation code breaks)

**After Settler:**

Finance teams automate reconciliation:
- Connect platforms via API (one-time setup)
- Reconciliation runs automatically
- View results in Developer Console
- Export reports (JSON, CSV, PDF)
- Complete audit trail for compliance

**Benefits:**
- Time savings (20-30 hours/month → <1 hour/month)
- Accuracy improvement (5-10% mismatch rate → <1% mismatch rate)
- Scalability (handles 10K-1M+ transactions/month)
- Compliance-ready (complete audit trail)
- Developer-friendly (API-first, no maintenance)

### What Changes When Settler Exists

**What Changes:**

1. **Reconciliation Process:**
   - Manual → Automated
   - Days → Minutes
   - Error-prone → High accuracy
   - Non-scalable → Scalable

2. **Finance Team Workflow:**
   - Manual matching → Exception supervision
   - CSV exports → API integration
   - Excel spreadsheets → Developer Console
   - Monthly reconciliation → Continuous reconciliation

3. **Developer Workflow:**
   - Custom reconciliation code → API integration
   - Maintenance burden → No maintenance
   - Bug-prone → Reliable
   - Infrastructure focus → Product focus

4. **Compliance Posture:**
   - Manual audit trails → Automated audit trails
   - Incomplete documentation → Complete documentation
   - Non-deterministic → Deterministic
   - Audit risk → Compliance-ready

### What Remains the User's Responsibility

**User Responsibilities:**

1. **Platform Access:**
   - User must have API access to their platforms (Stripe, Shopify, QuickBooks, etc.)
   - User must provide valid API credentials
   - User must maintain API credentials (rotate keys, update permissions)

2. **Data Quality:**
   - User is responsible for data quality in source systems
   - User must ensure data is accurate and up-to-date
   - User must handle data discrepancies in source systems

3. **Configuration:**
   - User must configure matching rules appropriately
   - User must review and adjust matching rules as needed
   - User must handle unmatched transactions (exceptions)

4. **Compliance:**
   - User is responsible for compliance with their industry regulations
   - User must review audit trails for accuracy
   - User must ensure data retention policies are met

5. **Integration:**
   - User must integrate Settler API into their systems
   - User must handle webhook delivery failures
   - User must implement retry logic for API calls

6. **Monitoring:**
   - User must monitor reconciliation results
   - User must investigate unmatched transactions
   - User must review exception reports

**Settler Responsibilities:**

1. **Reconciliation Execution:**
   - Fetch data from source and target systems
   - Normalize data to common format
   - Apply matching rules
   - Generate reconciliation reports

2. **Infrastructure:**
   - Maintain API availability (99.5% target, best-effort)
   - Handle API rate limiting
   - Provide Developer Console
   - Store reconciliation results

3. **Security:**
   - Encrypt data at rest and in transit
   - Implement multi-tenant isolation (RLS)
   - Provide audit logs
   - Maintain compliance certifications (SOC 2 planned)

4. **Support:**
   - Provide documentation
   - Respond to support requests (best-effort, not guaranteed)
   - Maintain API backward compatibility
   - Provide SDKs and integration guides

---

## Part 3: Trust & Credibility Audit

### Trust Signals Present

**What We Have:**

1. **Technical Credibility:**
   - ✅ Comprehensive API documentation
   - ✅ TypeScript SDK with type safety
   - ✅ Developer Console with real-time visibility
   - ✅ Open-source protocol package (`@settler/protocol`)
   - ✅ Production parity guarantees (schema introspection, contract verification)

2. **Security Posture:**
   - ✅ Encryption at rest (AES-256, best-effort)
   - ✅ Encryption in transit (TLS 1.3)
   - ✅ Multi-tenant isolation (RLS)
   - ✅ API key authentication
   - ✅ Audit logs

3. **Compliance Readiness:**
   - ✅ GDPR compliant
   - ✅ CCPA compliant
   - ✅ PIPEDA compliant
   - ⚠️ SOC 2 Type II planned (Q3 2026) — **NOT CERTIFIED YET**
   - ⚠️ PCI-DSS ready (not certified)

4. **Transparency:**
   - ✅ Known limitations documented
   - ✅ System guarantees documented
   - ✅ Pricing clearly stated
   - ✅ FAQ addresses common concerns

### Trust Gaps (Ranked by Impact)

**Critical Gaps (High Impact):**

1. **SOC 2 Certification Missing**
   - **Impact:** Enterprise customers require SOC 2 certification for procurement
   - **Current State:** "Planned Q3 2026" — not certified
   - **Risk:** Enterprise deals blocked, procurement delays
   - **Mitigation:** Be explicit about timeline, offer alternative trust signals (security audits, penetration tests)

2. **No Public Customer References**
   - **Impact:** Buyers want proof that others have succeeded
   - **Current State:** No public case studies or customer testimonials
   - **Risk:** Perceived as unproven, early-stage risk
   - **Mitigation:** Collect customer success stories (with permission), create case studies, offer pilot program

3. **Uptime SLA Only for Enterprise**
   - **Impact:** Non-Enterprise customers have no uptime guarantee
   - **Current State:** "Best-effort" for Starter/Professional, SLA only for Enterprise
   - **Risk:** Perceived as unreliable, production risk
   - **Mitigation:** Publish uptime metrics, offer SLA add-on for Professional tier

4. **No Public Security Audit**
   - **Impact:** Security-conscious buyers want third-party validation
   - **Current State:** No public security audit or penetration test results
   - **Risk:** Security concerns block adoption
   - **Mitigation:** Conduct security audit, publish results (redacted), offer security FAQ

**Moderate Gaps (Medium Impact):**

5. **Limited Platform Coverage**
   - **Impact:** Buyers may need platforms we don't support yet
   - **Current State:** 7 platform adapters (Stripe, Shopify, QuickBooks, PayPal, Square, Xero, NetSuite)
   - **Risk:** "Not for us" if platform missing
   - **Mitigation:** Clear roadmap, custom adapter option for Enterprise, transparent about limitations

6. **No Public Performance Benchmarks**
   - **Impact:** Buyers want to know if it scales to their volume
   - **Current State:** No public benchmarks or performance metrics
   - **Risk:** Uncertainty about scalability
   - **Mitigation:** Publish performance benchmarks, volume limits clearly stated, offer load testing

7. **Support Model Unclear**
   - **Impact:** Buyers want to know what support they'll get
   - **Current State:** "Best-effort" for Starter/Professional, unclear response times
   - **Risk:** Perceived as unsupported, production risk
   - **Mitigation:** Clear support SLAs, response time commitments, support channels documented

**Minor Gaps (Low Impact):**

8. **No Public Roadmap**
   - **Impact:** Buyers want to know what's coming
   - **Current State:** Roadmap mentioned in docs but not public
   - **Risk:** Uncertainty about future capabilities
   - **Mitigation:** Publish public roadmap, communicate updates regularly

9. **Limited Integration Examples**
   - **Impact:** Developers want code examples
   - **Current State:** Some examples in docs, but limited
   - **Risk:** Integration friction
   - **Mitigation:** Expand examples, create integration guides, offer code samples

10. **No Public Status Page**
   - **Impact:** Buyers want to know if service is up
   - **Current State:** No public status page
   - **Risk:** Perceived as unreliable
   - **Mitigation:** Publish status page, uptime metrics, incident history

### Why These Gaps Matter

**Enterprise Buyers:**
- Require SOC 2 certification for procurement
- Need customer references for risk assessment
- Want uptime SLAs for production systems
- Require security audits for compliance

**Mid-Market Buyers:**
- Want proof that others have succeeded
- Need confidence in scalability
- Require support SLAs for production use
- Want clear roadmap for future capabilities

**Developer Buyers:**
- Want code examples for integration
- Need performance benchmarks for scalability
- Require clear documentation
- Want status page for reliability

---

## Part 4: Over-Promise & Liability Review

### Language That Creates Liability

**Current Language Issues:**

1. **"Eliminates" Claims:**
   - ❌ "Eliminates currency conversion errors" — **TOO STRONG**
   - ❌ "Eliminates all errors" — **TOO STRONG**
   - ❌ "Eliminates compliance risk" — **TOO STRONG**
   - ✅ **Rewrite:** "Reduces currency conversion errors" or "Minimizes currency conversion errors"

2. **"100%" Claims:**
   - ❌ "100% audit trail completeness" — **TOO STRONG**
   - ❌ "100% deterministic matching" — **TOO STRONG**
   - ❌ "100% accuracy" — **TOO STRONG**
   - ✅ **Rewrite:** "Complete audit trail" or "Deterministic matching" (without "100%")

3. **"Never" Claims:**
   - ❌ "Never fails" — **TOO STRONG**
   - ❌ "Never loses data" — **TOO STRONG**
   - ❌ "Never requires manual intervention" — **TOO STRONG**
   - ✅ **Rewrite:** "Rarely fails" or "Designed to minimize failures"

4. **"Guaranteed" Claims (Non-Enterprise):**
   - ❌ "Guaranteed uptime" — **FALSE** (only Enterprise has SLA)
   - ❌ "Guaranteed accuracy" — **FALSE** (confidence scores indicate uncertainty)
   - ❌ "Guaranteed support" — **FALSE** (best-effort for non-Enterprise)
   - ✅ **Rewrite:** "Target uptime" or "Best-effort uptime" or "SLA-backed uptime (Enterprise only)"

5. **"Automatically" Without Qualification:**
   - ❌ "Automatically reconciles everything" — **TOO STRONG**
   - ❌ "Automatically handles all edge cases" — **TOO STRONG**
   - ✅ **Rewrite:** "Automatically reconciles transactions based on configured matching rules" or "Automatically handles common edge cases"

### Recommended Language Changes

**Before → After:**

1. **"Eliminates errors" → "Reduces errors"**
   - More accurate, less liability
   - Acknowledges that errors can still occur

2. **"100% accuracy" → "High accuracy" or "99%+ accuracy"**
   - More honest about uncertainty
   - Confidence scores indicate uncertainty

3. **"Never fails" → "Rarely fails" or "Designed for reliability"**
   - Acknowledges that failures can occur
   - Sets realistic expectations

4. **"Guaranteed uptime" → "Target uptime" or "SLA-backed uptime (Enterprise)"**
   - Accurate for non-Enterprise tiers
   - Clear about what's guaranteed vs. best-effort

5. **"Automatically handles everything" → "Automatically handles transactions based on configured rules"**
   - More accurate about what automation covers
   - Acknowledges configuration requirements

### Specific Copy Recommendations

**Marketing Copy:**

- ❌ "Eliminate currency conversion errors"
- ✅ "Reduce currency conversion errors with deterministic conversion"

- ❌ "100% audit trail completeness"
- ✅ "Complete audit trail for every transaction"

- ❌ "Never requires manual intervention"
- ✅ "Minimizes manual intervention with automated matching"

- ❌ "Guaranteed uptime"
- ✅ "Target 99.5% uptime (SLA-backed for Enterprise)"

**UI Language:**

- ❌ "Reconciliation complete — 100% accurate"
- ✅ "Reconciliation complete — 99.2% match rate"

- ❌ "All transactions matched automatically"
- ✅ "Transactions matched based on configured rules"

- ❌ "Guaranteed delivery"
- ✅ "Webhook delivery with retry logic"

**Documentation:**

- ❌ "Settler guarantees 100% accuracy"
- ✅ "Settler provides high-accuracy matching with confidence scores"

- ❌ "Settler never loses data"
- ✅ "Settler stores all reconciliation results with redundancy"

- ❌ "Settler automatically handles all edge cases"
- ✅ "Settler automatically handles common edge cases; exceptions require review"

---

## Part 5: Positioning Without Feature Wars

### The Category Settler Occupies

**Category:** Open Source Reconciliation Engine

**Definition:** A specialized API platform that automates financial data reconciliation between systems.

**Not:** General-purpose automation platform (Zapier, Make, n8n)  
**Not:** Accounting software (QuickBooks, Xero)  
**Not:** Payment processor (Stripe, PayPal)  
**Not:** Data warehouse (Snowflake, BigQuery)  
**Not:** Business intelligence platform (Tableau, Power BI)

**Why:** Settler focuses exclusively on reconciliation, not general automation or accounting.

### Why Comparison Tables Are the Wrong Lens

**The Problem with Feature Comparison:**

1. **Apples to Oranges:**
   - Comparing Settler to Zapier is like comparing a scalpel to a Swiss Army knife
   - Settler is specialized; competitors are general-purpose
   - Feature counts don't reflect value

2. **Different Optimization Goals:**
   - Settler optimizes for: Accuracy, compliance, audit trails, deterministic matching
   - Competitors optimize for: Breadth, ease of use, general automation
   - Different goals = different trade-offs

3. **Different Use Cases:**
   - Settler: Financial reconciliation (specialized)
   - Competitors: General automation (broad)
   - Different use cases = different value propositions

4. **Different Buyer Profiles:**
   - Settler: Finance teams, developers building financial apps
   - Competitors: Business users, general automation needs
   - Different buyers = different messaging

**The Right Lens:**

Instead of feature comparison, focus on:
- **Problem fit:** Does the buyer have reconciliation problems?
- **Outcome fit:** Does the buyer need accuracy, compliance, audit trails?
- **Integration fit:** Does the buyer have API access to their platforms?
- **Volume fit:** Does the buyer process 10K+ transactions/month?

### What Competitors Optimize For vs. What Settler Optimizes For

**Zapier/Make/n8n (General Automation):**
- **Optimize for:** Breadth, ease of use, general automation
- **Trade-offs:** Less specialized, lower accuracy, no compliance focus
- **Best for:** General workflow automation, non-financial use cases
- **Not best for:** Financial reconciliation, compliance requirements, high accuracy needs

**QuickBooks/Xero (Accounting Software):**
- **Optimize for:** Accounting features, general ledger, financial reporting
- **Trade-offs:** Limited reconciliation capabilities, manual processes, single-platform focus
- **Best for:** Accounting, bookkeeping, financial reporting
- **Not best for:** Multi-platform reconciliation, automated matching, compliance audit trails

**Stripe/PayPal (Payment Processors):**
- **Optimize for:** Payment processing, transaction handling, payment features
- **Trade-offs:** Single-platform focus, no reconciliation capabilities, no multi-platform matching
- **Best for:** Payment processing, transaction handling
- **Not best for:** Reconciliation, multi-platform matching, compliance audit trails

**Settler (Open Source Reconciliation Engine):**
- **Optimize for:** Accuracy, compliance, audit trails, deterministic matching
- **Trade-offs:** Specialized (not general-purpose), requires API access, focused use case
- **Best for:** Financial reconciliation, multi-platform matching, compliance requirements
- **Not best for:** General automation, accounting features, payment processing

### Positioning Strategy

**Don't Compete on Features:**

Instead of saying "We have more features than X," say:
- "We specialize in reconciliation, not general automation"
- "We optimize for accuracy and compliance, not breadth"
- "We're built for finance teams, not business users"

**Don't Compete on Price:**

Instead of saying "We're cheaper than X," say:
- "We're priced for the value we deliver (time savings, accuracy, compliance)"
- "We're cost-effective compared to manual processes"
- "We're priced competitively for specialized reconciliation"

**Do Compete on Outcomes:**

Say:
- "Save 20-30 hours/month vs. manual processes"
- "90%+ accuracy improvement vs. manual matching"
- "Complete audit trail for compliance requirements"
- "Scalable from 10K to 1M+ transactions/month"

**Do Compete on Fit:**

Say:
- "Built specifically for financial reconciliation"
- "Optimized for accuracy and compliance"
- "Designed for finance teams and developers"
- "API-first for integration flexibility"

---

## Part 6: What Settler Explicitly Does NOT Do

### Core Boundaries

**Settler Does NOT:**

1. **Replace Accounting Software:**
   - Settler does not provide general ledger, chart of accounts, or financial reporting
   - Settler does not replace QuickBooks, Xero, or NetSuite
   - Settler reconciles data between systems; it does not manage accounting

2. **Replace Payment Processors:**
   - Settler does not process payments or handle transactions
   - Settler does not replace Stripe, PayPal, or Square
   - Settler reconciles payment data; it does not process payments

3. **Provide General Automation:**
   - Settler does not automate general workflows or business processes
   - Settler does not replace Zapier, Make, or n8n
   - Settler focuses exclusively on financial reconciliation

4. **Store Financial Data Long-Term:**
   - Settler stores reconciliation results, not source financial data
   - Settler does not replace data warehouses or databases
   - Settler processes and matches data; it does not store source data indefinitely

5. **Provide Business Intelligence:**
   - Settler does not provide dashboards, analytics, or business intelligence
   - Settler does not replace Tableau, Power BI, or Looker
   - Settler provides reconciliation reports; it does not provide BI analytics

### Functional Boundaries

**Settler Does NOT:**

6. **Handle Real-Time Processing:**
   - Settler does not provide real-time reconciliation (eventual consistency)
   - Settler does not guarantee immediate data updates
   - Settler processes reconciliation jobs; it does not provide real-time matching

7. **Guarantee 100% Accuracy:**
   - Settler does not guarantee 100% matching accuracy
   - Settler provides confidence scores indicating uncertainty
   - Settler handles exceptions; it does not eliminate all errors

8. **Provide Unlimited Scale:**
   - Settler does not guarantee unlimited scale (rate limits, quotas apply)
   - Settler does not provide infinite throughput
   - Settler scales to 1M+ transactions/month; it does not guarantee unlimited scale

9. **Provide Guaranteed Uptime (Non-Enterprise):**
   - Settler does not guarantee uptime for Starter/Professional tiers
   - Settler provides best-effort uptime (target 99.5%)
   - Settler provides SLA-backed uptime only for Enterprise

10. **Handle All Edge Cases Automatically:**
    - Settler does not automatically handle all edge cases
    - Settler requires manual review for exceptions
    - Settler handles common cases; it does not eliminate all manual intervention

### Integration Boundaries

**Settler Does NOT:**

11. **Support All Platforms:**
    - Settler does not support all platforms (currently 7 adapters)
    - Settler does not provide custom adapters for all systems
    - Settler supports standard integrations; it does not support all platforms

12. **Provide On-Premise Deployment (Non-Enterprise):**
    - Settler does not provide on-premise deployment for Starter/Professional
    - Settler does not provide self-hosting for non-Enterprise
    - Settler provides SaaS only (self-hosting for Enterprise only)

13. **Provide Custom Integrations (Non-Enterprise):**
    - Settler does not provide custom integrations for Starter/Professional
    - Settler does not build custom adapters for non-Enterprise
    - Settler provides standard integrations (custom for Enterprise only)

### Compliance Boundaries

**Settler Does NOT:**

14. **Provide Industry-Specific Compliance:**
    - Settler does not provide HIPAA compliance (not certified)
    - Settler does not provide FedRAMP compliance (not certified)
    - Settler provides GDPR/CCPA compliance; it does not provide all industry certifications

15. **Guarantee SOC 2 Certification:**
    - Settler does not currently have SOC 2 certification (planned Q3 2026)
    - Settler does not guarantee certification timeline
    - Settler is working toward certification; it does not guarantee it

16. **Provide Legal or Financial Advice:**
    - Settler does not provide legal advice or financial advice
    - Settler does not interpret regulations or compliance requirements
    - Settler provides reconciliation tools; it does not provide legal/financial advice

### Support Boundaries

**Settler Does NOT:**

17. **Provide Guaranteed Support (Non-Enterprise):**
    - Settler does not guarantee support response times for Starter/Professional
    - Settler does not provide SLA-backed support for non-Enterprise
    - Settler provides best-effort support (SLA-backed for Enterprise only)

18. **Provide Training (Non-Enterprise):**
    - Settler does not provide training for Starter/Professional
    - Settler does not provide onboarding assistance for non-Enterprise
    - Settler provides documentation (training for Enterprise only)

19. **Provide Custom Development:**
    - Settler does not provide custom development for non-Enterprise
    - Settler does not build custom features for individual customers
    - Settler provides standard features (custom development for Enterprise only)

---

## Part 7: Alignment Checklist

### Marketing Copy Alignment

- [ ] All marketing copy aligns with canonical narrative
- [ ] No "eliminates" claims without qualification
- [ ] No "100%" claims without context
- [ ] No "guaranteed" claims for non-Enterprise tiers
- [ ] No "never" claims without qualification
- [ ] All claims are demonstrable and measurable

### UI Language Alignment

- [ ] All UI language aligns with canonical narrative
- [ ] No over-promising in UI copy
- [ ] Confidence scores shown where appropriate
- [ ] Limitations clearly stated
- [ ] Support model clearly communicated

### Documentation Alignment

- [ ] All documentation aligns with canonical narrative
- [ ] Known limitations documented
- [ ] System guarantees clearly stated
- [ ] What Settler does NOT do clearly stated
- [ ] Trust gaps acknowledged

### Sales Materials Alignment

- [ ] All sales materials align with canonical narrative
- [ ] No over-promising in sales pitches
- [ ] Constraints clearly communicated
- [ ] Trust gaps acknowledged
- [ ] Positioning focuses on outcomes, not features

---

## Conclusion

This document is the **canonical narrative** for Settler.dev. All marketing copy, UI language, documentation, and sales materials must align with this narrative.

**Key Principles:**

1. **Honesty:** Acknowledge limitations, trust gaps, and constraints
2. **Specificity:** Use numbers, not vague claims
3. **Outcome-Focus:** Focus on outcomes, not features
4. **Constraint-Aware:** Acknowledge what Settler does NOT do
5. **Trust-Building:** Address trust gaps explicitly

**When in doubt:**
- Be more conservative, not less
- Acknowledge limitations, don't hide them
- Focus on outcomes, not technology
- Be specific, not vague
- Build trust, don't over-promise

---

**Document Status:** Canonical — All materials must align  
**Last Updated:** January 2026  
**Next Review:** Quarterly or when major changes occur
