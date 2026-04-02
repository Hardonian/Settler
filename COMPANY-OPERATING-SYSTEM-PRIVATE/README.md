<<<<<<< HEAD
# COMPANY OPERATING SYSTEM (PRIVATE / INTERNAL)

> **Confidential internal operator material.** Not for public docs, marketing pages, or customer-facing collateral.

## What this folder is

This folder is Settler's internal company-operating system for running monetization, quote-to-cash, onboarding, procurement, legal-commercial control, finance close, and executive cadence **truthfully against current repo reality**.

## Who this is for

- Founder / operator
- Revenue + implementation owner
- Finance and legal collaborators
- Any internal person touching pricing, terms, onboarding, billing, collections, support, or renewals

## How this operating system is organized

- `00_EXECUTIVE_INDEX.md` — first-stop entrypoint and run order
- `01_Monetization/` — packaging, pricing governance, SKU map, deal desk
- `02_Finance-Accounting/` — rev-rec memo, close, metrics, forecast, collections, COA mapping
- `03_Legal-Commercial/` — contracting stack, order form template, redline and security questionnaire pack
- `04_Sales-Implementation-Handoff/` — sales-to-delivery governance and go-live criteria
- `05_Onboarding-GoLive-CS/` — onboarding, support boundaries, health/renewal model, QBR
- `06_Procurement-Security-Pack/` — buyer diligence packet and escalation matrix
- `07_Operating-Rhythm-KPIs/` — weekly/monthly operating rhythm, ownership, definitions, decision governance
- `08_Templates/` — reusable operating templates
- `09_Decision-Logs/` — initial decisions and open legal/CPA decisions
- `10_Optional-Sheets-CSV/` — CSV templates aligned to the operating model

## Canonical docs by domain

- **Packaging & pricing:** `01_Monetization/PACKAGING_AND_PLAN_ARCHITECTURE.md`, `01_Monetization/PRICING_GOVERNANCE.md`
- **Quote-to-cash controls:** `01_Monetization/DEAL_DESK_APPROVAL_MATRIX.md`, `03_Legal-Commercial/COMMERCIAL_CONTRACTING_STACK.md`, `02_Finance-Accounting/FINANCE_SYSTEM_OF_RECORD_AND_EXPORT_MAP.md`
- **Finance & accounting:** `02_Finance-Accounting/REVENUE_RECOGNITION_POLICY_MEMO.md`, `02_Finance-Accounting/MONTHLY_CLOSE_CHECKLIST.md`, `02_Finance-Accounting/CHART_OF_ACCOUNTS_MAPPING.md`
- **Contracting & legal-commercial:** `03_Legal-Commercial/REDLINES_AND_NEGOTIATION_PLAYBOOK.md`, `03_Legal-Commercial/MSA_RED_FLAG_CLAUSES.md`
- **Onboarding/go-live/support/renewals:** `04_Sales-Implementation-Handoff/GO_LIVE_ACCEPTANCE_CRITERIA.md`, `05_Onboarding-GoLive-CS/SUPPORT_TIERS_AND_BOUNDARIES.md`, `05_Onboarding-GoLive-CS/CUSTOMER_HEALTH_AND_RENEWAL_MODEL.md`
- **Procurement/security diligence:** `06_Procurement-Security-Pack/PROCUREMENT_PACKET_CHECKLIST.md`, `03_Legal-Commercial/SECURITY_QUESTIONNAIRE_RESPONSE_PACK.md`
- **Operating rhythm:** `07_Operating-Rhythm-KPIs/WEEKLY_OPERATING_REVIEW.md`, `07_Operating-Rhythm-KPIs/MONTHLY_EXECUTIVE_OPERATING_PACK.md`

## How to run weekly/monthly operations from here

1. **Weekly:** run `07_Operating-Rhythm-KPIs/WEEKLY_OPERATING_REVIEW.md` agenda, then log exceptions in `09_Decision-Logs/`.
2. **Deal review:** enforce `01_Monetization/DEAL_DESK_APPROVAL_MATRIX.md` before any non-standard term.
3. **Implementation:** use `04_Sales-Implementation-Handoff/SALES_TO_IMPLEMENTATION_HANDOFF.md` + template.
4. **Month-end close:** execute `02_Finance-Accounting/MONTHLY_CLOSE_CHECKLIST.md` and track issues in template.
5. **Quarterly:** run `05_Onboarding-GoLive-CS/QBR_TEMPLATE.md` and renewal prep template.

## Material type legend

