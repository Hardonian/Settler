# Ideal Customer Profile (ICP)

**Last Updated:** January 2026

---

## Primary ICP: Mid-Market E-commerce & SaaS

### Firmographics

| Attribute | Criteria |
|-----------|----------|
| **Company Size** | 10-500 employees |
| **Annual Revenue** | $1M - $50M ARR |
| **Transaction Volume** | 1,000+ transactions/month |
| **Platform Count** | 3+ platforms (Stripe, Shopify, QuickBooks, etc.) |
| **Industry** | E-commerce, SaaS, Fintech, Marketplace |
| **Geography** | North America, Europe, Australia (English-speaking) |
| **Tech Stack** | Modern (API-first, cloud-native) |
| **Growth Stage** | Series A - Series C, or profitable SMB |

### Buyer Personas

#### 1. CTO / VP Engineering (Technical Buyer)

**Pain Points:**
- Custom reconciliation code is brittle and high-maintenance
- Engineering time wasted on non-core features
- Need for reliable, scalable infrastructure
- Compliance requirements (SOC 2, GDPR)

**Goals:**
- Eliminate custom reconciliation code
- Reduce maintenance burden
- Ensure reliability and uptime
- Fast integration (< 1 week)

**Decision Criteria:**
- API quality and documentation
- Developer experience
- Reliability (uptime, latency)
- Security and compliance
- Cost (engineering time saved vs. subscription cost)

**Budget Authority:** $5K - $50K/year

---

#### 2. CFO / Finance Director (Business Buyer)
**Pain Points:**
- Manual reconciliation takes 2-3 hours daily
- Revenue leakage from unmatched transactions
- Compliance risks (audit failures)
- Lack of audit trails

**Goals:**
- Automate reconciliation process
- Reduce manual work by 80%+
- Ensure compliance (SOC 2, financial audits)
- Generate audit trails automatically

**Decision Criteria:**
- ROI (time saved vs. cost)
- Compliance certifications (SOC 2, GDPR)
- Audit trail capabilities
- Accuracy and reliability
- Support and onboarding

**Budget Authority:** $10K - $100K/year

---

#### 3. Operations Manager / Finance Ops (End User)
**Pain Points:**
- Hours spent daily on manual reconciliation
- Frustration with repetitive, error-prone work
- Need for real-time visibility
- Difficulty tracking mismatches

**Goals:**
- Reduce reconciliation time from hours to minutes
- Get real-time alerts on mismatches
- Self-service configuration (no engineering tickets)
- Easy-to-understand reports

**Decision Criteria:**
- Ease of use
- Time savings
- Report quality
- Support responsiveness
- Training and documentation

**Budget Authority:** Influencer (not final decision maker)

---

## Secondary ICP: Enterprise

### Firmographics

| Attribute | Criteria |
|-----------|----------|
| **Company Size** | 500+ employees |
| **Annual Revenue** | $50M+ ARR |
| **Transaction Volume** | 100,000+ transactions/month |
| **Platform Count** | 10+ platforms |
| **Industry** | Enterprise SaaS, Financial Services, Healthcare |
| **Geography** | Global |
| **Compliance Needs** | SOC 2 Type II, PCI-DSS, HIPAA, GDPR |

### Buyer Personas

#### 1. Enterprise CTO / VP Engineering
**Pain Points:**
- Complex multi-platform reconciliation
- Custom adapters needed for legacy systems
- Strict compliance requirements
- Need for dedicated infrastructure

**Goals:**
- Custom adapters for legacy systems
- Dedicated infrastructure (VPC peering, private endpoints)
- SOC 2 Type II, PCI-DSS Level 1 certification
- Custom SLAs (99.99% uptime)

**Decision Criteria:**
- Custom adapter capabilities
- Compliance certifications
- Infrastructure options (VPC, private endpoints)
- Support SLA (dedicated account manager)
- Security and data residency

**Budget Authority:** $50K - $500K+/year

---

#### 2. Enterprise CFO / Finance Director
**Pain Points:**
- Multi-entity reconciliation
- Complex compliance requirements (SOC 2, PCI-DSS, HIPAA)
- Need for white-label reports
- Custom reporting requirements

**Goals:**
- Multi-entity support
- Compliance certifications (SOC 2, PCI-DSS, HIPAA)
- White-label reports for stakeholders
- Custom reporting and analytics

**Decision Criteria:**
- Compliance certifications
- Multi-entity capabilities
- Report customization options
- Audit trail capabilities
- Data residency options

**Budget Authority:** $100K - $1M+/year

---

## Top Use Cases

### 1. E-commerce Order-to-Payment Reconciliation
**Customer Profile:**
- Shopify store processing 1,000+ orders/month
- Stripe for payments, PayPal for refunds
- QuickBooks for accounting

**Pain Point:**
- Manual matching of Shopify orders with Stripe payments
- Tracking refunds and chargebacks
- Ensuring accounting accuracy

**Solution:**
- Automated reconciliation: Shopify orders ↔ Stripe payments
- Real-time alerts on mismatches
- Automatic sync to QuickBooks

**Value:**
- Saves 2-3 hours daily
- Prevents revenue leakage
- Ensures accounting accuracy

---

### 2. SaaS Subscription Revenue Recognition
**Customer Profile:**
- SaaS company with Stripe subscriptions
- QuickBooks for accounting
- Need for revenue recognition compliance

**Pain Point:**
- Manual reconciliation of Stripe subscriptions with QuickBooks revenue
- Handling upgrades, downgrades, cancellations
- Revenue recognition compliance

**Solution:**
- Automated reconciliation: Stripe subscriptions ↔ QuickBooks revenue
- Real-time sync of subscription changes
- Revenue recognition reports

