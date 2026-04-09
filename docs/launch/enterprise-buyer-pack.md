# Enterprise buyer pack (evidence-first)

Status: **CANONICAL**  
Last updated: 2026-04-05

Settler’s differentiation is **reconciliation intelligence**, **exception and adjudication memory**, **proofpacks / evidence lineage**, and **replayable operational history** — not a generic finance dashboard. This pack grounds procurement conversations in those strengths without outrunning proof.

## 1) Shared responsibility matrix (summary)

| Area                                                   | Settler (product + docs)                                                      | Customer                                               |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| Reconciliation runs, exceptions, proofpacks, replay UX | Provide software and APIs; tenant-scoped behavior                             | Configure data sources, policies, and review workflows |
| Application uptime / SLA                               | Contractual only when agreed; **public endpoints show connectivity, not SLA** | Monitor their integration and network path             |
| Data store backup / RPO/RTO                            | Document operator path; targets are **deployment-specific**                   | Own backup/restore for their infra and cloud accounts  |
| Auth / tenant isolation                                | Enforce in product; tests + verification commands in repo                     | IdP, API keys, least-privilege practices               |
| Compliance (SOC2, PCI, etc.)                           | Roadmap / assessment as stated in `claims.ts`                                 | Their auditor scope and cardholder environments        |

Full operational sequence: `docs/launch/canonical-go-live-path.md`.

## 2) Reference architecture (supported modes)

- **OSS / self-hosted style:** Customer runs API + DB + web per repo; they own scaling, backups, and monitoring.
- **Managed / SaaS style:** Settler-operated deployment; SLAs and regions are **contract-specific**, not implied by marketing pages.

Do not infer multi-region active-active from public status copy; verify in contract or architecture review.

## 3) Pilot success rubric (measurable)

| #   | Criterion                    | Pass threshold (example)                                                | Evidence                                                  |
| --- | ---------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Deterministic run completion | ≥ agreed % of pilot runs reach terminal state without operator override | Run IDs, logs                                             |
| 2   | Exception triage             | Exceptions carry policy + lineage usable in adjudication                | Screenshots / exports                                     |
| 3   | Proofpack depth              | Proofpack links resolve for pilot runs                                  | URLs or artifact hashes                                   |
| 4   | Replay                       | Same inputs reproduce comparable outcomes within documented boundaries  | Replay command output                                     |
| 5   | Tenant isolation             | No cross-tenant data in pilot tests                                     | `pnpm run verify:tenant` style evidence in customer’s env |

Thresholds are **negotiated per pilot**, not universal guarantees.

## 4) Trust-control / evidence index (for security reviews)

- Route classification: `packages/web/src/lib/api/route-classification.ts`
- Tenant verification: `pnpm run verify:tenant`, `pnpm run test:cross-tenant` (see verification matrix)
- Public connectivity: `/api/status/health` (`kind: settler.runtime_connectivity`)
- Claims registry: `packages/web/src/lib/claims.ts` + this doc

## 5) Procurement language guardrails

- Say **implemented** vs **planned** vs **customer responsibility** explicitly.
- Cite **commands and endpoints** instead of adjectives (“enterprise-grade”).
- For “launch-ready,” point to `pnpm run verify:launch:readiness` as **repo gate**, then customer-specific infra checks.
