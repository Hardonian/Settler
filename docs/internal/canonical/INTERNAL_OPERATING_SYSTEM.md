# Settler.dev — Internal Operating System & Decision Governance

**Version:** 1.0  
**Date:** January 2026  
**Status:** FINALIZED — PHASE VI COMPLETE  
**Classification:** Internal — Canonical Reference

---

## Purpose

This document prevents future drift, over-customization, and low-ROI work. It defines core principles, tradeoffs, feature request rubrics, and decision governance.

**This document is non-negotiable.** All product decisions, feature requests, and engineering work must align with this operating system.

---

## Core Principles (Non-Negotiable)

### 1. Reconciliation is a System Behavior, Not a Human Task

**Principle:** Reconciliation happens automatically. Users supervise exceptions, not manage reconciliation.

**Implications:**
- Language must emphasize automatic behavior
- UI must not imply manual configuration burden
- Features must support exception supervision, not manual reconciliation
- Documentation must emphasize continuous matching, not scheduled jobs

**Enforcement:**
- All copy must align with this principle (see Language Canon)
- All UI must emphasize automatic behavior
- All features must support exception supervision

---

### 2. Clarity Over Speed

**Principle:** Settler optimizes for clarity, control, and correctness, not speed or hype.

**Implications:**
- Language must be precise and clear
- Features must be well-documented
- Errors must be clear and actionable
- Tradeoffs must be explicit

**Enforcement:**
- All copy must be clear and precise (see Language Canon)
- All features must be documented before release
- All errors must provide clear explanations and recovery guidance

---

### 3. Trust Through Boundaries, Not Promises

**Principle:** Trust is built by setting clear boundaries and being honest about limitations, not by making promises.

**Implications:**
- Set realistic expectations
- Be honest about limitations
- Document failure modes
- Provide clear recovery guidance

**Enforcement:**
- All marketing must set realistic expectations (see Product Narrative)
- All limitations must be documented (see Failure Modes)
- All errors must provide recovery guidance

---

### 4. Mobile is Not a Secondary Experience

**Principle:** Mobile users deserve the same quality experience as desktop users.

**Implications:**
- Mobile-first design
- Responsive layouts
- Touch-friendly interactions
- Mobile-optimized content

**Enforcement:**
- All UI must be mobile-responsive
- All content must be mobile-optimized
- All interactions must be touch-friendly

---

### 5. Language Precision is as Important as Code Correctness

**Principle:** Ambiguous language is technical debt. If something feels "implied," it is a liability.

**Implications:**
- Define all terms clearly
- Use consistent terminology
- Avoid jargon without explanation
- Provide context for technical terms

**Enforcement:**
- All copy must align with Language Canon
- All terms must be defined on first use
- All jargon must be explained

---

## Tradeoffs Accepted vs Refused

### Accepted Tradeoffs

#### 1. Speed vs Accuracy

**Accepted:** Accuracy over speed. Better to match correctly than quickly.

**Rationale:**
- Financial reconciliation requires accuracy
- False matches cause revenue leakage
- Users prefer accuracy over speed

**Examples:**
- Matching may take seconds (not milliseconds)
- Exception review may take minutes (not seconds)
- Reports may take minutes to generate (not seconds)

---

#### 2. Features vs Reliability

**Accepted:** Reliable core functionality over feature bloat.

**Rationale:**
- Core reconciliation must work reliably
- Feature bloat increases complexity
- Users prefer reliability over features

**Examples:**
- Focus on core reconciliation features
- Avoid adding features that don't improve reconciliation
- Prioritize reliability improvements over new features

---

#### 3. Convenience vs Correctness

**Accepted:** Correct matching over user convenience.

**Rationale:**
- Financial reconciliation requires correctness
- False matches cause revenue leakage
- Users prefer correctness over convenience

**Examples:**
- Flag exceptions rather than silently failing
- Require user review for ambiguous matches
- Provide clear explanations for exceptions

---

#### 4. Simplicity vs Flexibility

**Accepted:** Simple, clear workflows over complex, flexible configurations.

**Rationale:**
- Most users need simple workflows
- Complex configurations increase cognitive load
- Users prefer simplicity over flexibility

**Examples:**
- Default matching rules for common scenarios
- Simple rule configuration (not complex logic)
- Clear upgrade paths (not complex feature matrices)

---

### Refused Tradeoffs

#### 1. Security vs Convenience

**Refused:** Never compromise security for convenience.

**Rationale:**
- Financial data requires security
- Security breaches cause irreparable damage
- Users expect security

