# Due Diligence Evidence Index

**As of:** 2026-09-21
**Status:** Engineering diligence is available; commercial, corporate, and third-party evidence is incomplete

This file is an index, not a readiness certificate. A checklist, migration, test, or architecture
document proves only the scope it actually exercises.

## Available engineering evidence

| Area                  | Evidence                              | Boundary                                                                              |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| Build and tests       | `pnpm verify`                         | Local/CI repository verification, not deployment health                               |
| Determinism           | `pnpm run verify:determinism`         | Matching fixture and fingerprint boundary                                             |
| Replay                | `pnpm run verify:replay`              | Checked evidence fixture, not every production run                                    |
| Proofpacks            | `pnpm run verify:proofpack`           | Proofpack contract tests                                                              |
| Tenant route coverage | `pnpm run verify:tenant`              | Static control-presence coverage                                                      |
| Cross-tenant guards   | `pnpm run test:cross-tenant`          | Application tests; DB-backed cases require `RUN_DB_TESTS=true`                        |
| Live RLS              | `pnpm run verify:rls:live`            | Pending: configured target rejected authentication on 2026-09-21                      |
| Dependencies          | `pnpm run audit:deps`                 | pnpm audit and OSV clean on 2026-09-21; authenticated Dependabot evidence unavailable |
| Enterprise identity   | `pnpm run verify:enterprise-identity` | Configuration contract, not provider end-to-end proof                                 |
| SCIM                  | `pnpm run verify:scim-posture`        | Not shipped                                                                           |

## Evidence not present in the repository

- executed customer contracts, invoices, and revenue history;
- referenceable customer outcomes and written consent;
- audited financial statements, cap table, and corporate records;
- signed employee/contractor IP assignments;
- freedom-to-operate or license opinion from counsel;
- completed penetration test and remediation letter;
- SOC 2, ISO, PCI, HIPAA, GDPR, or other certification/legal opinion; and
- approved Stripe, PayPal, or other platform partnership evidence.

The private evidence register at `../INVESTOR-RELATIONS-PRIVATE/EVIDENCE_REGISTER.md` is the
authoritative claim ledger. Buyer-facing material must cite a verified row from that register.

## Data-room admission

An item is ready for buyer review only when it has a named owner, observation/effective date,
source system or signed original, scope and exclusions, and reviewer approval. Forecasts, templates,
targets, and architecture intent must remain visibly labeled and separate from historical evidence.

Superseded self-assessments are retained in `docs/archive/2026-09-21-evidence-audit/` for provenance.
