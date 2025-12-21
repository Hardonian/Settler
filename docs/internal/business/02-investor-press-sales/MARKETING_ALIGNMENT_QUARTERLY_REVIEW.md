# Marketing & Trust Alignment Quarterly Review Process

**Version:** 1.0  
**Created:** January 2026  
**Status:** Active Process  
**Frequency:** Quarterly

---

## Overview

This document defines the quarterly review process for maintaining alignment between marketing copy, UI language, documentation, and trust signals. This ensures consistent messaging and addresses trust gaps proactively.

---

## Review Schedule

**Quarterly Reviews:**
- **Q1 Review:** End of March
- **Q2 Review:** End of June
- **Q3 Review:** End of September
- **Q4 Review:** End of December

**Ad-Hoc Reviews:**
- After major product launches
- After trust gap closures (SOC 2, customer references, etc.)
- After significant copy changes
- When trust gaps are identified

---

## Review Scope

### 1. Marketing Copy Review

**Files to Review:**
- `/marketing/` directory (all files)
- Press releases
- Blog posts
- Case studies
- Customer acquisition materials
- Partner directory applications

**Checklist:**
- [ ] No "eliminates" claims without qualification
- [ ] No "100%" claims without context
- [ ] No "guaranteed" claims for non-Enterprise tiers
- [ ] No "never" claims without qualification
- [ ] No "perfect" claims (use "great" or "excellent")
- [ ] All claims are demonstrable and measurable
- [ ] Trust gaps acknowledged where appropriate
- [ ] Limitations clearly stated

**Language Replacements:**
- "eliminates" → "reduces" or "significantly reduces"
- "100%" → "high" or "99%+" (with context)
- "guaranteed" → "target" or "SLA-backed (Enterprise)"
- "never" → "rarely" or "designed to minimize"
- "perfect" → "great" or "excellent"
- "always" → "typically" or "consistently"
- "completely" → "largely" or "significantly"

---

### 2. UI Language Review

**Files to Review:**
- `/packages/web/src/app/` (all pages)
- `/packages/web/src/components/` (all components)
- Landing pages
- Pricing pages
- Feature pages
- Support pages

**Checklist:**
- [ ] No over-promising in UI copy
- [ ] Confidence scores shown where appropriate
- [ ] Limitations clearly stated
- [ ] Support model clearly communicated
- [ ] Enterprise vs. non-Enterprise features clearly differentiated
- [ ] Trust signals accurate (SOC 2 status, customer references, etc.)

**Common Issues to Check:**
- Pricing page claims (SLA guarantees, uptime, etc.)
- Feature descriptions (accuracy, reliability, etc.)
- Trust badges (SOC 2 status, certifications, etc.)
- Testimonials (claims, metrics, etc.)

---

### 3. Documentation Review

**Files to Review:**
- `/docs/` directory (customer-facing docs)
- API documentation
- Getting started guides
- FAQ pages
- Security documentation

**Checklist:**
- [ ] All documentation aligns with canonical narrative
- [ ] Known limitations documented
- [ ] System guarantees clearly stated
- [ ] What Settler does NOT do clearly stated
- [ ] Trust gaps acknowledged
- [ ] Support model clearly communicated
- [ ] Enterprise vs. non-Enterprise features clearly differentiated

**Key Documents:**
- `/docs/SYSTEM_GUARANTEES.md` — System guarantees
- `/docs/KNOWN_LIMITATIONS.md` — Known limitations
- `/docs/TRUST_GAPS_RANKED.md` — Trust gaps
- `/docs/CANONICAL_PRODUCT_NARRATIVE.md` — Canonical narrative

---

### 4. Trust Gaps Review

**Review Against:**
- `/docs/TRUST_GAPS_RANKED.md` — Trust gaps ranked by impact

**Checklist:**
- [ ] P0 gaps (SOC 2, customer references) — progress tracked
- [ ] P1 gaps (uptime SLA, security audit) — progress tracked
- [ ] P2 gaps (platform coverage, benchmarks, support) — progress tracked
- [ ] P3 gaps (roadmap, examples, status page) — progress tracked
- [ ] New gaps identified and ranked
- [ ] Mitigation plans updated

**Action Items:**
- Review SOC 2 audit progress (see: `SOC2_AUDIT_ACTION_PLAN.md`)
- Review customer references progress (see: `CUSTOMER_REFERENCES_ACTION_PLAN.md`)
- Update trust gap status
- Update mitigation plans

---

## Review Process

### Step 1: Preparation (Week Before Review)

**Owner:** Marketing / Product  
**Timeline:** 1 week before review

**Tasks:**
- [ ] Gather all materials to review
- [ ] Run automated checks (grep for problematic language)
- [ ] Prepare review checklist
- [ ] Schedule review meeting

