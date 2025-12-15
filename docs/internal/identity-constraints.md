# Settler Identity Constraints

**Version:** 1.0  
**Last Updated:** January 2026  
**Classification:** Internal - Foundational  
**Status:** Active Constraints

---

## Purpose

This document defines Settler's identity as constraints—what Settler exists to do, what it optimizes for, and what it must never become. These constraints protect Settler's identity under success and prevent feature creep that would degrade the product.

---

## Identity Definition (Constraint-Form)

### Settler Exists To:

1. **Eliminate manual reconciliation work**, not to become a general-purpose data platform
2. **Provide reliable, deterministic matching**, not to be a flexible configuration engine
3. **Serve small businesses and non-power users**, not to become enterprise-first
4. **Reduce cognitive load**, not to provide maximum configurability
5. **Enable user autonomy**, not to replace human judgment

### Settler Optimizes For:

1. **Clarity and simplicity**, even at the cost of advanced configurability
2. **Correctness and reliability**, even at the cost of speed optimizations
3. **User autonomy**, even at the cost of automation depth
4. **Immediate value**, even at the cost of long-term feature complexity
5. **Non-power users**, even at the cost of power-user features

---

## Hard "Never Become" Rules

### 1. Never Require Users to Understand Internal Architecture

**Constraint:** Users should never need to know about:
- Adapters, adapters architecture, adapter patterns
- Reconciliation engine internals
- Database schema or data models
- API versioning or technical implementation details

**Enforcement:**
- All user-facing copy must use outcome-focused language
- Technical documentation moved to internal docs
- Error messages must be user-friendly, not technical

**Example Violation:** "Adapter connection failed"  
**Correct:** "Could not connect to Stripe. Please check your API key."

---

### 2. Never Add Features That Increase Daily Effort

**Constraint:** Every feature must reduce, not increase, the time users spend on reconciliation.

**Enforcement:**
- Before adding any feature, ask: "Does this reduce daily effort?"
- If a feature requires daily maintenance, it's a violation
- Features that add complexity without reducing effort are forbidden

**Example Violation:** "Advanced matching rules that require daily tuning"  
**Correct:** "Smart defaults that work out of the box"

---

### 3. Never Add Automation Without a Kill-Switch

**Constraint:** All automation must be:
- Explicitly enabled by the user
- Disableable at any time
- Transparent about what it's doing

**Enforcement:**
- No silent automation
- All automated actions must be visible in activity log
- Users must be able to disable any automation immediately

**Example Violation:** "Automatic reconciliation runs without user consent"  
**Correct:** "Scheduled reconciliation (enabled by you) runs daily"

---

### 4. Never Trade Clarity for Configurability

**Constraint:** When choosing between clarity and configurability, always choose clarity.

**Enforcement:**
- Defaults must work for 80% of users
- Advanced configuration hidden behind "Advanced" toggle
- If a feature requires configuration to be useful, it's a violation

**Example Violation:** "50 configuration options exposed upfront"  
**Correct:** "Smart defaults with optional advanced settings"

---

### 5. Never Require Humans for Routine Correctness

**Constraint:** Routine operations (matching, reconciliation) must be correct without human intervention.

**Enforcement:**
- Matching algorithms must be deterministic
- Results must be reliable and consistent
- Human review should only be required for edge cases

**Example Violation:** "Users must manually verify every match"  
**Correct:** "High-confidence matches are automatic; low-confidence matches require review"

---

## Failure-by-Success Scenarios

### Scenario 1: Feature Creep via Edge Cases

**How it happens:** Users request features for edge cases. Each seems reasonable individually, but collectively they add complexity.

**Why it's harmful:** Product becomes harder to use, requires more configuration, increases cognitive load.

**Prevention:** 
- Reject features that serve <5% of users
- Prefer "good enough" defaults over perfect configurability
- Use constraint: "Does this reduce daily effort?"

---

### Scenario 2: Configurability Replacing Defaults

**How it happens:** Power users request more configuration options. Defaults become less useful.

**Why it's harmful:** Non-power users can't use the product effectively. Product becomes enterprise-first.

**Prevention:**
- Defaults must work for 80% of users
- Advanced configuration hidden behind "Advanced" toggle
- Use constraint: "Never trade clarity for configurability"

---

### Scenario 3: Dashboards Replacing Decisions

**How it happens:** Product adds more dashboards, analytics, and insights. Users stop making decisions.

**Why it's harmful:** Users become dependent on Settler for decisions they should make themselves.

**Prevention:**
- Dashboards inform, don't decide
- Always show "why" behind recommendations
- Use constraint: "Enable user autonomy, not replace human judgment"

