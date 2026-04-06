# Enterprise Capability Truth Table

_Date: 2026-04-06_

This document is the public-facing truth map for enterprise identity and export posture.

## Status legend

- **Verified**: implemented and covered by repeatable verification commands/tests.
- **Implemented / unverified**: implementation exists but runtime interoperability is not yet proven across expected environments.
- **Staged**: roadmap/partial scaffolding; not saleable as generally available.

## Capability table

| Capability | Status | Boundary | Verification path |
| --- | --- | --- | --- |
| Tenant-scoped RBAC | Verified | API/Web permissions are tenant-scoped and enforced at request boundaries. | `pnpm run verify:tenant`; `pnpm run test:cross-tenant` |
| SSO (SAML/OIDC) | Implemented / unverified | Environment and provider configuration surfaces exist, but broad IdP interoperability evidence is incomplete. | Validate `SUPABASE_ENTERPRISE_SSO_*` env + run per-IdP smoke tests before GA claims. |
| SCIM lifecycle provisioning | Staged | Lifecycle language exists; route-level provisioning/deprovisioning verification is incomplete. | Add route fixture tests and deprovision evidence bundle checks. |
| Audit export / SIEM handoff | Implemented / unverified | Export surfaces exist; mapping and ingestion behavior are deployment-specific. | `pnpm run verify:security:evidence` + tenant-scoped export contract tests. |

## Claim gating policy

Marketing, pricing, onboarding, and enterprise docs must not promote any capability above this table state.
If a capability status is changed to **Verified**, the corresponding verification command(s) and test coverage must be updated in the same PR.
