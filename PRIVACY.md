# Privacy Notice

## Scope
This notice describes how Settler handles data for reconciliation services, exports, and optional advisory features.

## Data Categories
- Account/profile metadata (organization, users, roles)
- Operational reconciliation metadata (jobs, runs, statuses, counters)
- Tenant-provided financial records required for reconciliation
- Security telemetry (auth events, audit logs, trace IDs)
- Optional advisory inputs/outputs (when enabled by customer configuration)

## Processing Principles
- Data minimization: process only fields necessary for service delivery.
- Purpose limitation: reconciliation, operations, security, and customer-directed exports.
- Tenant separation: data access is scoped by tenant permissions and database policies.

## Retention and Deletion
- Retention windows should be configured according to contractual and legal requirements.
- Customers may request deletion/export according to the data portability process.
- Legal hold obligations override deletion where required by law.

## AI Advisory Processing
- Advisory features are optional and non-authoritative.
- Customers are responsible for enabling/disabling advisory features per policy.
- Sensitive fields should be redacted/minimized before advisory processing.

## Security Controls
- Access controls, tenant scoping, and audit logging are used to protect data.
- Secrets must not be committed to source control.
- Incident response and vulnerability handling follow repository security policy.

## Contact
For privacy inquiries or data rights requests: **privacy@settler.dev**.
