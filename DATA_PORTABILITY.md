# Data Portability Policy

## Commitment

Settler supports customer-directed data portability for tenant-owned operational and reconciliation data.

## Export Formats

- Structured exports are provided in machine-readable formats (JSON, CSV, and proofpack bundles).
- Evidence artifacts include manifests and cryptographic hashes to support integrity verification.

## Scope of Portable Data

- Reconciliation jobs/runs/results and related metadata
- Tenant-scoped audit and operational records (subject to legal/security constraints)
- Configuration objects required for continuity (where technically feasible)

## Integrity Expectations

- Portability packages should include schema/version identifiers.
- Customers should validate hashes/signatures (when provided) before downstream ingestion.

## Request and Delivery Process

1. Customer submits authenticated portability request through approved support/security channel.
2. Settler verifies requester authorization and tenant ownership.
3. Settler prepares export package and delivery method according to contractual controls.
4. Customer confirms receipt and validation of package integrity.

### Fulfillment SLA

| Request Type | Target Turnaround |
| --- | --- |
| Standard data export (JSON/CSV) | 5 business days |
| Full evidence bundle with proofpacks | 10 business days |
| Emergency / legal hold export | 48 hours |

## Limitations

- Data subject to legal hold, fraud/security investigations, or third-party contractual restrictions may be delayed or partially excluded as legally required.
- Derived analytics or proprietary risk models may be subject to licensing constraints unless contractually included.

## Contact

For portability requests: **[portability@hardonia.store](mailto:portability@hardonia.store)**.
