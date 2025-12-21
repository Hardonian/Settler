# Marketing Audit Checklist

**Version:** 1.0  
**Date:** January 2026  
**Status:** Active  
**Purpose:** Ensure all marketing claims are accurate and defensible

---

## Overview

This checklist ensures all marketing materials are **accurate**, **defensible**, and **aligned** with actual capabilities.

**Philosophy:** Honest marketing builds trust. False claims destroy it.

---

## Audit Scope

### Marketing Materials to Audit

- [ ] Website copy
- [ ] Pricing page
- [ ] Product pages
- [ ] Blog posts
- [ ] Social media posts
- [ ] Email campaigns
- [ ] Sales materials
- [ ] Case studies
- [ ] Testimonials
- [ ] Press releases

---

## Claim Verification Checklist

### Pricing Claims

- [ ] Pricing page matches actual pricing
- [ ] Pricing logic documentation matches pricing page
- [ ] No hidden fees mentioned
- [ ] Overage pricing clearly explained
- [ ] Exception pricing clearly explained

**Verification:**
- Compare pricing page with `PRICING_LOGIC.md`
- Compare pricing page with Stripe configuration
- Verify all pricing sources are aligned

---

### SLA Claims

- [ ] SLA claims match actual SLA policies
- [ ] No false SLA claims for non-SLA tiers
- [ ] SLA terms clearly defined
- [ ] SLA enforcement documented

**Verification:**
- Compare marketing claims with `SUPPORT_MODEL.md`
- Compare marketing claims with `SLA_POSITION.md`
- Verify SLA tracking is implemented

**Common Issues:**
- ❌ "24-hour support" without SLA enforcement
- ❌ "SLA-backed" for best-effort tiers
- ❌ "Guaranteed uptime" without SLA

---

### Feature Claims

- [ ] Feature claims match actual capabilities
- [ ] No features promised that don't exist
- [ ] Feature limitations clearly stated
- [ ] Feature availability by tier clearly stated

**Verification:**
- Compare marketing claims with actual features
- Verify feature gates match marketing claims
- Check feature documentation

**Common Issues:**
- ❌ "Unlimited" when limits exist
- ❌ "100% accuracy" when confidence scores exist
- ❌ "Zero downtime" when single-region

---

### Security Claims

- [ ] Security claims match actual security posture
- [ ] Compliance claims are accurate
- [ ] Security certifications are current
- [ ] Security limitations clearly stated

**Verification:**
- Compare marketing claims with `SECURITY_ARCHITECTURE.md`
- Compare marketing claims with `PROCUREMENT_FAQ.md`
- Verify SOC 2 status (if claimed)

**Common Issues:**
- ❌ "SOC 2 certified" when not certified
- ❌ "100% secure" when vulnerabilities exist
- ❌ "GDPR compliant" without verification

---

### Performance Claims

- [ ] Performance claims are accurate
- [ ] Performance limitations clearly stated
- [ ] Performance benchmarks are real
- [ ] Performance varies by tier

**Verification:**
- Compare marketing claims with actual performance
- Verify performance benchmarks
- Check performance documentation

**Common Issues:**
- ❌ "Instant" when latency exists
- ❌ "Real-time" when batch processing
- ❌ "Unlimited scale" when limits exist

---

## Language Standards

### Prohibited Language

**Never Use:**
- ❌ "Eliminates" → Use "Reduces"
- ❌ "100%" → Use "High" or "99%+"
- ❌ "Guaranteed" → Use "SLA-backed (Enterprise)" or remove
- ❌ "Perfect" → Use "Great"
- ❌ "Never" → Use "Designed to minimize"
- ❌ "Always" → Use "Typically" or "Usually"
- ❌ "Completely" → Use "Significantly"

**Verification:**
- Run automated check: `grep -r "eliminates\|100%\|guarantee\|perfect\|never\|always\|completely" marketing/`
- Review all marketing copy
- Update problematic language

---

## Trust Gap Claims

### Customer References

- [ ] Customer testimonials are real
- [ ] Customer logos are used with permission
- [ ] Case studies are accurate
- [ ] Customer quotes are verified

**Verification:**
- Verify customer permission for testimonials
- Verify customer permission for logos
- Verify case study accuracy
- Verify customer quotes

**Common Issues:**
- ❌ Fake testimonials
- ❌ Logos without permission
- ❌ Exaggerated case study results

---

### SOC 2 Claims

- [ ] SOC 2 status is accurate
- [ ] SOC 2 Type I vs. Type II clearly stated
- [ ] SOC 2 timeline is realistic
- [ ] SOC 2 limitations clearly stated

**Verification:**
- Compare marketing claims with actual SOC 2 status
- Verify SOC 2 timeline
- Check SOC 2 documentation

**Common Issues:**
- ❌ "SOC 2 certified" when not certified
- ❌ "SOC 2 Type II" when only Type I
- ❌ Unrealistic SOC 2 timeline

---

## Audit Process

### Monthly Audit

**Process:**
1. Review all new marketing materials
2. Verify claims against documentation
3. Update problematic language
4. Document findings

**Owner:** Marketing team
**Reviewer:** Legal/Operations team

---

### Quarterly Audit

**Process:**
1. Comprehensive review of all marketing materials
2. Verify all claims are accurate
3. Update language standards
4. Document findings

**Owner:** Marketing team
**Reviewer:** Legal/Operations team

---

### Pre-Launch Audit

**Process:**
1. Review all marketing materials for launch
2. Verify all claims are accurate
3. Get legal review
4. Get operations review
5. Document approval

**Owner:** Marketing team
**Reviewer:** Legal/Operations/Executive team

---

## Automated Checks

### Language Check

**Script:** `scripts/check-marketing-language.ts`

**Checks:**
- Prohibited language ("eliminates", "100%", "guarantee", etc.)
- Overly strong claims
- Unsupported claims

**Action:**
- Run in CI/CD pipeline
- Block merge if violations found
- Report violations

---

### Claim Verification

**Script:** `scripts/verify-marketing-claims.ts`

**Checks:**
- Pricing claims match documentation
- SLA claims match support model
- Feature claims match capabilities
- Security claims match security posture

**Action:**
- Run in CI/CD pipeline
- Block merge if violations found
- Report violations

---

## Remediation Process

### When Violations Found

1. **Immediate:**
   - Remove or correct false claims
   - Update marketing materials
   - Notify team

2. **Short-term:**
   - Review all marketing materials
   - Update language standards
   - Train team

3. **Long-term:**
   - Implement automated checks
   - Regular audits
   - Continuous improvement

---

## Related Documents

- `MARKETING_ALIGNMENT_COMPLETE.md` - Marketing alignment summary
- `MARKETING_ALIGNMENT_QUARTERLY_REVIEW.md` - Quarterly review process
- `SUPPORT_MODEL.md` - Support model (for SLA claims)
- `SYSTEM_GUARANTEES.md` - System guarantees (for feature claims)

---

**Document Status:** Active  
**Last Updated:** January 2026  
**Next Review:** Monthly (update based on findings)