**Value:**
- Saves 1-2 hours daily
- Ensures revenue recognition compliance
- Reduces accounting errors

---

### 3. Multi-Payment Provider Reconciliation
**Customer Profile:**
- E-commerce platform accepting payments from multiple providers
- Stripe, PayPal, Square, Apple Pay
- Need for unified reconciliation

**Pain Point:**
- Manual reconciliation across multiple payment providers
- Different data formats and timing
- Difficulty tracking refunds and chargebacks

**Solution:**
- Unified reconciliation across all payment providers
- Normalized data format
- Real-time alerts on mismatches

**Value:**
- Saves 3-4 hours daily
- Prevents revenue leakage
- Ensures payment accuracy

---

### 4. Accounting System Integration
**Customer Profile:**
- Mid-market company with multiple revenue sources
- Stripe, Shopify, custom invoicing
- QuickBooks or NetSuite for accounting

**Pain Point:**
- Manual sync of revenue data to accounting system
- Risk of errors and omissions
- Lack of audit trails

**Solution:**
- Automated sync: Stripe/Shopify → QuickBooks/NetSuite
- Real-time reconciliation
- Audit trails for compliance

**Value:**
- Saves 2-3 hours daily
- Ensures accounting accuracy
- Provides audit trails

---

### 5. Compliance Auditing
**Customer Profile:**
- Regulated industry (fintech, healthcare)
- Need for SOC 2, PCI-DSS, HIPAA compliance
- Audit trail requirements

**Pain Point:**
- Manual audit trail generation
- Risk of compliance failures
- Time-consuming audit preparation

**Solution:**
- Automated audit trails
- Compliance-ready reports
- SOC 2, PCI-DSS, HIPAA support

**Value:**
- Saves audit preparation time
- Ensures compliance
- Reduces compliance risk

---

## ICP Scoring Model

### Must-Have Criteria (Score: 10 points each)
- ✅ Processing 1,000+ transactions/month
- ✅ Using 3+ platforms (Stripe, Shopify, QuickBooks, etc.)
- ✅ Manual reconciliation taking 2+ hours daily
- ✅ Need for compliance (SOC 2, GDPR, financial audits)
- ✅ Modern tech stack (API-first, cloud-native)

### Nice-to-Have Criteria (Score: 5 points each)
- ✅ $1M+ ARR
- ✅ 10+ employees
- ✅ Series A+ funding or profitable
- ✅ Multi-currency operations
- ✅ Multi-entity operations

### Scoring Thresholds
- **High Fit (80+ points)**: Ideal customer, prioritize outreach
- **Medium Fit (60-79 points)**: Good fit, standard outreach
- **Low Fit (<60 points)**: Not ideal, deprioritize

---

## Customer Acquisition Channels

### High-Intent Channels
1. **Stripe Partner Directory**: Stripe users looking for reconciliation
2. **Shopify App Store**: Shopify merchants needing order reconciliation
3. **QuickBooks App Store**: QuickBooks users needing automated sync
4. **Developer Communities**: Hacker News, Indie Hackers, Reddit (r/SaaS, r/ecommerce)
5. **Content Marketing**: SEO-optimized blog posts ("How to reconcile Stripe and Shopify")

### Medium-Intent Channels
1. **Twitter/X**: Developer and founder communities
2. **LinkedIn**: Finance and operations professionals
3. **Product Hunt**: Product launches and showcases
4. **API Directories**: RapidAPI, Postman, API List
5. **Webinars**: Educational content on reconciliation best practices

### Low-Intent Channels
1. **Paid Ads**: Google Ads, Twitter Ads (lower conversion, higher volume)
2. **Cold Outreach**: Email outreach to ICP companies
3. **Partnerships**: Accounting firms, e-commerce agencies

---

## Customer Success Criteria

### Activation Metrics
- ✅ Created first reconciliation job within 24 hours
- ✅ Connected 2+ adapters within 48 hours
- ✅ Ran first successful reconciliation within 72 hours
- ✅ Viewed first reconciliation report within 7 days

### Engagement Metrics
- ✅ Running reconciliations at least weekly
- ✅ Using 3+ adapters
- ✅ Configuring custom matching rules
- ✅ Setting up webhooks or scheduled jobs

### Retention Metrics
- ✅ 95%+ reconciliation accuracy
- ✅ <5% monthly churn
- ✅ 80%+ monthly active users
- ✅ NPS >50

### Expansion Metrics
- ✅ Upgrading to higher tier within 6 months
- ✅ Adding more adapters/platforms
- ✅ Increasing transaction volume
- ✅ Referring other customers

---

## Anti-ICP (Who NOT to Target)

### Not a Good Fit
- ❌ Companies processing <100 transactions/month (too small)
- ❌ Single-platform operations (no reconciliation needed)
- ❌ Legacy systems without APIs (can't integrate)
- ❌ Companies with custom reconciliation already working well
- ❌ Companies unwilling to pay for SaaS tools

### Why Not?
- **Too Small**: Free tier sufficient, low conversion potential
- **No Need**: Single platform = no reconciliation needed
- **Can't Integrate**: Legacy systems without APIs = can't use Settler
- **Already Solved**: Custom solution working = low conversion potential
- **Price Sensitive**: Unwilling to pay = high churn risk

---

## Next Steps

1. **Validate ICP**: Interview 20+ companies matching ICP criteria
2. **Refine Personas**: Update buyer personas based on interviews
3. **Prioritize Channels**: Focus on high-intent channels first
4. **Build Case Studies**: Document success stories from ICP customers
5. **Iterate**: Continuously refine ICP based on customer feedback

---

**Contact:** founders@settler.io | [settler.io](https://settler.io)
