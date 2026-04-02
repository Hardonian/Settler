# Tax and Regional Commercial Posture (Operator Memo)

## Scope

Operator-facing tax posture for digital services. Confirm jurisdiction-specific treatment with CPA/tax counsel.

## Practical policy

- Determine customer billing country at contract signature.
- Track nexus triggers by jurisdiction (sales tax/VAT/GST/HST).
- Store exemption certificates before tax override.

## Decision tree

1. Is taxable nexus established in customer jurisdiction? If unknown -> escalate to CPA.
2. Is customer providing valid exemption/reseller certificate? If no -> charge applicable tax.
3. Is invoice cross-border B2B with reverse-charge rules? Confirm legal wording.

## Caution points

- Do not promise "tax included" unless explicitly priced.
- Keep tax line items explicit on invoices.
- Reassess quarterly as customer mix changes.
