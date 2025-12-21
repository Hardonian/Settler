# Risk Register — Settler.dev

**Version:** 1.0  
**Date:** January 2026  
**Status:** Active  
**Purpose:** Comprehensive risk register with mitigation strategies

---

## Risk Classification

**Severity Levels:**
- 🔴 **Critical:** Business viability at risk, immediate action required
- 🟡 **High:** Significant impact, action required this month
- 🟢 **Medium:** Moderate impact, action required this quarter
- ⚪ **Low:** Minimal impact, monitor

**Likelihood:**
- **High:** >50% probability
- **Medium:** 20-50% probability
- **Low:** <20% probability

---

## Legal Risks

### R1: Pricing Misrepresentation
**Severity:** 🔴 Critical  
**Likelihood:** High (already exists)  
**Impact:** High (legal risk, customer complaints, refunds)

**Description:**
Pricing page shows different prices than pricing logic documentation. Users may sign up expecting one price but get charged another.

**Current State:**
- Pricing page: $0/$900/$9,900
- Pricing logic: $99/$499
- No single source of truth

**Mitigation:**
1. **Immediate (Week 1):**
   - Align pricing page with pricing logic
   - Choose one pricing model
   - Update all pricing sources (page, docs, Stripe)

2. **Process (Ongoing):**
   - Review pricing changes before publishing
   - Version control for pricing changes
   - Regular pricing audits

3. **Monitoring:**
   - Track customer complaints about pricing
   - Monitor refund requests
   - Review pricing alignment monthly

**Owner:** Product/Finance  
**Status:** 🔴 Unmitigated

---

### R2: SLA Claims Without Enforcement
**Severity:** 🟡 High  
**Likelihood:** Medium  
**Impact:** High (legal risk, customer complaints)

**Description:**
Marketing materials may claim SLAs but support model is best-effort for non-Enterprise tiers.

**Current State:**
- Professional tier: Best-effort support (no SLA)
- Marketing may imply SLA
- No SLA enforcement

**Mitigation:**
1. **Immediate (Week 1):**
   - Audit all marketing materials for SLA claims
   - Remove SLA claims if not SLA-backed
   - Or: Implement SLA enforcement for Professional tier

2. **Process (Ongoing):**
   - Review all marketing claims against actual capabilities
   - Legal review for marketing materials
   - Regular marketing audits

**Owner:** Marketing/Legal  
**Status:** 🟡 Partially Mitigated (documented but not enforced)

---

### R3: Data Retention Non-Compliance
**Severity:** 🟡 High  
**Likelihood:** High (already exists)  
**Impact:** Medium (compliance violations, cost risk)

**Description:**
Data retention policies are not automatically enforced. Data accumulates indefinitely, violating compliance requirements.

**Current State:**
- Retention policies: Not defined
- Automatic enforcement: Not implemented
- Data accumulates indefinitely

**Mitigation:**
1. **Immediate (Month 1):**
   - Define data retention policies per tier
   - Document retention requirements

2. **Short-term (Month 2-3):**
   - Implement automatic retention enforcement
   - Test retention process

3. **Monitoring:**
   - Regular compliance audits
   - Track storage costs per customer
   - Monitor retention policy compliance

**Owner:** Engineering/Operations  
**Status:** 🔴 Unmitigated

---

## Data Risks

### R4: Data Accumulation Cost
**Severity:** 🟢 Medium  
**Likelihood:** High (already exists)  
**Impact:** Medium (cost risk)

**Description:**
Data accumulates indefinitely, increasing storage costs without limit.

**Current State:**
- No automatic retention enforcement
- Storage costs increase over time
- No cost controls

**Mitigation:**
1. **Immediate (Month 1):**
   - Define data retention policies
   - Estimate storage costs per customer

2. **Short-term (Month 2-3):**
   - Implement automatic retention enforcement
   - Monitor storage costs

3. **Long-term:**
   - Optimize storage costs
   - Consider tiered storage (hot/cold)

**Owner:** Engineering/Finance  
**Status:** 🔴 Unmitigated

---

### R5: Cross-Tenant Data Leakage
**Severity:** 🔴 Critical  
**Likelihood:** Low (RLS enforced)  
**Impact:** Critical (data breach, reputational damage)

**Description:**
RLS policies may be misconfigured, allowing cross-tenant data access.

**Current State:**
- RLS policies enforced (verified in CI)
- Database-level isolation
- Service-role keys bypass RLS (documented risk)

**Mitigation:**
1. **Current:**
   - RLS policies enforced
   - Automated tests verify isolation
   - Service-role keys documented risk

