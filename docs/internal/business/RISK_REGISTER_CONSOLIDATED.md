# Settler.dev — Consolidated Risk Register

**Version:** 2.0  
**Last Updated:** January 2026  
**Purpose:** Comprehensive risk register with mitigation strategies and ownership

---

## Risk Assessment Framework

### Risk Rating

**Likelihood:**
- **High:** >50% probability
- **Medium:** 20-50% probability
- **Low:** <20% probability

**Impact:**
- **High:** Significant business impact (revenue loss, customer churn, reputation damage, legal liability)
- **Medium:** Moderate business impact (operational disruption, cost increase)
- **Low:** Minor business impact (inconvenience, minor cost)

**Risk Level:**
- **🔴 CRITICAL:** High likelihood + High impact, or immediate action required
- **🟡 HIGH:** Medium likelihood + High impact, or High likelihood + Medium impact
- **🟢 MEDIUM:** Medium likelihood + Medium impact, or Low likelihood + High impact
- **⚪ LOW:** Low likelihood + Low impact

---

## 🔴 CRITICAL RISKS (Immediate Action Required)

### Risk 1: Pricing Model Mismatch

**Description:** Code implementation prices Growth at $900/month and Scale at $9,900/month, while documentation advertises $99/month and $299/month respectively. This creates legal, operational, and reputational risks.

**Likelihood:** High (mismatch exists)  
**Impact:** High (legal disputes, customer churn, investor skepticism)  
**Risk Level:** 🔴 CRITICAL

**Current Status:** Active — Mismatch exists in production code

**Mitigation Strategy:**
1. **Immediate (Week 1):**
   - Align code pricing with documentation OR update documentation to match code
   - Decision: Choose one pricing model and implement consistently
   - Update all customer-facing materials

2. **Short-term (Week 2-4):**
   - Legal review of pricing terms
   - Customer communication plan (if changing prices)
   - Update sales materials

3. **Long-term (Month 2+):**
   - Implement pricing A/B testing
   - Monitor customer acquisition at chosen pricing
   - Iterate based on market feedback

**Owner:** Product/Engineering + Legal  
**Target Resolution:** 1 week  
**Status:** 🔴 ACTIVE — Requires immediate action

---

### Risk 2: Value Proposition Clarity Gaps

**Description:** Customers don't understand what they're buying:
- "Reconciliation" definition unclear
- Exception supervision model not explained
- Feature differentiation vs. volume gating confusion

**Likelihood:** High (documentation gaps exist)  
**Impact:** High (customer churn, support burden, billing disputes)  
**Risk Level:** 🔴 CRITICAL

**Current Status:** Active — Documentation gaps exist

**Mitigation Strategy:**
1. **Immediate (Week 1-2):**
   - Define "reconciliation" clearly (one transaction matched = one reconciliation)
   - Document exception supervision model
   - Create pricing calculator/explainer

2. **Short-term (Week 3-4):**
   - Update all customer-facing documentation
   - Create demo videos explaining pricing
   - Add FAQ section to pricing page

3. **Long-term (Month 2+):**
   - Monitor customer questions about pricing
   - Iterate documentation based on feedback
   - A/B test pricing page clarity

**Owner:** Product/Marketing  
**Target Resolution:** 2 weeks  
**Status:** 🔴 ACTIVE — Requires immediate action

---

## 🟡 HIGH RISKS (Action Required Within 30 Days)

### Risk 3: Support Capacity Unproven

**Description:** Support model documented but no evidence of support team capacity, tools, or processes. Risk of support overload when customers onboard.

**Likelihood:** Medium (capacity unproven)  
**Impact:** High (customer churn, reputation damage)  
**Risk Level:** 🟡 HIGH

**Current Status:** Active — Support capacity undefined

**Mitigation Strategy:**
1. **Immediate (Week 1-2):**
   - Define support team capacity (headcount, hours)
   - Implement support ticketing system (Zendesk/Intercom)
   - Create support capacity model (tickets per customer)

2. **Short-term (Week 3-4):**
   - Hire support team if needed
   - Train support team on product
   - Define escalation procedures

3. **Long-term (Month 2+):**
   - Monitor support metrics (response time, resolution time)
   - Scale support team based on customer growth
   - Implement support automation (chatbots, knowledge base)

