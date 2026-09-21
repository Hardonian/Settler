# Acquisition Readiness

**As of:** 2026-09-21  
**Verdict:** Not an acquisition target today. Repository capability is credible; commercial and
strategic evidence is not yet sufficient.

## Canonical thesis

Settler is the neutral settlement-truth and exception-resolution layer for platforms and finance
teams operating across multiple processors, commerce systems, banks, and ledgers.

The acquisition case is not "reconciliation software." Stripe already acquired Recko for that
category. The case must become one of strategic acceleration:

- cross-processor and cross-ledger exception intelligence;
- deterministic replay and evidence across financial-system boundaries;
- faster onboarding of messy financial sources;
- a proprietary, permissioned corpus of exception patterns and resolution policies; and
- production adoption that an acquirer cannot reproduce by assigning an internal team.

## Current assessment

| Dimension                    | State                                     | Evidence boundary                                                             |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| Deterministic reconciliation | Verified in repository                    | Named build, determinism, replay, and proofpack gates                         |
| Tenant isolation             | Verified statically and by targeted tests | Live deployment RLS evidence is still required                                |
| Enterprise identity          | Partial                                   | OIDC is configuration-gated; SCIM is not shipped                              |
| Production build             | Verified locally                          | Target deployment smoke and rollback evidence remain required                 |
| Paying customers             | Missing external evidence                 | No populated, source-backed customer register is present                      |
| Revenue and retention        | Missing external evidence                 | No populated board-metric history is present                                  |
| Customer outcomes            | Missing external evidence                 | No consented, source-backed case study is present                             |
| Proprietary data moat        | Not demonstrated                          | Requires permissioned production exception data and measured reuse            |
| Team                         | Missing external evidence                 | Named employment/contract records and IP assignments are required             |
| Corporate and IP             | Missing external evidence                 | Counsel-reviewed formation, cap table, assignments, and FTO work are required |
| Certifications               | Incomplete                                | SOC 2 readiness is not certification                                          |
| Platform partnerships        | Missing external evidence                 | No approved Stripe or PayPal partnership evidence is registered               |

## Acquirer fit

### Stripe

Stripe is a difficult target because it owns Recko and operates a large Revenue and Finance
Automation suite. Settler becomes relevant only if it proves a missing cross-processor capability,
unique data, strategic customers, or a team that materially accelerates Stripe's interoperability
roadmap.

Decision rule: do not approach Stripe corporate development before there are joint customers, a
product-team sponsor, and source-backed evidence that Settler resolves problems the current Stripe
stack does not.

### PayPal

PayPal Open creates a plausible partner path for external merchant-operating tools. The acquisition
case requires evidence that Settler improves merchant retention, payment volume, operational cost,
or platform differentiation across PayPal/Braintree and third-party systems.

Decision rule: pursue a product partnership and joint merchant proof before any acquisition
conversation.

## Acquisition gates

An acquisition narrative may become credible only after all of the following are true:

1. At least five paying production customers and three referenceable customers.
2. Source-backed reconciliation volume and customer outcomes over a defined period.
3. Repeatable onboarding that does not depend on founder-only intervention.
4. A measured proprietary data or policy advantage that improves with usage.
5. Independent security assessment, production recovery evidence, and an enterprise identity path.
6. Clean corporate, employment, contractor, IP-assignment, dependency, and data-rights records.
7. A platform partnership or internal product sponsor at a plausible strategic acquirer.
8. Revenue, retention, gross-margin, and concentration history sufficient to survive diligence.

No valuation range is authorized before those inputs exist.

## What not to do

- Do not build features to simulate organizational scale.
- Do not publish fictional personas as customer stories.
- Do not convert targets into traction.
- Do not describe readiness work as certification.
- Do not contact corporate development with a generic reconciliation pitch.
- Do not optimize for acquisition at the expense of an independent, valuable business.

## Official strategic context

- Stripe's Recko acquisition: <https://stripe.com/au/newsroom/news/recko>
- Stripe's interoperability direction: <https://stripe.com/newsroom/news/sessions-2024>
- PayPal Open: <https://newsroom.paypal-corp.com/2025-02-25-Introducing-PayPal-Open-The-Unified-Payments-and-Growth-Platform-for-Businesses-of-All-Sizes>
