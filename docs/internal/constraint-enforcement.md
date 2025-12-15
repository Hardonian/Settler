# Constraint Enforcement Mechanisms

**Version:** 1.0  
**Last Updated:** January 2026  
**Classification:** Internal - Operational  
**Status:** Active

---

## Purpose

This document translates Settler's identity constraints into actionable enforcement mechanisms: architectural rules, agent rules, PR criteria, automated checks, and decision rubrics.

---

## Architectural Rules

### Rule 1: User-Facing Copy Must Pass "Cold User Test"

**Requirement:** All user-facing copy must be understandable by a non-technical user who:
- Arrives via organic search
- Has no technical background
- Is cautious and time-constrained

**Enforcement:**
- Copy review checklist:
  - [ ] Can a non-technical user understand this?
  - [ ] Does it explain outcomes, not mechanics?
  - [ ] Does it avoid technical jargon?
  - [ ] Does it answer "what" and "why", not "how"?

**Violation Examples:**
- ❌ "Adapter connection failed"
- ❌ "Reconciliation engine error"
- ❌ "Matching algorithm timeout"

**Correct Examples:**
- ✅ "Could not connect to Stripe. Please check your API key."
- ✅ "Reconciliation couldn't complete. Please try again."
- ✅ "Matching took too long. Try reducing the date range."

---

### Rule 2: Defaults Must Work for 80% of Users

**Requirement:** 
- Defaults must work without any configuration
- Advanced configuration hidden behind "Advanced" toggle
- Smart defaults, not perfect configurability

**Enforcement:**
- Before adding configuration:
  - [ ] Can we make this work with smart defaults?
  - [ ] Is this configuration needed by >20% of users?
  - [ ] Can we hide this behind "Advanced" toggle?

**Violation Examples:**
- ❌ Exposing 50 configuration options upfront
- ❌ Requiring configuration for basic use
- ❌ No defaults, everything must be configured

**Correct Examples:**
- ✅ Smart defaults that work out of the box
- ✅ Advanced configuration behind "Advanced" toggle
- ✅ Optional configuration for power users

---

### Rule 3: All Automation Must Be Explicit

**Requirement:**
- No silent automation
- Activity log shows all automated actions
- Kill-switch for every automation

**Enforcement:**
- Before adding automation:
  - [ ] Is this automation explicitly enabled by user?
  - [ ] Can user disable this automation?
  - [ ] Are automated actions visible in activity log?

**Violation Examples:**
- ❌ Silent automatic reconciliation
- ❌ Background processing without notification
- ❌ Automation without disable option

**Correct Examples:**
- ✅ Scheduled reconciliation (enabled by user)
- ✅ Background processing with progress indicator
- ✅ Toggle to enable/disable automation

---

## Agent Rules (for AI Assistants)

### Rule 1: Never Suggest Features That Violate Constraints

**Requirement:** AI assistants must check constraints before suggesting features.

**Checklist:**
- [ ] Does this reduce daily effort?
- [ ] Does this require users to understand internals?
- [ ] Does this add automation without kill-switch?
- [ ] Does this trade clarity for configurability?
- [ ] Does this require humans for routine correctness?

**If any answer is "no", reject the suggestion.**

---

### Rule 2: Always Prefer Simplicity Over Configurability

**Requirement:** When choosing between simple defaults and configurability, choose simplicity.

**Examples:**
- ❌ "Add 10 configuration options for matching rules"
- ✅ "Use smart defaults that work for most cases"

---

### Rule 3: Always Explain Outcomes, Not Mechanics

**Requirement:** User-facing explanations must focus on outcomes, not how things work internally.

**Examples:**
- ❌ "The adapter pattern allows for flexible integration"
- ✅ "Connect to Stripe, Shopify, and 50+ platforms"

---

## PR Criteria

### Pre-Merge Checklist

Before merging any PR, verify:

1. **Does this reduce daily effort?**
   - [ ] Yes - Feature reduces time spent on reconciliation
   - [ ] No - Reject or modify

2. **Does this require users to understand internals?**
   - [ ] No - Users don't need to know how it works
   - [ ] Yes - Reject or modify

