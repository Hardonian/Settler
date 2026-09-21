# Evidence Register

**As of:** 2026-09-21

States:

- `verified` — supported by an inspectable artifact or executable gate.
- `partial` — implementation exists but runtime, deployment, or third-party evidence is incomplete.
- `missing_external` — cannot be created honestly from repository work.
- `not_shipped` — the capability is absent and must not be sold.

| ID          | Assertion                                 | State            | Current evidence                                                  | Required next evidence                                          | Owner             |
| ----------- | ----------------------------------------- | ---------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- | ----------------- |
| TECH-001    | Deterministic reconciliation build exists | verified         | `pnpm run verify:determinism`                                     | Fresh release artifact for each release                         | Engineering       |
| TECH-002    | Replay and proofpack paths exist          | verified         | `pnpm run verify:replay`; `pnpm run verify:proofpack`             | Target-environment replay sample                                | Engineering       |
| SEC-001     | Tenant-scoped route coverage is enforced  | verified         | `pnpm run verify:tenant`; latest coverage artifact                | Preserve 100% on every release                                  | Security          |
| SEC-002     | Cross-tenant negative paths are tested    | verified         | `pnpm run test:cross-tenant`                                      | Runtime deployment smoke                                        | Security          |
| SEC-003     | Dependency vulnerability scan is clean    | verified         | `pnpm run audit:deps`; pnpm audit plus OSV                        | Preserve both scanners in release CI                            | Security          |
| SEC-004     | Live database RLS is verified             | partial          | Runtime verifier exists; 2026-09-21 attempt failed authentication | Restore target credentials and rerun `pnpm run verify:rls:live` | Security / Ops    |
| OPS-001     | Web production build completes            | verified         | `pnpm --filter @settler/web build`                                | Deployment health and rollback evidence                         | Engineering       |
| ENT-001     | OIDC environment contracts exist          | partial          | `pnpm run verify:enterprise-identity`                             | Provider-specific end-to-end login test                         | Engineering       |
| ENT-002     | SCIM lifecycle provisioning exists        | not_shipped      | `pnpm run verify:scim-posture`                                    | Implemented routes, tests, and buyer validation                 | Product           |
| CERT-001    | SOC 2 Type II certification               | missing_external | Readiness controls only                                           | Auditor engagement and issued report                            | Founder           |
| COM-001     | Paying production customers               | missing_external | No populated customer register                                    | Executed order forms and invoices                               | Founder           |
| COM-002     | Referenceable customer outcomes           | missing_external | No consented source packet                                        | Signed approval plus source exports                             | Founder           |
| FIN-001     | ARR, NRR, churn, and gross margin         | missing_external | Templates only                                                    | Monthly ledger and cohort history                               | Founder / Finance |
| DATA-001    | Proprietary exception-resolution corpus   | missing_external | Architecture and policy primitives only                           | Data rights, volume, labels, reuse, and lift measurement        | Product           |
| TEAM-001    | Acquisition-retainable team               | missing_external | Repository does not prove employment                              | Named roster, agreements, retention plan, IP assignment         | Founder           |
| LEGAL-001   | Clean corporate structure and cap table   | missing_external | Repository checklist only                                         | Counsel-reviewed originals                                      | Founder / Counsel |
| IP-001      | Freedom to operate                        | missing_external | No legal opinion registered                                       | Qualified counsel review and supporting search                  | Counsel           |
| PARTNER-001 | Stripe or PayPal product partnership      | missing_external | No approved partnership registered                                | Executed agreement or partner listing                           | Founder           |

## Usage

Investor decks, customer collateral, and acquisition materials must cite these IDs. Claims in
`partial`, `missing_external`, or `not_shipped` states must include the state and boundary in the
same visible context.