2. **Ongoing:**
   - Regular RLS audits
   - Alert on RLS policy changes
   - Monitor for cross-tenant access attempts

3. **Monitoring:**
   - Track RLS policy changes
   - Monitor service-role key usage
   - Alert on suspicious access patterns

**Owner:** Engineering/Security  
**Status:** 🟢 Mitigated (RLS enforced, monitored)

---

## UX Misunderstanding Risks

### R6: Pricing Confusion
**Severity:** 🟢 Medium  
**Likelihood:** High (jargon-heavy)  
**Impact:** Medium (churn, support burden)

**Description:**
Customers don't understand pricing model (reconciliations, exceptions).

**Current State:**
- Pricing uses jargon ("reconciliations", "exceptions")
- No pricing calculator
- No usage estimator

**Mitigation:**
1. **Immediate (Week 1):**
   - Simplify pricing explanation
   - Add definitions upfront

2. **Short-term (Month 1):**
   - Add pricing calculator
   - Add usage estimator
   - Improve pricing FAQ

**Owner:** Marketing/Product  
**Status:** 🟡 Partially Mitigated (FAQ exists but not prominent)

---

### R7: Feature Expectation Mismatch
**Severity:** 🟢 Medium  
**Likelihood:** Medium  
**Impact:** Medium (churn, support burden)

**Description:**
Customers expect features not included in their tier.

**Current State:**
- RBAC gates hide features
- No explanation of why features are hidden
- No clear upgrade path

**Mitigation:**
1. **Immediate (Week 1):**
   - Show features with "locked" state
   - Explain how to unlock features
   - Add feature comparison table

2. **Short-term (Month 1):**
   - Improve upgrade prompts
   - Add feature tooltips
   - Create feature comparison page

**Owner:** Product/Marketing  
**Status:** 🟡 Partially Mitigated (RBAC gates exist but not explained)

---

## Operational Failure Risks

### R8: High-Usage Customer Margin Destruction
**Severity:** 🔴 Critical  
**Likelihood:** High (business model issue)  
**Impact:** Critical (business viability)

**Description:**
Customers using full limits destroy margins (unprofitable at full usage).

**Current State:**
- Pricing unprofitable at full usage
- No protection against abuse
- Business model relies on customers not using full limits

**Mitigation:**
1. **Immediate (Week 1):**
   - Fix pricing model (increase prices or reduce limits)
   - Ensure profitability at full usage

2. **Short-term (Month 1):**
   - Monitor customer usage vs. profitability
   - Implement upgrade prompts for high-usage customers
   - Track unit economics

3. **Long-term:**
   - Optimize costs
   - Consider usage-based pricing
   - Plan for scale

**Owner:** Finance/Product  
**Status:** 🔴 Unmitigated (critical business model issue)

---

### R9: Support Overload
**Severity:** 🟡 High  
**Likelihood:** Medium  
**Impact:** High (churn, reputational damage)

**Description:**
Best-effort support model may fail under load.

**Current State:**
- Best-effort support for Professional tier
- No SLA enforcement
- No clear escalation process

**Mitigation:**
1. **Immediate (Month 1):**
   - Add SLA to Professional tier
   - Or: Lower Professional price to reflect best-effort
   - Create support escalation process

2. **Short-term (Month 2-3):**
   - Implement SLA tracking
   - Monitor support response times
   - Plan for support scaling

3. **Long-term:**
   - Hire support staff
   - Implement support automation
   - Scale support team

**Owner:** Operations  
**Status:** 🟡 Partially Mitigated (documented but not enforced)

---

### R10: Single-Region Failure
**Severity:** 🔴 Critical  
**Likelihood:** Low (but catastrophic)  
**Impact:** Critical (complete service outage)

**Description:**
Single-region deployment means regional outages affect all customers.

**Current State:**
- Single-region deployment (us-east-1)
- No automatic failover
- Documented limitation

**Mitigation:**
1. **Current:**
   - Document limitation (`KNOWN_LIMITATIONS.md`)
   - Accept risk for now

2. **Short-term (Month 1-3):**
   - Improve monitoring
   - Faster incident response
   - Better error handling

3. **Long-term (6-12 months):**
   - Multi-region deployment (not guaranteed)
   - Automatic failover
   - Regional redundancy

**Owner:** Engineering/Operations  
**Status:** 🟢 Mitigated (documented, accepted risk)

---

## Reputational Risks

### R11: No Customer References
**Severity:** 🔴 Critical  
**Likelihood:** High (already exists)  
**Impact:** High (blocks enterprise deals)

**Description:**
No public case studies or testimonials (P0 trust gap).

