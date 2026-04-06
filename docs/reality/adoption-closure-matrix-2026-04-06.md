# Adoption Closure Matrix (Research Report → Repo Truth)

_Date: 2026-04-06_
_Scope: external report themes provided in implementation prompt_

This matrix maps each material recommendation theme from the report to current Settler evidence and closure status. Status values:

- **Verified**: implemented + validated by route/tests/scripts.
- **Partial**: implemented but materially incomplete or not fully validated.
- **Docs-only**: described, but implementation evidence is weak.
- **Missing**: no credible implementation evidence in repo.
- **N/A**: intentionally out of scope (with reason).

## 1) Report-to-repo closure matrix

| Report theme | Status | Evidence in repo | Gap / action |
| --- | --- | --- | --- |
| Local-first quickstart | Partial | `docs/getting-started/quickstart.md`, `SETUP.md`, `scripts/doctor.ts`, `scripts/bootstrap.mjs`, `pnpm dev:stack` | Canonical path exists; now tightened with explicit degraded states and teardown path in this pass. |
| Reversible teardown / cleanup | Partial → tightened | `scripts/dev-teardown.mjs` (new), `pnpm dev:teardown`, `pnpm tb:stop`, `pnpm demo:reset` | New deterministic teardown entrypoint added; destructive DB reset remains explicit/manual. |
| Deterministic first-value walkthrough | Partial | `pnpm demo:settler`, `scripts/settler-demo.ts`, `scripts/verify-replay.mjs`, `scripts/verify-determinism.mjs` | Present but depends on local infra availability and environment quality. |
| OIDC / SAML enterprise SSO | Partial (truth-gated) | `packages/web/src/lib/enterprise/capabilityTruth.ts`, enterprise/pricing/security surfaces now render explicit state boundaries | Requires full runtime integration evidence matrix per IdP before claiming general availability. |
| SCIM provisioning | Partial / staged | `docs/reality/enterprise-capability-truth.md` and web capability truth table mark SCIM as staged, not GA | Need route-level SCIM contract verification and fixture-based provisioning tests for verified status. |
| Tenant lifecycle + deprovisioning | Partial | `scripts/tenant-create.ts`, tenant/security verification commands in `package.json` | Need documented end-to-end deprovision + data export/delete runbook with runtime checks. |
| Audit logs / who-did-what-when | Partial | `packages/api/src/routes/v1/audit-trail.ts`, audit viewers in web UI, audit-related tests/scripts | Need clearer SIEM export contract and evidence for enterprise integrations. |
| SIEM exportability | Partial | export surfaces and operational tabs/docs exist | Need explicit vendor-neutral export format + validation fixtures. |
| OpenTelemetry / observability | Partial | strong OTel surface in `packages/workhorse/*`; API/web observability mixed | Need cross-surface telemetry parity doc + runtime check to mark verified. |
| SBOM / supply chain / provenance | Verified (scripted) | `scripts/security/supply-chain.mjs`, `pnpm verify:security:supply-chain`, release/provenance scripts | Continue attaching artifacts to release evidence pack. |
| Security evidence/trust pack | Partial | `docs/security/*`, `docs/compliance/*`, `scripts/security/*`, `security:evidence` scripts | Needs single procurement-facing index with freshness SLA and owner map. |
| Privacy / DPA / SCC / retention posture | Partial | privacy/compliance docs exist across `docs/compliance` + package docs | Needs one canonical buyer path with explicit “implemented vs planned” markers. |
| Pilot runbook + rollback | Partial | pilot docs/scripts (`docs/PILOT_*`, `scripts/pilot/*`) | Some pilot helper references still indicate pending assets; requires closure before “verified.” |
| SDK truth across languages | Partial | `packages/sdk*`, `examples/starter-kits/*`, SDK packages and docs | Need per-SDK smoke parity matrix and auth/error/retry examples normalized. |
| Managed service / support boundaries | Partial (narrowed) | pricing FAQ and enterprise metadata narrowed to engagement-scoped deployment commitments | Need canonical tier boundary matrix aligned to actual support operations. |
| OSS/plugin/adapter leverage | Partial | `marketplace/adapters/*`, `docs/integrations/*`, open-source pages | Need stable extension contract + compatibility promises per adapter. |
| Docs-as-product truth discipline | Partial | `docs/reality/*`, route/claim verifiers, docs governance metadata | Ongoing drift risk remains due to broad docs surface and duplicate historical docs. |
| Adoption funnel instrumentation | Partial | operational scripts and validation tools exist | Need standardized adoption KPI schema + privacy-safe collection policy doc. |

## 2) Work classification for this pass

- **Leverage:** tightened enterprise/public claim truth with implemented-vs-staged capability table integrated into product surfaces.
- **Leverage:** strengthened local-first bootstrap by adding setup verification and explicit teardown/reset next steps.
- **Maintenance:** narrowed overstated metadata/security wording to match currently verifiable state.
- **Moat impact:** trust-preserving truth gating prevents false enterprise commitments while preserving evidence integrity over time.

## 3) Explicit deferrals in this pass

The following are intentionally deferred because they require deeper runtime integration passes beyond safe single-pass scope:

1. Full SCIM route + provisioning lifecycle verification.
2. IdP-by-IdP SSO validation matrix (Okta, Entra ID, Google Workspace, etc.).
3. SIEM export schema/versioned contract tests.
4. Cross-SDK parity smoke suite across all language SDKs.

These remain high-leverage and should be the next implementation tranche after this pass.