**Owner:** Operations  
**Target Resolution:** 4 weeks  
**Status:** 🟡 ACTIVE — Requires action

---

### Risk 4: Operational Failure Response

**Description:** No documented runbooks for common failures (API outages, data breaches, billing failures). Risk of uncoordinated response damaging reputation.

**Likelihood:** Medium (failures will occur)  
**Impact:** High (service disruption, customer churn, reputation damage)  
**Risk Level:** 🟡 HIGH

**Current Status:** Active — Runbooks missing

**Mitigation Strategy:**
1. **Immediate (Week 1-2):**
   - Create incident response runbooks
   - Define customer communication templates
   - Create on-call rotation schedule

2. **Short-term (Week 3-4):**
   - Test incident response procedures
   - Train team on runbooks
   - Implement monitoring/alerting

3. **Long-term (Month 2+):**
   - Conduct chaos engineering tests
   - Iterate runbooks based on incidents
   - Build incident response automation

**Owner:** Engineering/Operations  
**Target Resolution:** 2 weeks  
**Status:** 🟡 ACTIVE — Requires action

---

### Risk 5: Data Loss Recovery Procedures

**Description:** Backup and recovery procedures not documented. Risk of data loss with no recovery plan.

**Likelihood:** Low (backups likely exist but undocumented)  
**Impact:** High (data loss, customer trust, legal liability)  
**Risk Level:** 🟡 HIGH

**Current Status:** Active — Procedures undocumented

**Mitigation Strategy:**
1. **Immediate (Week 1-2):**
   - Document backup procedures
   - Test backup restoration
   - Define RTO/RPO (Recovery Time Objective/Recovery Point Objective)

2. **Short-term (Week 3-4):**
   - Implement automated backup verification
   - Create disaster recovery plan
   - Test disaster recovery procedures

3. **Long-term (Month 2+):**
   - Regular backup testing
   - Multi-region backup replication (if needed)
   - Document data retention policies

**Owner:** Engineering  
**Target Resolution:** 2 weeks  
**Status:** 🟡 ACTIVE — Requires action

---

## 🟢 MEDIUM RISKS (Monitor and Mitigate)

### Risk 6: Support Expectation Mismatch

**Description:** Documentation promises "24-hour response" for Starter plan, but support model says "best-effort, no SLA". Risk of customer frustration.

**Likelihood:** Medium (expectation mismatch exists)  
**Impact:** Medium (customer churn, support burden)  
**Risk Level:** 🟢 MEDIUM

**Current Status:** Active — Expectation mismatch exists

**Mitigation Strategy:**
1. **Immediate (Week 1):**
   - Align documentation with reality
   - Update support model documentation
   - Set realistic SLAs based on capacity

2. **Short-term (Week 2-4):**
   - Communicate support expectations clearly
   - Implement support SLA tracking
   - Monitor customer satisfaction

**Owner:** Operations/Marketing  
**Target Resolution:** 2 weeks  
**Status:** 🟢 ACTIVE — Monitor

---

### Risk 7: API Dependency Failures

**Description:** Stripe, Shopify, or other API providers change APIs or block access, breaking Settler integrations.

**Likelihood:** Medium (API changes occur regularly)  
**Impact:** Medium (service disruption, customer impact)  
**Risk Level:** 🟢 MEDIUM

**Current Status:** Active — Dependency risk exists

**Mitigation Strategy:**
1. **Ongoing:**
   - Monitor API provider changelogs
   - Version adapter implementations
   - Test adapter updates before deployment

2. **Short-term:**
   - Build adapter abstraction layer
   - Implement adapter health monitoring
   - Create adapter update procedures

3. **Long-term:**
   - Build adapter marketplace
   - Enable customer self-service adapter updates
   - Diversify API provider dependencies

**Owner:** Engineering  
**Target Resolution:** Ongoing  
**Status:** 🟢 ACTIVE — Monitor

---

### Risk 8: Customer Data Ownership Disputes

**Description:** Unclear who owns reconciliation results, processed data, or derived insights. Risk of legal disputes.

**Likelihood:** Low  
**Impact:** Medium (legal disputes, customer churn)  
**Risk Level:** 🟢 MEDIUM

**Current Status:** Active — Ownership unclear

**Mitigation Strategy:**
1. **Immediate (Week 1-2):**
   - Define data ownership in Terms of Service
   - Legal review of data ownership terms
   - Update privacy policy

