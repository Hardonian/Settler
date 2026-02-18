# Event Model

Settler CLI now uses a deterministic event envelope (`schemaVersion: 2026-02-18`) for capsule, proof, flow, lineage, explain, arena, and operator surfaces.

## Guarantees

- Deterministic ordering: events sorted by `sequence`, then timestamp/type.
- Stable serialization: canonical key ordering before hashing.
- Redaction-safe portability: tenant IDs represented as hashed `tenantRef` in capsule artifacts.
- Backward-safe evolution: schema version pinned in each envelope.
