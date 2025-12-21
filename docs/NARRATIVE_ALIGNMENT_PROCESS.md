# Narrative Alignment Process — Quarterly Reviews

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** P2 Process — Continuous Alignment  
**Purpose:** Quarterly review process to ensure all materials align with canonical narrative

---

## Overview

This document defines the **quarterly narrative alignment process** to ensure all marketing copy, UI language, documentation, and sales materials remain aligned with the canonical product narrative.

**Frequency:** Quarterly (every 3 months)  
**Owner:** Product/Marketing Team  
**Participants:** Product, Marketing, Sales, Engineering

---

## Process Overview

### Quarterly Review Cycle

**Timeline:** Every 3 months (Q1, Q2, Q3, Q4)

**Activities:**
1. **Review Canonical Narrative:** Ensure narrative is still accurate
2. **Audit All Materials:** Check alignment across all materials
3. **Identify Misalignments:** Find language that doesn't align
4. **Update Materials:** Fix misalignments
5. **Document Changes:** Record what changed and why

---

## Review Checklist

### 1. Canonical Narrative Review

**Questions:**
- [ ] Is the canonical narrative still accurate?
- [ ] Have product changes affected the narrative?
- [ ] Are trust gaps still relevant?
- [ ] Are limitations still accurate?
- [ ] Are boundaries still correct?

**Actions:**
- Review `/docs/CANONICAL_PRODUCT_NARRATIVE.md`
- Update narrative if product changed
- Update trust gaps if status changed
- Update limitations if constraints changed

### 2. Marketing Materials Audit

**Materials to Review:**
- [ ] `/docs/ELEVATOR_PITCHES.md`
- [ ] `/docs/VALUE_PROPOSITIONS.md`
- [ ] `/docs/external/product-overview.md`
- [ ] `/marketing/` directory files
- [ ] Website copy (landing page, pricing page, etc.)

**Check for:**
- [ ] "Eliminates" → should be "reduces"
- [ ] "100%" → should be "high" or "complete" (without percentage)
- [ ] "Never" → should be "rarely" or "designed to minimize"
- [ ] "Guaranteed" → should be "target" or "SLA-backed (Enterprise)"
- [ ] Over-promising language
- [ ] Claims that can't be demonstrated

**Actions:**
- Update language to align with canonical narrative
- Remove over-promising claims
- Add constraints where needed
- Update trust gap status

### 3. Documentation Audit

**Materials to Review:**
- [ ] `/docs/FAQ.md`
- [ ] `/docs/USE_CASES.md`
- [ ] `/docs/ICP_DEFINITIONS.md`
- [ ] `/docs/CATEGORY_POSITIONING.md`
- [ ] All `/docs/` directory files

**Check for:**
- [ ] Language alignment with canonical narrative
- [ ] Trust gap status updates
- [ ] Limitation accuracy
- [ ] Boundary clarity

**Actions:**
- Update language to align with canonical narrative
- Update trust gap status
- Update limitations if changed
- Clarify boundaries if needed

### 4. UI Copy Audit

**Materials to Review:**
- [ ] Landing page (`/packages/web/src/app/page.tsx`)
- [ ] Pricing page (`/packages/web/src/app/pricing/page.tsx`)
- [ ] Console UI (`/packages/web/src/app/console/`)
- [ ] Error messages
- [ ] Tooltips and help text

**Check for:**
- [ ] Over-promising language
- [ ] Claims that can't be demonstrated
- [ ] Trust signal accuracy
- [ ] Constraint clarity

**Actions:**
- Update UI copy to align with canonical narrative
- Remove over-promising claims
- Add constraints where needed
- Update trust signals if status changed

### 5. Sales Materials Audit

**Materials to Review:**
- [ ] Sales decks
- [ ] Sales scripts
- [ ] Email templates
- [ ] Proposal templates

**Check for:**
- [ ] Language alignment with canonical narrative
- [ ] Over-promising claims
- [ ] Trust gap status
- [ ] Constraint communication

**Actions:**
- Update sales materials to align with canonical narrative
- Remove over-promising claims
- Update trust gap status
- Ensure constraints are communicated

---

## Alignment Criteria

### Language Standards

**Must Align With:**
- ✅ Canonical narrative (`/docs/CANONICAL_PRODUCT_NARRATIVE.md`)
- ✅ Trust gaps (`/docs/TRUST_GAPS_RANKED.md`)
- ✅ Known limitations (`/docs/KNOWN_LIMITATIONS.md`)
- ✅ System guarantees (`/docs/SYSTEM_GUARANTEES.md`)

**Must Avoid:**
- ❌ "Eliminates" (use "reduces")
- ❌ "100%" (use "high" or "complete" without percentage)
- ❌ "Never" (use "rarely" or "designed to minimize")
- ❌ "Guaranteed" for non-Enterprise (use "target" or "SLA-backed (Enterprise)")
- ❌ Over-promising claims
- ❌ Claims that can't be demonstrated