**Current State:**
- No public case studies
- No customer testimonials
- No customer logos
- Perceived as unproven

**Mitigation:**
1. **Immediate (Month 1):**
   - Collect customer success stories
   - Create case study template
   - Publish 2-3 case studies

2. **Short-term (Month 2-3):**
   - Add customer logos to website
   - Collect customer testimonials
   - Create customer success page

3. **Long-term (Month 3-6):**
   - Maintain library of 5-10 case studies
   - Publish quarterly customer success stories
   - Create customer reference program

**Owner:** Customer Success/Marketing  
**Status:** 🔴 Unmitigated (P0 trust gap)

---

### R12: SOC 2 Missing
**Severity:** 🔴 Critical  
**Likelihood:** High (already exists)  
**Impact:** Critical (blocks enterprise deals)

**Description:**
SOC 2 certification missing (blocks enterprise deals).

**Current State:**
- SOC 2 Type II "planned Q3 2026"
- Not certified
- Blocks enterprise procurement

**Mitigation:**
1. **Immediate (Month 1):**
   - Begin SOC 2 Type I audit
   - Publish security audit results (redacted)
   - Offer security questionnaire

2. **Short-term (Month 3-6):**
   - Complete SOC 2 Type I audit
   - Publish SOC 2 readiness checklist
   - Provide security attestation letter

3. **Long-term (Month 6-12):**
   - Complete SOC 2 Type II certification
   - Publish SOC 2 report (redacted)
   - Maintain SOC 2 certification annually

**Owner:** Security/Operations  
**Status:** 🔴 Unmitigated (P0 trust gap)

---

## Risk Summary

### By Severity

**🔴 Critical (4 risks):**
- R1: Pricing Misrepresentation
- R5: Cross-Tenant Data Leakage (mitigated)
- R8: High-Usage Customer Margin Destruction
- R10: Single-Region Failure (mitigated)
- R11: No Customer References
- R12: SOC 2 Missing

**🟡 High (3 risks):**
- R2: SLA Claims Without Enforcement
- R3: Data Retention Non-Compliance
- R9: Support Overload

**🟢 Medium (3 risks):**
- R4: Data Accumulation Cost
- R6: Pricing Confusion
- R7: Feature Expectation Mismatch

### By Status

**🔴 Unmitigated (7 risks):**
- R1, R3, R4, R8, R9, R11, R12

**🟡 Partially Mitigated (3 risks):**
- R2, R6, R7

**🟢 Mitigated (2 risks):**
- R5, R10

---

## Risk Mitigation Priority

### P0: Critical (Address Immediately)

1. **R8: High-Usage Customer Margin Destruction**
   - **Action:** Fix pricing model
   - **Timeline:** Week 1
   - **ROI:** Critical (business viability)

2. **R1: Pricing Misrepresentation**
   - **Action:** Align pricing page with logic
   - **Timeline:** Week 1
   - **ROI:** High (legal risk reduction)

3. **R11: No Customer References**
   - **Action:** Collect customer success stories
   - **Timeline:** Month 1
   - **ROI:** High (unlocks enterprise deals)

4. **R12: SOC 2 Missing**
   - **Action:** Begin SOC 2 Type I audit
   - **Timeline:** Month 1-6
   - **ROI:** High (unlocks enterprise deals)

### P1: High Priority (Address This Month)

5. **R3: Data Retention Non-Compliance**
   - **Action:** Define and enforce retention policies
   - **Timeline:** Month 1-3
   - **ROI:** Medium (compliance, cost control)

6. **R9: Support Overload**
   - **Action:** Add SLA to Professional tier
   - **Timeline:** Month 1
   - **ROI:** Medium (reduces churn)

7. **R2: SLA Claims Without Enforcement**
   - **Action:** Audit marketing, remove false claims
   - **Timeline:** Week 1
   - **ROI:** Medium (legal risk reduction)

### P2: Medium Priority (Address This Quarter)

8. **R4: Data Accumulation Cost**
   - **Action:** Implement retention enforcement
   - **Timeline:** Month 2-3
   - **ROI:** Medium (cost savings)

9. **R6: Pricing Confusion**
   - **Action:** Simplify pricing, add calculator
   - **Timeline:** Month 1
   - **ROI:** Low (reduces support burden)

10. **R7: Feature Expectation Mismatch**
    - **Action:** Show locked features, explain upgrade path
    - **Timeline:** Month 1
    - **ROI:** Low (reduces support burden)

---

**Document Status:** Active  
**Last Updated:** January 2026  
**Next Review:** Monthly (track mitigation progress)
