# Settler STRIDE Threat Model

## Scope
This model covers the multi-tenant reconciliation platform (API, web console, background processing, Supabase data plane, and AI advisory pathways). It focuses on the explicit hostile scenarios requested for enterprise diligence.

## Security Objectives
1. Preserve tenant isolation under normal and adversarial access patterns.
2. Keep audit evidence tamper-evident and operationally verifiable.
3. Ensure deterministic reconciliation behavior and reproducibility.
4. Protect export contract integrity from silent drift and manipulation.
5. Enforce separation between deterministic reconciliation and AI advisory content.

## Trust Boundaries
- **Boundary A — Client/API Edge:** Browser and API clients crossing into web/app routes.
- **Boundary B — API/Data Plane:** Application services and edge functions crossing into Postgres/Supabase.
- **Boundary C — Internal Services:** JobForge/Workhorse/background processors consuming queues and writing results.
- **Boundary D — AI Advisory Integration:** Optional AI workflows calling model providers and returning non-authoritative guidance.
- **Boundary E — Export Surface:** CSV/JSON/report generation and evidence bundle production.

## STRIDE Analysis

### 1) Spoofing
**Threats**
- Stolen API keys or session tokens used to impersonate tenant operators.
- Forged webhook calls used to inject fake settlement or billing events.

**Existing controls**
- Auth + RBAC permissions matrix and middleware enforcement at API/UI boundary.
- Webhook signature verification guidance and implementation tests in repo docs/tests.
- Tenant context middleware and tenant-scoped query patterns.

**Residual risks**
- Service-role misuse can bypass ordinary tenant-scoped protections if secrets leak.

**Hardening actions**
- Enforce per-tenant key rotation SLAs and short-lived machine credentials.
- Add anomaly detection for impossible-travel/session-token abuse.

### 2) Tampering
**Threats**
- Mutation of audit rows after insertion.
- Hash-chain break attempts in receipts/evidence structures.
- Silent transformation of export outputs during generation or transport.

**Existing controls**
- Hash-chain receipt subsystem and verification utility in server code.
- Evidence bundle manifest with input/output hashing and schema version markers.
- Migration-level references to audit signing/verification triggers in production schema metadata.

**Residual risks**
- Not all audit logs are currently documented as append-only with WORM retention.
- Export outputs can be copied outside of signed envelopes unless consumers verify signatures.

**Hardening actions**
- Enforce append-only permissions on audit tables (deny UPDATE/DELETE except break-glass role).
- Sign every export artifact + include detached signature in evidence package.

### 3) Repudiation
**Threats**
- Operator denies having run a reconciliation or changed mapping/rules.
- Background job actions become non-attributable across service boundaries.

**Existing controls**
- Audit log entities and usage across scripts/runtime checks.
- Traceable event-style operational docs and runbooks.

**Residual risks**
- Attribution can be weakened when service-role operations do not carry explicit user delegation metadata.

**Hardening actions**
- Require delegated actor metadata (`actor_user_id`, `actor_service`, `trace_id`) on all privileged writes.
- Periodically reconcile control-plane actions against immutable audit ledger snapshots.

### 4) Information Disclosure
**Threats**
- Cross-tenant data leakage via missing tenant predicates or weak RLS policy.
- Sensitive financial payload leakage in logs, exports, or AI prompts.

**Existing controls**
- RLS enablement and policy migrations on critical tables.
- Tenant-membership helper functions and tenant-scoped policy checks.
- Security/privacy docs that prohibit secret/PII leakage and require envelope-safe errors.

**Residual risks**
- Debug/diagnostic scripts with broad DB access can become exfiltration paths in poorly controlled environments.
- AI prompts may include excessive transaction context if redaction is not enforced upstream.

**Hardening actions**
- Introduce static query linting for tenant predicates on all direct SQL paths.
- Add mandatory PII/token redaction middleware before AI prompt assembly.

### 5) Denial of Service
**Threats**
- Reconciliation job floods, replay storms, or expensive export generation bursts.
- Audit verification endpoints abused for computational amplification.

**Existing controls**
- Idempotency key patterns and webhook replay handling guidance.
- Queue-based async architecture (JobForge/Workhorse) to absorb spikes.

**Residual risks**
- Shared queue exhaustion can degrade unrelated tenants.

**Hardening actions**
- Add per-tenant rate quotas and queue fairness scheduling.
- Add cost ceilings and circuit breakers for export generation and AI advisory calls.

### 6) Elevation of Privilege
**Threats**
- Compromised support/admin path used to access tenant-restricted data.
- Misconfigured role claims granting broader table access.

**Existing controls**
- Explicit RBAC permissions and route-level middleware checks.
- RLS policy completion/hardening migrations across key tables.

**Residual risks**
- Privileged operational scripts can become privilege-escalation primitives without just-in-time approvals.

**Hardening actions**
- Enforce PAM/JIT controls for all service-role and super-admin actions.
- Continuous policy diff checks in CI for RLS/function privilege drift.

## Scenario-Focused Findings (Requested)

### Cross-tenant data leakage
- **Risk:** High.
- **Current posture:** Strong baseline (RLS + tenant helper function + policy migrations) but depends on strict policy completeness and no service-role abuse.
- **Priority controls:** Automated RLS regression tests, query-policy drift detection, production deny-by-default for tenant-less queries.

### Audit chain tampering
- **Risk:** High.
- **Current posture:** Tamper-evident mechanisms exist (receipt hash chain, audit signing references), but enterprise-grade immutability controls should be made explicit and independently attestable.
- **Priority controls:** Append-only storage controls, periodic external notarization checkpoint, signed audit exports.

### Reconciliation corruption
- **Risk:** High.
- **Current posture:** Deterministic strategy is documented and represented in schema/config; reproducibility relies on frozen rules/input snapshots.
- **Priority controls:** Mandatory ruleset version pinning + deterministic replay CI gate.

### Export manipulation
- **Risk:** Medium-High.
- **Current posture:** Evidence bundle manifest and schema versioning are present; integrity guarantees are strongest only when consumers verify hashes/signatures.
- **Priority controls:** Contract version pinning, cryptographic export signatures, strict backward-compatibility tests.

### AI advisory hallucination liability
- **Risk:** Medium-High.
- **Current posture:** Advisory pathways and AI integrations exist; legal/safety boundary between advisory and deterministic engine must be contractually explicit.
- **Priority controls:** Non-authoritative labeling, confidence + provenance metadata, hard prohibition on AI-only financial postings.

### Privilege escalation
- **Risk:** High.
- **Current posture:** RBAC exists, but privileged script and service-role execution paths require governance hardening.
- **Priority controls:** Break-glass workflow, full privileged action logging, quarterly access recertification.

## Priority Remediation Plan
1. **P0:** Enforce append-only audit controls + external checkpointing.
2. **P0:** Add CI gate that fails when new SQL paths lack tenant-scope proofs.
3. **P1:** Sign/export manifest with tenant-scoped verification CLI.
4. **P1:** Formalize AI advisory boundary in policy and API contracts.
5. **P2:** Publish quarterly security attestation pack (RLS coverage, replay tests, access recertification).