**Automated Checks:**
```bash
# Find problematic language
grep -r "eliminates\|100%\|guarantee\|perfect\|never\|always\|completely" \
  --include="*.md" --include="*.tsx" --include="*.ts" \
  marketing/ packages/web/src/ docs/
```

---

### Step 2: Review Meeting (2-3 hours)

**Participants:**
- Marketing lead
- Product lead
- Engineering lead (for UI)
- Customer success lead (for customer references)

**Agenda:**
1. **Marketing Copy Review** (30 min)
   - Review findings from automated checks
   - Discuss problematic language
   - Identify updates needed

2. **UI Language Review** (30 min)
   - Review UI components
   - Discuss claims and promises
   - Identify updates needed

3. **Documentation Review** (30 min)
   - Review documentation alignment
   - Discuss trust gaps
   - Identify updates needed

4. **Trust Gaps Review** (30 min)
   - Review P0/P1 gap progress
   - Discuss mitigation plans
   - Identify new gaps

5. **Action Items** (30 min)
   - Assign owners for updates
   - Set deadlines
   - Create follow-up tasks

---

### Step 3: Updates (2-3 weeks)

**Owner:** Assigned owners  
**Timeline:** 2-3 weeks after review

**Tasks:**
- [ ] Update marketing copy
- [ ] Update UI language
- [ ] Update documentation
- [ ] Update trust gap status
- [ ] Review and approve changes

---

### Step 4: Verification (1 week)

**Owner:** Marketing / Product  
**Timeline:** 1 week after updates

**Tasks:**
- [ ] Verify all updates completed
- [ ] Run automated checks again
- [ ] Review updated materials
- [ ] Approve changes

---

## Review Checklist Template

### Marketing Copy

- [ ] Press releases reviewed
- [ ] Blog posts reviewed
- [ ] Case studies reviewed
- [ ] Customer acquisition materials reviewed
- [ ] Partner directory applications reviewed
- [ ] No problematic language found
- [ ] All claims demonstrable
- [ ] Trust gaps acknowledged

### UI Language

- [ ] Landing pages reviewed
- [ ] Pricing pages reviewed
- [ ] Feature pages reviewed
- [ ] Support pages reviewed
- [ ] Components reviewed
- [ ] No over-promising found
- [ ] Limitations clearly stated
- [ ] Trust signals accurate

### Documentation

- [ ] Customer-facing docs reviewed
- [ ] API documentation reviewed
- [ ] Getting started guides reviewed
- [ ] FAQ pages reviewed
- [ ] Security documentation reviewed
- [ ] Aligned with canonical narrative
- [ ] Limitations documented
- [ ] Trust gaps acknowledged

### Trust Gaps

- [ ] P0 gaps progress reviewed
- [ ] P1 gaps progress reviewed
- [ ] P2 gaps progress reviewed
- [ ] P3 gaps progress reviewed
- [ ] New gaps identified
- [ ] Mitigation plans updated

---

## Success Metrics

### Alignment Metrics
- **Marketing Copy Alignment:** 100% (no problematic language)
- **UI Language Alignment:** 100% (no over-promising)
- **Documentation Alignment:** 100% (aligned with canonical narrative)
- **Trust Gap Progress:** Tracked quarterly

### Business Impact
- Reduced liability risk (accurate claims)
- Increased buyer confidence (trust signals)
- Reduced sales cycle time (clear messaging)
- Higher conversion rates (consistent messaging)

---

## Tools & Resources

### Automated Checks
```bash
# Find problematic language
grep -r "eliminates\|100%\|guarantee\|perfect\|never\|always\|completely" \
  --include="*.md" --include="*.tsx" --include="*.ts" \
  marketing/ packages/web/src/ docs/
```

### Key Documents
- `/docs/CANONICAL_PRODUCT_NARRATIVE.md` — Canonical narrative
- `/docs/TRUST_GAPS_RANKED.md` — Trust gaps
- `/docs/SYSTEM_GUARANTEES.md` — System guarantees
- `/docs/KNOWN_LIMITATIONS.md` — Known limitations
- `/docs/NARRATIVE_PASS_COMPLETE.md` — Narrative pass summary

### Action Plans
- `SOC2_AUDIT_ACTION_PLAN.md` — SOC 2 audit plan
- `CUSTOMER_REFERENCES_ACTION_PLAN.md` — Customer references plan

---

## Next Review

**Date:** [End of Current Quarter]  
**Owner:** [Marketing Lead]  
**Status:** Scheduled

---

**Document Status:** Active Process  
**Last Updated:** January 2026  
**Next Review:** End of Q1 2026