- **Policy memo**: internal operating policy and decision boundaries.
- **Operator guidance**: day-to-day execution workflow.
- **Template**: ready-to-use operating artifact.
- **Register/log**: controlled record of exceptions/decisions.

## Source-of-truth discipline

When this folder conflicts with older public repo docs, this folder is canonical for internal commercial/operating execution. Public docs may remain externally oriented and intentionally simplified.
=======
# COMPANY-OPERATING-SYSTEM-PRIVATE

## ⚠️ CONFIDENTIAL - INTERNAL USE ONLY

**This folder contains private, internal company-operating content. Do not share externally.**

---

## What Is This?

This is the **Settler Internal Operating System** — the definitive source of truth for how we run the company. It contains the policies, playbooks, templates, and guidance that govern pricing, monetization, finance, legal-commercial operations, customer onboarding, procurement, and operating rhythm.

**This is NOT public-facing material.** This is for founders, operators, and team members who need to execute company operations. Compare to:

- `/docs/` — Public-facing developer and product documentation
- `/LEGAL/` — Legal templates (some public-facing)
- `/INVESTOR-RELATIONS-PRIVATE/` — Investor materials (confidential)
- `/strategic/` — Strategic planning documents (confidential)
- `COMPANY-OPERATING-SYSTEM-PRIVATE/` — **YOU ARE HERE** — Day-to-day operating procedures

---

## Who Is This For?

| Role                 | Primary Use                                                      |
| -------------------- | ---------------------------------------------------------------- |
| **Founder/CEO**      | Strategic decisions, pricing, legal-commercial, operating rhythm |
| **Operators**        | Day-to-day execution, onboarding, procurement, finance           |
| **Sales/CS**         | Customer onboarding, contracting, procurement workflows          |
| **Finance**          | Billing, revenue operations, financial close                     |
| **Legal/Compliance** | Contract templates, DPA, MSA, SLA terms                          |
| **AI Agents**        | Structured guidance for company operations                       |

---

## How This Folder Is Organized

```
COMPANY-OPERATING-SYSTEM-PRIVATE/
├── README.md                    ← You are here (start with this)
├── 00_EXECUTIVE_INDEX.md        ← The operator starting point (read second)
│
├── pricing/                     ← Pricing strategy and execution
│   ├── 00_PRICING_CANONICAL.md ← Master pricing reference
│   └── PRICING_POLICY_MEMO.md  ← Pricing decisions and rationale
│
├── monetization/                ← Revenue model and billing
│   ├── REVENUE_MODEL.md        ← How we make money
│   └── BILLING_OPS.md          ← Billing operations guide
│
├── finance/                    ← Financial close and reporting
│   ├── MONTHLY_CLOSE.md        ← Monthly close procedures
│   └── COST_BASELINES.md       ← Cost structure reference
│
├── legal-commercial/            ← Contracts, terms, and commercial agreements
│   ├── TERMS_REFERENCE.md      ← ToS summary for operators
│   ├── MSA_GUIDE.md            ← MSA process guide
│   ├── PILOT_GUIDE.md          ← Pilot agreement process
│   └── DPA_GUIDE.md            ← Data Processing Addendum guide
│
├── onboarding/                 ← Customer and employee onboarding
│   ├── CUSTOMER_ONBOARDING.md  ← Customer activation playbook
│   └── EMPLOYEE_HANDOVER.md     ← Team onboarding reference
│
├── procurement/                ← Enterprise procurement workflows
│   ├── VENDOR_PROCUREMENT.md   ← Vendor onboarding guide
│   └── SECURITY_ASSESSMENT.md   ← Security review process
│
├── operating-rhythm/           ← Cadence, rituals, and reporting
│   ├── WEEKLY_RITUALS.md        ← Weekly operating cadence
│   ├── MONTHLY_RITUALS.md       ← Monthly operating cadence
│   └── DECISION_LOG.md         ← Decision tracking template
│
├── decisions/                  ← Codified decisions (append-only)
│   └── README.md               ← How to use the decision log
│
└── runbooks/                  ← Step-by-step operational procedures
    ├── FIRST_SALE_RUNBOOK.md   ← Process for closing first sale
    ├── FIRST_PILOT_RUNBOOK.md   ← Process for first customer pilot
    └── FIRST_ENTERPRISE_RUNBOOK.md ← Enterprise onboarding guide
```

---

## Canonical Documents by Area

### Pricing

> **Canonical:** `pricing/00_PRICING_CANONICAL.md`
>
> Tiers: Free ($0) | Starter ($29/mo) | Growth ($99/mo) | Scale ($299/mo) | Enterprise (Custom)

### Monetization & Billing

