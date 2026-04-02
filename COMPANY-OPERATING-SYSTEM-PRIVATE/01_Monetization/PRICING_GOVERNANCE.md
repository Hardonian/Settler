# Pricing Governance

## List price philosophy

- Price for reliability, auditability, and exception-operating depth (not commodity API calls only).
- Keep list price simple enough for operator enforcement.

## Price integrity rules

1. No undocumented discounts.
2. No permanent discounts below floor without founder signoff.
3. Every non-standard term must map to margin impact.

## Discount guardrails (founder mode)

| Discount on subscription | Approval                                 |
| ------------------------ | ---------------------------------------- |
| 0-10%                    | Revenue owner                            |
| 11-20%                   | Founder                                  |
| >20%                     | Founder + written justification + expiry |

## Annual prepay rules

- Default annual prepay discount cap: 10%.
- Multi-year concessions require exception record and renewal step-up clause.

## Invoice term exceptions

- Default net-30.
- Net-45 only for enterprise with approval.
- Net-60 disallowed unless founder approved with collections mitigation.

## Pilot pricing rules

- Paid pilot preferred.
- Free pilot only with strict entry criteria and conversion owner assigned.
- Pilot extensions limited to one unless explicitly approved.

## Expansion and renewal posture

- Expansion uses current list price; grandfathering expires at renewal.
- Renewal uplift target: maintain or improve effective rate unless churn risk is verified.

## Non-standard controls

All exceptions must be logged in `../03_Legal-Commercial/COMMERCIAL_POLICY_EXCEPTIONS_REGISTER.md` and reviewed monthly.
