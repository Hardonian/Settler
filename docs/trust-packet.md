# Trust Packet Index

**Last reviewed:** 2026-09-21
**Current verdict:** Repository controls verified; production assurance incomplete

This packet provides evidence boundaries for security and procurement review. It is not a
certification, audit opinion, SLA, or representation about an untested deployment.

## Product boundary

Settler is a deterministic reconciliation and exception-resolution system. It can produce
replayable, tamper-evident artifacts for configured reconciliation runs. Those artifacts support
review and do not replace auditor judgment.

## Evidence map

| Control area             | Repository evidence                                   | Current limitation                                        |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------- |
| Build and test integrity | `pnpm verify`                                         | Does not prove deployment health                          |
| Determinism              | `pnpm run verify:determinism`                         | Scoped to tested inputs and rules                         |
| Replay and proofpacks    | `pnpm run verify:replay`; `pnpm run verify:proofpack` | Fixture and contract evidence                             |
| Tenant route coverage    | `pnpm run verify:tenant`                              | Static control-presence check                             |
| Cross-tenant guards      | `pnpm run test:cross-tenant`                          | DB-backed cases require `RUN_DB_TESTS=true`               |
| RLS                      | migration definitions; `pnpm run verify:rls:live`     | Live target verification is credential-blocked            |
| Dependencies             | pnpm audit plus OSV                                   | Authenticated Dependabot completeness unavailable locally |
| Identity                 | `pnpm run verify:enterprise-identity`                 | Provider end-to-end evidence absent                       |
| SCIM                     | `pnpm run verify:scim-posture`                        | Not shipped                                               |

## Architecture

The TypeScript/Express control plane, Next.js console, reconciliation core, adapters, SDK/CLI, Rust
kernel, and optional TigerBeetle/Redis components are described in
[`architecture/platform-architecture.md`](architecture/platform-architecture.md). Actual services,
regions, encryption, retention, and subprocessors depend on the selected deployment and must be
confirmed separately.

## Tenant isolation

Settler implements required tenant identifiers, repository and entity guards, route authorization,
tenant-scoped query checks, and RLS definitions. Current evidence does not authorize a claim of
complete deployment isolation. See
[`TENANT_ISOLATION_VERIFICATION.md`](TENANT_ISOLATION_VERIFICATION.md) for the required live matrix
and privileged bypass boundaries.

## Compliance and independent assurance

No completed SOC 2, ISO 27001, PCI, HIPAA, GDPR, CCPA, penetration-test, or legal-compliance opinion
is registered in the evidence room. Readiness controls and policy mappings are implementation aids,
not certification.

## Operational assurance required before enterprise GA

- target-environment RLS and cross-tenant tests with no skipped DB cases;
- authenticated advisory evidence and maintained SBOM/license review;
- independent penetration test with high-severity remediation;
- restore, rollback, RPO/RTO, and incident exercise observations;
- deployment-specific data flow, subprocessor, residency, retention, and deletion review; and
- executed commercial, privacy, support, and security terms.

The active diligence index is [`DUE_DILIGENCE.md`](DUE_DILIGENCE.md). Historical trust claims are
archived under `docs/archive/2026-09-21-evidence-audit/` and are not approved customer collateral.