> **Canonical:** `monetization/REVENUE_MODEL.md`
>
> 80% subscriptions, 15% overages, 5% enterprise contracts

### Finance

> **Canonical:** `finance/MONTHLY_CLOSE.md`
>
> Monthly close procedures, ARR tracking, gross margin targets

### Legal-Commercial

> **Canonical:** Root `LEGAL/` folder for templates
>
> - MSA: `LEGAL/MSA_TEMPLATE.md`
> - Pilot: `LEGAL/PILOT_AGREEMENT_TEMPLATE.md`
> - DPA: `LEGAL/DPA_TEMPLATE.md`
> - ToS: `LEGAL/TERMS_OF_SERVICE.md`

### Onboarding

> **Canonical:** `onboarding/CUSTOMER_ONBOARDING.md`
>
> Day 0-30 activation sequence, email templates, escalation paths

### Procurement

> **Canonical:** `procurement/VENDOR_PROCUREMENT.md`
>
> Vendor onboarding, security assessment, contract negotiation

### Operating Rhythm

> **Canonical:** `operating-rhythm/WEEKLY_RITUALS.md` and `MONTHLY_RITUALS.md`
>
> Cadence, reporting, decision-making protocols

---

## Document Types

| Type             | Purpose                              | Example                             |
| ---------------- | ------------------------------------ | ----------------------------------- |
| **Policy Memo**  | Codified decisions, rationale, rules | `pricing/PRICING_POLICY_MEMO.md`    |
| **Playbook**     | Step-by-step process for a workflow  | `onboarding/CUSTOMER_ONBOARDING.md` |
| **Template**     | Ready-to-use document structure      | `runbooks/*.md`                     |
| **Reference**    | Master document for an area          | `pricing/00_PRICING_CANONICAL.md`   |
| **Runbook**      | Critical operational procedures      | `runbooks/FIRST_SALE_RUNBOOK.md`    |
| **Decision Log** | Append-only decision record          | `decisions/`                        |

---

## How to Use This Folder

### Daily Operations

1. Start with `00_EXECUTIVE_INDEX.md` if you need direction
2. Navigate to the relevant subfolder
3. Use playbooks and runbooks for step-by-step execution
4. Reference policy memos for decision rationale

### Weekly/Monthly Cadence

1. Use `operating-rhythm/WEEKLY_RITUALS.md` for weekly rhythms
2. Use `operating-rhythm/MONTHLY_RITUALS.md` for monthly close
3. Update `decisions/` with new decisions (append-only)

### Key Milestones

| Milestone        | Runbook                                |
| ---------------- | -------------------------------------- |
| First Sale       | `runbooks/FIRST_SALE_RUNBOOK.md`       |
| First Pilot      | `runbooks/FIRST_PILOT_RUNBOOK.md`      |
| First Enterprise | `runbooks/FIRST_ENTERPRISE_RUNBOOK.md` |
| Monthly Close    | `finance/MONTHLY_CLOSE.md`             |

---

## Governance

### Document Status

- **Active:** Currently in use, regularly updated
- **Review:** Needs review (flagged in document)
- **Deprecated:** Superseded by another document
- **Template:** Ready to use as-is

### Update Protocol

1. All updates require founder/operator review
2. Decisions are **append-only** — never delete decision history
3. Templates can be customized; reference docs should not be modified
4. Link updates propagate from this README

### Version Control

- Documents include "Last Updated" and "Status" headers
- Check git history for change tracking
- Major changes require decision log entry

---

## External Reference Links

| Area                | External Canonical             |
| ------------------- | ------------------------------ |
| Developer Docs      | `/docs/`                       |
| Legal Templates     | `/LEGAL/`                      |
| Investor Materials  | `/INVESTOR-RELATIONS-PRIVATE/` |
| Strategic Framework | `/strategic/`                  |
| Email Templates     | `/emails/`                     |
| Product Spec        | `MODEL_SPEC.md`                |
| Repository README   | `README.md`                    |

---

## Support

**Questions about this operating system?**

- Start with `00_EXECUTIVE_INDEX.md`
- Check relevant subfolder README
- Review `operating-rhythm/` for cadence

**Found an error or gap?**

- Flag in document with `[TODO: Verify]` or `[GAPS: ]`
- Log decision if you made a judgment call
- Notify founder/operator for approval

---

**⚠️ REMINDER: This folder contains confidential company information. Do not share externally. All materials are for internal use only.**

**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator  
**Status:** Active Operating System
>>>>>>> 1726ba1cd (feat: initialize @settler/api package and implement reconciliation run management routes)
