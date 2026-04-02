# Decision Logging System

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This folder contains all codified decisions. **Decisions are append-only** — never delete historical decisions.

---

## Why Log Decisions?

1. **Preserve context** — Future decision-makers need to understand why
2. **Avoid rework** — Don't revisit settled questions without reason
3. **Track evolution** — See how thinking changed over time
4. **Accountability** — Document who decided and why

---

## Decision Categories

| Category             | Examples                                         |
| -------------------- | ------------------------------------------------ |
| **Pricing**          | New tiers, discount policies, Enterprise pricing |
| **Legal/Commercial** | Contract terms, ToS changes, SLAs                |
| **Product**          | Features to build, deprecations, priorities      |
| **Technical**        | Architecture choices, technology selections      |
| **Operations**       | Processes, tooling, team structure               |
| **Strategy**         | Market positioning, competitive moves            |

---

## Decision Template

```markdown
# Decision: [Clear Title]

**Date:** YYYY-MM-DD  
**Decider:** [Name/Role]  
**Category:** [pricing/legal/product/technical/ops/strategy]

## Decision

[One sentence stating the decision]

## Context

[What situation prompted this decision?]

## Rationale

[Why this choice over alternatives?]

## Alternatives Considered

1. [Alternative 1] — Why rejected
2. [Alternative 2] — Why rejected
3. [Alternative 3] — Why rejected

## Consequences

### Expected Positive

- [Outcome 1]
- [Outcome 2]

### Expected Negative / Risks

- [Risk 1]
- [Risk 2]

## Supporting Data

[Any data, analysis, or research that informed this]

## Review Date

[When to revisit this decision — typically 3-12 months]

## Status

- [x] Decided
- [ ] Needs Review
- [ ] Superseded by [link to new decision]

---

_Logged by: [Name]_  
_Source: [Meeting/email/conversation that prompted decision]_
```

---

## Decision Process

### Making a Decision

1. **Identify the decision** — What's being decided?
2. **Gather context** — Why does this need to be decided?
3. **List alternatives** — What are the options?
4. **Evaluate trade-offs** — Pros/cons of each
5. **Decide** — Make the call (or escalate)
6. **Document** — Log it here immediately
7. **Communicate** — Tell affected parties
8. **Review** — Revisit at designated date

### When to Log

| Situation                   | Log?     |
| --------------------------- | -------- |
| Major strategic choice      | ✅ Yes   |
| Pricing change              | ✅ Yes   |
| Contract term change        | ✅ Yes   |
| Feature decision            | ✅ Yes   |
| Tool selection              | ✅ Yes   |
| Process change              | ✅ Yes   |
| Minor execution choice      | Optional |
| Daily operational decisions | No       |

---

## Decision Review Process

### Review Schedule

| Decision Type    | Review After |
| ---------------- | ------------ |
| Pricing          | 3 months     |
| Legal/Commercial | 6 months     |
| Product          | 3 months     |
| Technical        | 6-12 months  |
| Operations       | 3 months     |
| Strategy         | 6-12 months  |

### Review Template

```markdown
# Decision Review: [Title]

**Original Date:** [Date]
**Review Date:** [Date]
**Reviewer:** [Name]

## Original Decision

[Copy from original]

## Current Status

- [ ] Still valid
- [ ] Needs modification
- [ ] Should be reversed

## Evidence Since Decision

[What has happened that validates or challenges this decision?]

## Recommendation

[Keep/Modify/Reverse] — [Why]

## New Review Date

[Next review date]
```

---

## Common Decisions to Log

### Pricing

- New pricing tier added
- Discount policy changed
- Enterprise pricing structure
- Overage terms modified

### Legal/Commercial

- Contract term changes
- ToS updates
- New agreement type
- SLA modifications

### Product

- Feature priority changes
- Deprecations
- New integrations
- Technology choices

### Operations

- New tool adoption
- Process changes
- Team structure
- Vendor selection

---

## Decision Archive

Historical decisions are stored in this folder with naming convention:

```
YYYY-MM-DD_CATEGORY_SHORT-TITLE.md
```

Example:

```
2026-04-01_pricing_enterprise-tier-structure.md
2026-03-15_product_deprecate-legacy-api.md
2026-02-28_ops_adopt-datadog-monitoring.md
```

---

## Using Past Decisions

### Before Making New Decision

1. Search this folder for related past decisions
2. Check if decision already exists
3. If similar decision exists, reference and consider:
   - Has context changed?
   - Was original decision wrong?
   - Should we revisit?

### When Escalating

1. Document your analysis
2. Present alternatives
3. Make recommendation
4. Let decider choose
5. Log the decision

---

## Related Documents

| Document                                 | Purpose                                  |
| ---------------------------------------- | ---------------------------------------- |
| `../operating-rhythm/WEEKLY_RITUALS.md`  | Weekly cadence includes decision logging |
| `../operating-rhythm/MONTHLY_RITUALS.md` | Monthly decision review                  |