**Examples:**
- Never skip authentication for convenience
- Never expose sensitive data for debugging
- Never compromise encryption for performance

---

#### 2. Accuracy vs Speed

**Refused:** Never compromise accuracy for speed.

**Rationale:**
- Financial reconciliation requires accuracy
- False matches cause revenue leakage
- Users expect accuracy

**Examples:**
- Never skip validation for speed
- Never return approximate matches for speed
- Never compromise matching logic for performance

---

#### 3. Clarity vs Brevity

**Refused:** Never compromise clarity for brevity.

**Rationale:**
- Ambiguous language causes confusion
- Clear explanations prevent support burden
- Users prefer clarity over brevity

**Examples:**
- Never use jargon without explanation
- Never skip context for brevity
- Never compromise error messages for brevity

---

#### 4. Trust vs Sales

**Refused:** Never compromise trust for sales.

**Rationale:**
- Trust is essential for financial services
- Over-promising damages trust
- Users prefer honesty over sales pitches

**Examples:**
- Never over-promise features or performance
- Never hide limitations for sales
- Never compromise honesty for conversion

---

## Feature Request Acceptance Rubric

### Evaluation Criteria

#### 1. Alignment with Core Principles

**Question:** Does this feature align with core principles?

**Criteria:**
- ✅ Supports automatic reconciliation (not manual configuration)
- ✅ Improves clarity or correctness
- ✅ Builds trust through boundaries
- ✅ Works on mobile
- ✅ Uses precise language

**Acceptance Threshold:** Must align with all core principles.

---

#### 2. Problem-Solution Fit

**Question:** Does this feature solve a real problem for real users?

**Criteria:**
- ✅ Solves a documented user problem
- ✅ Addresses a common use case (not edge case)
- ✅ Provides clear value to users
- ✅ Has measurable success criteria

**Acceptance Threshold:** Must solve a real problem for real users.

---

#### 3. Complexity vs Value

**Question:** Is the complexity justified by the value?

**Criteria:**
- ✅ Value exceeds complexity
- ✅ Implementation cost is reasonable
- ✅ Maintenance burden is acceptable
- ✅ User benefit is clear

**Acceptance Threshold:** Value must exceed complexity by 2x.

---

#### 4. Maintenance Burden

**Question:** Can we maintain this feature long-term?

**Criteria:**
- ✅ Maintenance cost is acceptable
- ✅ Documentation requirements are clear
- ✅ Support burden is manageable
- ✅ Technical debt is minimal

**Acceptance Threshold:** Maintenance cost must be <20% of implementation cost per year.

---

#### 5. Mobile Compatibility

**Question:** Does this feature work on mobile?

**Criteria:**
- ✅ Mobile-responsive design
- ✅ Touch-friendly interactions
- ✅ Mobile-optimized content
- ✅ Performance acceptable on mobile

**Acceptance Threshold:** Must work on mobile (not desktop-only).

---

### Decision Process

1. **Initial Review:** Evaluate against rubric (all criteria must pass)
2. **Stakeholder Review:** Get input from product, engineering, support
3. **User Validation:** Validate with users (if possible)
4. **Final Decision:** Approve or reject based on rubric

**Approval Authority:**
- **Minor features:** Product Manager
- **Major features:** Product Manager + Engineering Lead
- **Strategic features:** Product Manager + Engineering Lead + CEO

---

## Enterprise Exception Policy

### When to Make Exceptions

**Exceptions are allowed for:**
- Enterprise customers with custom requirements
- Compliance requirements (SOC 2, GDPR, etc.)
- Security requirements (encryption, access control)
- Integration requirements (custom adapters, SSO)

**Exceptions are not allowed for:**
- Convenience features
- Edge cases
- Personal preferences
- Non-strategic requests

---

### Exception Process

1. **Request:** Enterprise customer requests exception
2. **Evaluation:** Evaluate against core principles and rubric
3. **Approval:** Approve if aligns with principles and strategic
4. **Implementation:** Implement with clear boundaries and documentation
5. **Review:** Review exception annually for continued need

**Approval Authority:**
- **Minor exceptions:** Product Manager
- **Major exceptions:** Product Manager + Engineering Lead
- **Strategic exceptions:** Product Manager + Engineering Lead + CEO

---

### Exception Boundaries

**Exceptions must:**
- Align with core principles
- Have clear boundaries
- Be well-documented
- Be maintainable
- Be reversible

**Exceptions must not:**
- Compromise core principles
- Create technical debt
- Increase maintenance burden
- Set precedents for non-enterprise customers

---

## Explicit "Never Build" List

### 1. Manual Reconciliation Features

