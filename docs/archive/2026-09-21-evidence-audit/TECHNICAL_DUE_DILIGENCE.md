# Settler Series A Technical Due Diligence

## Summary Score

**Overall readiness: 7.2 / 10**

- Isolation enforcement: 8.0
- Audit hash-chain robustness: 6.8
- Export schema versioning: 7.0
- Observability maturity: 7.1
- Disaster recovery: 6.5
- Test coverage confidence: 7.4
- Dependency/compliance hygiene: 6.7

## 1) Isolation Enforcement

### Evidence

- RLS migrations cover critical reconciliation and billing tables.
- Tenant helper functions and tenant-scoped policy patterns are present.
- Permissions model documents layered controls (API/UI/DB).

### Findings

- Baseline architecture is aligned with multi-tenant isolation best practices.
- Primary residual risk is privileged/service-role bypass and policy drift over time.

### Actions

- Add automated RLS coverage diffing against schema inventory.
- Enforce “no direct table access without tenant proof” in CI.

## 2) Audit Hash-Chain Robustness

### Evidence

- Receipt tamper-evident hash-chain implementation exists with verification method.
- Production schema metadata references audit sign/verify triggers.

### Findings

- Tamper detection path is credible.
- Enterprise-grade immutability requires stronger storage governance and external attestation.

### Actions

- Add periodic notarization of chain checkpoints.
- Lock audit records with append-only privileges and monitored break-glass path.

## 3) Export Schema Versioning + Contract Integrity

### Evidence

- Evidence bundles include `schema_version` + hash manifest conventions.
- Export capability is referenced in validation scripts.

### Findings

- Good foundation for reproducible exports.
- Need explicit compatibility matrix and deprecation policy.

### Actions

- Publish versioned JSON schema contracts and consumer conformance tests.
- Attach signatures to generated export payloads.

## 4) Observability Maturity

### Evidence

- Structured logging, trace IDs, and operational validation scripts are present.
- Verification scripts include contract and docs checks.

### Findings

- Mature for startup scale, improving toward enterprise with stronger SLO/error-budget reporting.

### Actions

- Add tenant-segmented SLO dashboards (latency, reconciliation completion, export success).
- Track and alert on security-relevant anomalies (RLS denials, privilege escalations, replay attempts).

## 5) Disaster Recovery

### Findings

- Runbooks and operational docs exist, but recovery objectives need explicit periodic proof.

### Actions

- Define and test quarterly DR game days with published RTO/RPO evidence.
- Add automated backup integrity verification + replay drills.

## 6) Test Coverage

### Findings

- Broad script/test infrastructure exists (lint/type/build/e2e/reality checks).
- Security-specific regression tests should be expanded (tenant bleed, audit tamper, export mismatch).

### Actions

- Introduce adversarial security test suite in CI.
- Require deterministic replay parity tests for reconciliation engine releases.

## 7) Dependency Audit (Vulnerabilities, Licenses, AI Compliance)

### Vulnerability posture

- `pnpm audit` could not complete due registry audit endpoint 403 in this environment; vulnerability status is therefore **not attestable from this run alone**.

### License posture

- Majority permissive, but restrictive/copyleft and policy-sensitive licenses were detected in dependency graph (e.g., AGPL-3.0, LGPL-3.0-or-later, WTFPL variants, dual GPL options).
- These require legal review for distribution and procurement policy alignment.

### AI model compliance posture

- AI integrations call external model providers and therefore trigger data processing, retention, and cross-border transfer obligations.
- Governance controls required: prompt minimization, output disclaimers, model/version provenance, and provider DPA coverage.

### Recommended controls

1. Use internal registry mirror + continuous SCA scanning for reliable CVE reporting.
2. Enforce license allow/deny policy in CI.
3. Create AI provider compliance checklist (DPA, retention, redaction, model change notifications).
