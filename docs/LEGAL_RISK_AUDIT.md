# Settler Legal + Compliance Risk Audit

## Executive Posture
Settler has strong technical primitives for tenant isolation and deterministic processing, but enterprise procurement requires tighter formalization of legal claims, explicit AI advisory limitations, and export/audit attestability language that matches runtime guarantees.

## 1) Data Portability Obligations
### Assessment
- Platform positioning and docs emphasize customer data ownership and exportability.
- Evidence bundle and export pathways exist, but contract-level portability SLOs are not uniformly codified.

### Risks
- Enterprise buyers may treat portability promises as binding representations.
- Incomplete schema version commitments can create migration friction during offboarding.

### Required controls
- Publish contractual portability commitments (format, latency, retention window).
- Version export schemas and provide compatibility/deprecation policy.
- Provide machine-readable data map for all tenant-owned objects.

## 2) Audit Integrity Claims
### Assessment
- Audit logging and hash-chain concepts are present in platform/docs.
- Current public language can be interpreted as “immutable” without explicit scope boundaries.

### Risks
- Overbroad immutability claims without demonstrable WORM controls can create legal exposure.
- Discovery obligations may require proof of chain-of-custody and verification reproducibility.

### Required controls
- Use precise claim language: “tamper-evident” unless true immutable storage controls are enforced.
- Add documented verification procedure and independent attestation cadence.
- Maintain retention and legal hold controls with documented override governance.

## 3) Privacy Posture
### Assessment
- Existing architecture and docs describe tenant isolation, auth controls, and secret hygiene.
- Need clearer data classification, lawful basis mapping, and processor/subprocessor boundaries.

### Risks
- Ambiguity around telemetry/log fields can produce GDPR/CCPA scope uncertainty.
- AI-assisted features can unintentionally process more personal data than necessary.

### Required controls
- Publish a strict data classification matrix and minimization policy.
- Maintain subprocessor inventory and transfer mechanism disclosures.
- Enforce prompt redaction and retention controls for AI-related processing.

## 4) AI Advisory Risk
### Assessment
- Advisory/agent code paths and provider calls are present.
- Financial decision workflows require explicit separation of deterministic outputs from advisory language.

### Risks
- Hallucination or stale guidance may be interpreted as authoritative accounting recommendations.
- Model/provider changes can alter behavior without contractual notice.

### Required controls
- Contractual disclaimer: advisory outputs are non-authoritative decision support.
- Provenance fields (`model`, `version`, `timestamp`, `inputs_fingerprint`) for every advisory response.
- Human approval requirement for material posting actions.

## 5) Enterprise Procurement Readiness
### Current readiness: **Moderate (6.8/10)**

### Strengths
- Multi-tenant/RLS-first architecture.
- Deterministic reconciliation design posture.
- Evidence bundle concept for audits.

### Gaps to close
- Formal SOC2 control mapping and testing evidence pack.
- Vendor due diligence artifacts (security whitepaper, privacy addendum, data portability playbook).
- Defined breach notification and incident communications SLA language.

## Recommended 60-Day Legal/Compliance Plan
1. Finalize and publish `PRIVACY.md`, `SECURITY.md`, `DATA_PORTABILITY.md` as external-facing policy references.
2. Add contractual language distinguishing tamper-evident vs immutable guarantees.
3. Build procurement packet: CAIQ-lite answers, pen-test summary, RLS verification evidence, backup/restore proof.
4. Establish AI governance policy (allowable use, prohibited uses, review workflow, model change management).