**Never Build:**
- Manual reconciliation workflows
- Manual matching interfaces
- Manual exception handling (beyond supervision)
- Manual configuration wizards

**Rationale:**
- Reconciliation is automatic (core principle)
- Manual features contradict product positioning
- Manual features increase support burden

---

### 2. AI/ML Hype Features

**Never Build:**
- AI-powered reconciliation (without clear value)
- ML-based matching (without accuracy guarantees)
- Predictive analytics (without clear use case)
- Chatbots (without clear value)

**Rationale:**
- Hype features don't build trust
- AI/ML without clear value is marketing fluff
- Focus on core reconciliation functionality

---

### 3. Social/Community Features

**Never Build:**
- Social feeds
- Community forums (beyond support)
- User profiles
- Social sharing

**Rationale:**
- Not core to reconciliation
- Increases maintenance burden
- Distracts from core functionality

---

### 4. Gamification Features

**Never Build:**
- Points/badges
- Leaderboards
- Achievements
- Rewards

**Rationale:**
- Not appropriate for financial services
- Doesn't build trust
- Distracts from core functionality

---

### 5. Customizable UI Themes

**Never Build:**
- Customizable colors
- Customizable layouts
- Customizable branding (beyond Enterprise white-label)

**Rationale:**
- Increases maintenance burden
- Doesn't improve reconciliation
- Distracts from core functionality

---

## North-Star Metrics vs Vanity Metrics

### North-Star Metrics

**Definition:** Metrics that directly measure product success and user value.

**Metrics:**
1. **Time to First Reconciliation:** Time from signup to first successful reconciliation
2. **Matching Accuracy:** Percentage of transactions matched automatically
3. **Exception Resolution Time:** Average time to resolve exceptions
4. **Customer Retention:** Monthly/annual retention rate
5. **Net Revenue Retention:** Revenue retention including expansion

**Targets:**
- Time to First Reconciliation: <24 hours
- Matching Accuracy: >95%
- Exception Resolution Time: <1 hour
- Customer Retention: >90% monthly, >80% annual
- Net Revenue Retention: >100%

**Measurement:**
- Track weekly
- Review monthly
- Report quarterly

---

### Vanity Metrics

**Definition:** Metrics that don't directly measure product success or user value.

**Metrics to Avoid:**
1. **Signups:** Doesn't measure activation or value
2. **Page Views:** Doesn't measure engagement or value
3. **API Calls:** Doesn't measure reconciliation success
4. **Feature Adoption:** Doesn't measure value or retention
5. **Social Shares:** Doesn't measure product success

**Rationale:**
- Vanity metrics don't drive decisions
- Vanity metrics distract from real metrics
- Vanity metrics don't measure user value

**Exception:**
- Track vanity metrics for marketing purposes only
- Don't use vanity metrics for product decisions
- Don't optimize for vanity metrics

---

## Decision Governance

### Decision Authority

**Product Decisions:**
- **Minor:** Product Manager
- **Major:** Product Manager + Engineering Lead
- **Strategic:** Product Manager + Engineering Lead + CEO

**Engineering Decisions:**
- **Minor:** Engineering Lead
- **Major:** Engineering Lead + Product Manager
- **Strategic:** Engineering Lead + Product Manager + CEO

**Business Decisions:**
- **Minor:** CEO
- **Major:** CEO + Board
- **Strategic:** CEO + Board + Investors

---

### Decision Process

1. **Proposal:** Propose decision with rationale
2. **Evaluation:** Evaluate against core principles and rubric
3. **Stakeholder Review:** Get input from relevant stakeholders
4. **Decision:** Make decision based on evaluation
5. **Documentation:** Document decision and rationale
6. **Review:** Review decision quarterly for continued validity

---

### Decision Documentation

**All decisions must be documented:**
- **What:** What decision was made
- **Why:** Why decision was made
- **Who:** Who made decision
- **When:** When decision was made
- **Review:** When decision will be reviewed

**Documentation Format:**
- **Decision Log:** Central log of all decisions
- **Decision Templates:** Standard templates for decisions
- **Decision Reviews:** Quarterly reviews of decisions

---

## Completion Marker

**PHASE VI — COMPLETE**

This document serves as the canonical internal operating system and decision governance reference for Settler.dev. All product decisions, feature requests, and engineering work must align with this operating system.

**Next:** Executive Summary & Top 10 Highest-Leverage Next Actions

---

**Document Status:** FINALIZED  
**Last Updated:** January 2026  
**Maintained By:** Product Team  
**Review Cycle:** Quarterly
