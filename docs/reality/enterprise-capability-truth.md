# Enterprise Capability Truth Table

_Date: 2026-04-06_

This document is the public-facing truth map for enterprise identity and export posture.

## Status legend

- **Verified**: implemented and covered by repeatable verification commands/tests.
- **Implemented / unverified**: implementation exists but runtime interoperability is not yet proven across expected environments.
- **Staged**: roadmap/partial scaffolding; not saleable as generally available.

## Capability table

| Capability                  | Status                   | Boundary                                                                         | Verification path                                                                                                                                    |
| --------------------------- | ------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant-scoped RBAC          | Verified                 | API/Web permissions are tenant-scoped and enforced at request boundaries.        | `pnpm run verify:tenant`; `pnpm run test:cross-tenant`                                                                                               |
| SSO (OIDC)                  | Implemented / unverified | Env contracts for Okta / Entra / Google Workspace; no IdP runtime proof in-repo. | `pnpm run verify:enterprise-identity` (exit 0 = all three env contracts; exit 2 = degraded) + per-deployment IdP smoke. SAML is not GA in this path. |
| SCIM lifecycle provisioning | Missing                  | No SCIM routes ship in this repository.                                          | `pnpm run verify:scim-posture` (explicit not_applicable boundary).                                                                                   |
| Audit export / SIEM handoff | Implemented / unverified | Export surfaces exist; mapping and ingestion behavior are deployment-specific.   | `pnpm run verify:security:evidence` + tenant-scoped export contract tests.                                                                           |

## Claim gating policy

Marketing, pricing, onboarding, and enterprise docs must not promote any capability above this table state.
If a capability status is changed to **Verified**, the corresponding verification command(s) and test coverage must be updated in the same PR.