### Trust Signal Standards

**Must Be Accurate:**
- ✅ SOC 2 status (planned vs. certified)
- ✅ Customer references (available vs. not available)
- ✅ Uptime SLA (best-effort vs. SLA-backed)
- ✅ Support model (best-effort vs. SLA-backed)

**Must Be Updated:**
- ✅ Trust gap status (P0, P1, P2, P3)
- ✅ Trust gap mitigation progress
- ✅ Trust signal achievements

---

## Review Process

### Step 1: Preparation (Week 1)

**Activities:**
1. **Schedule Review Meeting:** Schedule quarterly review meeting
2. **Gather Materials:** Collect all materials to review
3. **Review Canonical Narrative:** Read canonical narrative
4. **Create Review Checklist:** Use checklist above

**Deliverables:**
- Review meeting scheduled
- Materials gathered
- Review checklist created

### Step 2: Review Meeting (Week 1)

**Activities:**
1. **Review Canonical Narrative:** Discuss if narrative is still accurate
2. **Audit Materials:** Go through checklist
3. **Identify Misalignments:** List all misalignments
4. **Prioritize Updates:** Prioritize updates by impact

**Deliverables:**
- Misalignment list
- Prioritized update list
- Action items assigned

### Step 3: Update Materials (Week 2-3)

**Activities:**
1. **Update Materials:** Fix misalignments
2. **Review Updates:** Review updates for accuracy
3. **Get Approval:** Get approval from stakeholders
4. **Publish Updates:** Publish updated materials

**Deliverables:**
- Updated materials
- Review notes
- Approval documentation

### Step 4: Documentation (Week 4)

**Activities:**
1. **Document Changes:** Record what changed and why
2. **Update Process:** Update process if needed
3. **Schedule Next Review:** Schedule next quarterly review
4. **Share Results:** Share results with team

**Deliverables:**
- Change log
- Process updates
- Next review scheduled

---

## Change Log Template

### Quarterly Review — [Quarter] [Year]

**Date:** [Date]  
**Reviewers:** [Names]  
**Status:** [Complete/In Progress]

**Changes Made:**
- [Change 1]: [Description]
- [Change 2]: [Description]
- [Change 3]: [Description]

**Trust Gap Updates:**
- [Gap 1]: [Status update]
- [Gap 2]: [Status update]

**Process Improvements:**
- [Improvement 1]: [Description]
- [Improvement 2]: [Description]

**Next Review:** [Date]

---

## Success Metrics

### Alignment Metrics

- **Alignment Score:** % of materials aligned with canonical narrative
- **Misalignment Count:** Number of misalignments found
- **Update Time:** Time to fix misalignments
- **Review Completion:** % of reviews completed on time

### Trust Signal Metrics

- **Trust Gap Progress:** % of P0/P1 gaps addressed
- **Trust Signal Updates:** Number of trust signals updated
- **Trust Signal Accuracy:** % of trust signals accurate

---

## Tools & Resources

### Review Tools

- **Checklist:** This document
- **Canonical Narrative:** `/docs/CANONICAL_PRODUCT_NARRATIVE.md`
- **Trust Gaps:** `/docs/TRUST_GAPS_RANKED.md`
- **Known Limitations:** `/docs/KNOWN_LIMITATIONS.md`

### Update Tools

- **Search & Replace:** Find problematic language
- **Review Process:** Get approval before publishing
- **Version Control:** Track changes in git

---

## Escalation

### Issues to Escalate

- **Major Narrative Changes:** If canonical narrative needs major changes
- **Trust Gap Blockers:** If P0 trust gaps can't be addressed
- **Material Conflicts:** If materials conflict with each other
- **Process Issues:** If process isn't working

### Escalation Process

1. **Identify Issue:** Document the issue
2. **Escalate to Owner:** Escalate to process owner
3. **Discuss Solution:** Discuss solution with stakeholders
4. **Implement Solution:** Implement solution
5. **Document Solution:** Document solution for future

---

## Timeline

### Quarterly Schedule

**Q1 Review:** January - March  
**Q2 Review:** April - June  
**Q3 Review:** July - September  
**Q4 Review:** October - December

### Review Dates

- **Q1 2026:** [Date TBD]
- **Q2 2026:** [Date TBD]
- **Q3 2026:** [Date TBD]
- **Q4 2026:** [Date TBD]

---

## Next Steps

1. **Immediate:**
   - Schedule first quarterly review (Q1 2026)
   - Assign process owner
   - Create review checklist

2. **Short-term:**
   - Conduct first quarterly review
   - Fix misalignments
   - Document changes

3. **Long-term:**
   - Maintain quarterly review process
   - Improve process based on feedback
   - Track alignment metrics

---

**Document Status:** P2 Process — Continuous Alignment  
**Last Updated:** January 2026  
**Next Review:** Q1 2026