2. **Short-term (Week 3-4):**
   - Communicate data ownership to customers
   - Add data ownership section to DPA
   - Document data export procedures

**Owner:** Legal/Product  
**Target Resolution:** 2 weeks  
**Status:** 🟢 ACTIVE — Monitor

---

### Risk 9: Billing System Failures

**Description:** Stripe integration failures or billing reconciliation errors cause revenue loss or customer disputes.

**Likelihood:** Low (Stripe is reliable)  
**Impact:** Medium (revenue loss, customer disputes)  
**Risk Level:** 🟢 MEDIUM

**Current Status:** Mitigated — Billing system documented

**Mitigation Strategy:**
1. **Ongoing:**
   - Monitor Stripe webhook delivery
   - Reconcile billing daily
   - Alert on billing failures

2. **Short-term:**
   - Implement billing reconciliation automation
   - Create billing failure runbook
   - Test billing failure scenarios

**Owner:** Engineering/Finance  
**Target Resolution:** Ongoing  
**Status:** 🟢 MITIGATED — Monitor

---

## ⚪ LOW RISKS (Monitor)

### Risk 10: Market Competition

**Description:** Stripe, BlackLine, or new competitors launch competing products.

**Likelihood:** Medium (competition exists)  
**Impact:** Low (market risk, not operational)  
**Risk Level:** ⚪ LOW

**Current Status:** Active — Market risk

**Mitigation Strategy:**
1. **Ongoing:**
   - Monitor competitor products
   - Differentiate on value (not just price)
   - Build strong brand and community

**Owner:** Product/Marketing  
**Target Resolution:** Ongoing  
**Status:** ⚪ ACTIVE — Monitor

---

### Risk 11: SOC 2 Certification Delays

**Description:** SOC 2 Type II certification delayed, impacting enterprise sales.

**Likelihood:** Medium (certification takes time)  
**Impact:** Low (delays enterprise sales, but not critical)  
**Risk Level:** ⚪ LOW

**Current Status:** Active — Certification planned Q3 2026

**Mitigation Strategy:**
1. **Ongoing:**
   - Start SOC 2 preparation early
   - Implement all controls from day one
   - Work with experienced auditor

**Owner:** Compliance  
**Target Resolution:** Q3 2026  
**Status:** ⚪ ACTIVE — Monitor

---

## Risk Summary

### By Risk Level

- **🔴 CRITICAL:** 2 risks (immediate action required)
- **🟡 HIGH:** 3 risks (action required within 30 days)
- **🟢 MEDIUM:** 4 risks (monitor and mitigate)
- **⚪ LOW:** 2 risks (monitor)

### By Category

- **Legal:** 1 critical, 1 medium
- **Operational:** 2 high, 2 medium
- **Data:** 1 high, 1 medium
- **Market:** 1 low
- **Compliance:** 1 low

### Top 5 Risks (Priority Order)

1. **Pricing Model Mismatch** (🔴 CRITICAL)
2. **Value Proposition Clarity Gaps** (🔴 CRITICAL)
3. **Support Capacity Unproven** (🟡 HIGH)
4. **Operational Failure Response** (🟡 HIGH)
5. **Data Loss Recovery Procedures** (🟡 HIGH)

---

## Risk Monitoring

### Monthly Risk Review

**Process:**
1. Review all risks
2. Update risk assessments
3. Evaluate mitigation effectiveness
4. Identify new risks
5. Update mitigation plans

**Participants:**
- Leadership team
- Risk owners
- Relevant stakeholders

### Quarterly Risk Assessment

**Process:**
1. Comprehensive risk assessment
2. Risk prioritization
3. Mitigation plan updates
4. Risk reporting
5. Board presentation (if applicable)

**Participants:**
- Leadership team
- Board of directors (if applicable)
- Risk owners

---

## Risk Dashboard

**Metrics:**
- Total risks: 11
- Critical risks: 2
- High risks: 3
- Medium risks: 4
- Low risks: 2

**Status:**
- Active: 11
- Mitigated: 0
- Resolved: 0

**Next Review:** Weekly (critical risks), Monthly (all risks)

---

**Last Updated:** January 2026  
**Next Review:** Weekly for critical risks, monthly for all risks  
**Owner:** Business Operations Team