---

### Scenario 4: Enterprise Exceptions Becoming Roadmap

**How it happens:** Enterprise customers request custom features. These become the roadmap.

**Why it's harmful:** Product becomes enterprise-first, abandoning small businesses.

**Prevention:**
- Enterprise features must not degrade experience for small businesses
- Use constraint: "Serve small businesses and non-power users"

---

### Scenario 5: AI Novelty Over Usefulness

**How it happens:** Product adds AI features for novelty, not because they solve real problems.

**Why it's harmful:** Adds complexity without value. Users confused about what Settler actually does.

**Prevention:**
- Every AI feature must solve a specific problem
- AI must improve correctness or reduce effort
- Use constraint: "Does this reduce daily effort?"

---

## Constraint Enforcement Mechanisms

### Architectural Rules

1. **User-facing copy must pass "cold user test"**
   - Can a non-technical user understand this?
   - Does it explain outcomes, not mechanics?

2. **Defaults must work for 80% of users**
   - Advanced configuration hidden behind "Advanced" toggle
   - Smart defaults, not perfect configurability

3. **All automation must be explicit**
   - No silent automation
   - Activity log shows all automated actions
   - Kill-switch for every automation

### Agent Rules (for AI assistants)

1. **Never suggest features that violate constraints**
2. **Always prefer simplicity over configurability**
3. **Always explain outcomes, not mechanics**

### PR Criteria

Before merging any PR, ask:

1. Does this reduce daily effort? (If no, reject)
2. Does this require users to understand internals? (If yes, reject)
3. Does this add automation without kill-switch? (If yes, reject)
4. Does this trade clarity for configurability? (If yes, reject)
5. Does this require humans for routine correctness? (If yes, reject)

### Automated Checks

1. **Copy audit:** Check user-facing copy for technical jargon
2. **Default check:** Verify defaults work without configuration
3. **Automation check:** Verify all automation has kill-switch
4. **Complexity check:** Measure cognitive load of new features

### Decision Rubrics

**For any feature request:**

1. **Does this reduce cognitive load?** (Must be yes)
2. **Does this remove a decision?** (Should be yes)
3. **Does this increase autonomy?** (Should be yes)
4. **Does this help the median user?** (Must be yes)

If any answer is "no", the feature violates constraints and should be rejected or modified.

---

## Internal vs External Complexity Line

### Allowed Internally (Hidden from Users)

- Adapter architecture and patterns
- Reconciliation engine internals
- Database schema and data models
- API versioning and technical details
- Performance optimizations
- Infrastructure complexity

### Must Remain Simple Externally (User-Facing)

- UI copy and messaging
- Error messages
- Documentation
- Onboarding flows
- Feature descriptions
- API responses (user-facing parts)

**Rule:** Complexity is allowed internally, but must never leak to users.

---

## Founder Protection Clause

### How Settler Could Re-Consume Founder Time

1. **Support escalations** - Users need help with complex configurations
2. **Feature requests** - Endless edge cases and customizations
3. **Bug fixes** - Complexity leads to more bugs
4. **Documentation** - Complex features require extensive docs
5. **Decision fatigue** - Too many choices to make

### Guardrails Protecting Founder Attention

1. **Self-service support** - Comprehensive docs, FAQs, troubleshooting
2. **Feature constraints** - Reject features that violate constraints
3. **Automated testing** - Prevent bugs before they reach users
4. **Self-improving product** - Product learns from usage patterns
5. **Clear defaults** - Fewer decisions needed

### Guardrails Protecting Decision Bandwidth

1. **Decision filter** - Use rubric for all feature decisions
2. **Constraint enforcement** - Automated checks prevent violations
3. **Identity clarity** - Clear constraints reduce decision fatigue

### Guardrails Protecting Emotional Load

1. **User autonomy** - Users responsible for their decisions
2. **Clear boundaries** - Explicit limits on what Settler does
3. **Fail-safes** - Product fails safely, doesn't cause harm

---

## Future Decision Filter

**For any future work, ask:**

1. **Does this reduce cognitive load?** (Must be yes)
2. **Does this remove a decision?** (Should be yes)
3. **Does this increase autonomy?** (Should be yes)
4. **Does this help the median user?** (Must be yes)
5. **Does this violate any "never become" rule?** (Must be no)

If any answer violates constraints, reject or modify the work.

---

## Review Process

This document should be reviewed:
- **Quarterly** - Ensure constraints still align with Settler's identity
- **Before major features** - Verify feature doesn't violate constraints
- **When receiving feedback** - Ensure feedback doesn't push Settler off-course

---

**Status:** Active - These constraints are binding and must be enforced.
