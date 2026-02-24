# Security Policy

## Reporting a Vulnerability

If you believe you have found a security issue, report it responsibly.

- **Email:** security@settler.dev
- **Include:** impact, reproduction steps, affected scope, and suggested mitigations.

## Supported Versions

Security fixes are prioritized on the active default branch and currently supported release lines.

## Security Posture Summary

Settler is designed as a multi-tenant reconciliation platform with tenant-scoped access controls, deterministic reconciliation pathways, and tamper-evident audit/evidence mechanisms.

## Core Controls

- **Tenant Isolation:** Tenant context + row-level security policies on critical tables.
- **Access Control:** RBAC permissions and route-level authorization checks.
- **Input Safety:** Runtime validation and structured error envelopes.
- **Webhook Security:** Signature verification + replay/idempotency controls.
- **Auditability:** Audit logging and integrity verification patterns.
- **Secrets Hygiene:** No credential commits; environment templates for configuration.

## Security Claims Language

To avoid overclaiming:

- Settler uses **tamper-evident** controls for audit/evidence integrity.
- “Immutable” claims are only valid where append-only + storage governance controls are enforced and auditable.

## Incident Handling

- Triage severity based on tenant impact, exploitability, and data exposure.
- Contain, remediate, and communicate with affected stakeholders.
- Publish post-incident corrective actions for material incidents.

## Hardening Priorities

1. Continuous RLS/policy drift detection.
2. Append-only enforcement for audit-critical stores.
3. Privileged-access governance (JIT + full audit trail).
4. Signed export verification in enterprise workflows.

## Safe Disclosure

Please do not publicly disclose vulnerabilities before remediation is available.

## Disclosure and Response Expectations

- Initial acknowledgement target: **72 hours**.
- Severity triage target: **5 business days**.
- Coordinated remediation and disclosure timeline is shared with reporter after validation.

## Secret Scanning Baseline

- GitHub secret scanning and push protection are recommended for every fork.
- CI runs gitleaks in `.github/workflows/security.yml`.
- Local pre-commit scanning is recommended before pushing:
  - `gitleaks detect --source . --redact`

## Archive and Input Hardening Expectations

- Archive extraction must reject absolute paths and `..` traversal segments.
- Manifest/capsule ingestion must enforce explicit size limits and schema validation before processing.
- Optional/unsafe plugin or pack execution must require an explicit operator acknowledgement flag.


## Enforced CLI safety controls

- CLI JSON ingestion for capsules/runs/registry manifests is size-limited to reduce memory abuse risk.
- Run/capsule path resolution blocks repository-escape traversal patterns.
- Marketplace install commands are metadata-only and require explicit `--allow-unsafe` acknowledgement before local writes.