3. **Does this add automation without kill-switch?**
   - [ ] No - Automation has disable option
   - [ ] Yes - Reject or modify

4. **Does this trade clarity for configurability?**
   - [ ] No - Clarity maintained, configurability optional
   - [ ] Yes - Reject or modify

5. **Does this require humans for routine correctness?**
   - [ ] No - Routine operations are automatic
   - [ ] Yes - Reject or modify

**If any check fails, the PR must be rejected or modified.**

---

## Automated Checks

### Check 1: Copy Audit

**Purpose:** Ensure user-facing copy doesn't contain technical jargon.

**Implementation:**
- Scan user-facing copy for technical terms
- Flag terms: "adapter", "reconciliation engine", "matching algorithm", etc.
- Suggest user-friendly alternatives

**Location:** Pre-commit hook or CI check

---

### Check 2: Default Check

**Purpose:** Verify defaults work without configuration.

**Implementation:**
- Test new features with default settings
- Verify features work for basic use case
- Flag if configuration required for basic use

**Location:** Integration tests

---

### Check 3: Automation Check

**Purpose:** Verify all automation has kill-switch.

**Implementation:**
- Scan code for automation features
- Verify each has disable option
- Flag automation without kill-switch

**Location:** Code review checklist

---

### Check 4: Complexity Check

**Purpose:** Measure cognitive load of new features.

**Implementation:**
- Count configuration options
- Measure UI complexity
- Flag if complexity exceeds threshold

**Location:** Design review

---

## Decision Rubrics

### For Any Feature Request

**Ask these questions:**

1. **Does this reduce cognitive load?**
   - Must be yes
   - If no, reject or modify

2. **Does this remove a decision?**
   - Should be yes
   - If no, consider if decision is necessary

3. **Does this increase autonomy?**
   - Should be yes
   - If no, ensure it doesn't reduce autonomy

4. **Does this help the median user?**
   - Must be yes
   - If no, reject or modify

5. **Does this violate any "never become" rule?**
   - Must be no
   - If yes, reject

**If any answer violates constraints, reject or modify the feature.**

---

## Examples

### Example 1: Feature Request - "Advanced Matching Rules"

**Request:** Add 20 configuration options for matching rules.

**Decision Process:**
1. Does this reduce cognitive load? **No** - Adds complexity
2. Does this remove a decision? **No** - Adds decisions
3. Does this increase autonomy? **Maybe** - But reduces clarity
4. Does this help the median user? **No** - Only helps power users
5. Does this violate "never become" rules? **Yes** - Violates "never trade clarity for configurability"

**Decision:** **REJECT** - Violates multiple constraints

**Alternative:** Add smart defaults with optional advanced settings (hidden behind "Advanced" toggle)

---

### Example 2: Feature Request - "Automatic Reconciliation"

**Request:** Automatically run reconciliation daily without user consent.

**Decision Process:**
1. Does this reduce cognitive load? **Yes** - Removes manual trigger
2. Does this remove a decision? **Yes** - Removes "when to run" decision
3. Does this increase autonomy? **No** - Removes user control
4. Does this help the median user? **Yes** - Saves time
5. Does this violate "never become" rules? **Yes** - Violates "never add automation without kill-switch"

**Decision:** **REJECT** - Violates automation constraint

**Alternative:** Scheduled reconciliation with explicit user enablement and disable option

---

### Example 3: Feature Request - "User-Friendly Error Messages"

**Request:** Replace technical error messages with user-friendly ones.

**Decision Process:**
1. Does this reduce cognitive load? **Yes** - Easier to understand
2. Does this remove a decision? **Yes** - Clearer what to do
3. Does this increase autonomy? **Yes** - Users can fix issues themselves
4. Does this help the median user? **Yes** - All users benefit
5. Does this violate "never become" rules? **No** - Aligns with constraints

**Decision:** **APPROVE** - Aligns with all constraints

---

## Review Process

This document should be reviewed:
- **Quarterly** - Ensure enforcement mechanisms are effective
- **When constraints change** - Update enforcement mechanisms
- **When violations occur** - Strengthen enforcement

---

**Status:** Active - These enforcement mechanisms are binding and must be used.
