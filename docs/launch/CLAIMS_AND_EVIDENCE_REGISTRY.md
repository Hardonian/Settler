# Claims and evidence registry (canonical mapping)

Status: **CANONICAL**  
Last updated: 2026-04-05

## Code owner

- **Registry:** `packages/web/src/lib/claims.ts` — high-stakes marketing and trust claims (`proven` | `documented_target` | `planned` | `deprecated`).
- **Runtime trust (connectivity only):** `packages/web/src/lib/status/runtime-connectivity-health.ts` + `GET /api/status`, `GET /api/status/health`.
- **Public reality payload (metrics, not SLA):** `packages/web/src/lib/public/reality-data.ts` + `GET /api/public/reality`.

## Rules

1. **`proven`** requires machine-verifiable or audit-backed evidence today; link or script name in claim notes.
2. **`documented_target`** = engineering or operational intent, **not** a customer SLA until contracted and monitored.
3. **Never** derive uptime % from a single counter (e.g. zero `hard_500_count` ≠ 99.9% availability).
4. **RLS** = product control mechanism; it is **not** a substitute for a customer’s security assessment or compliance attestation.

## Status endpoint semantics (avoid drift)

| Surface                   | Proves                                      | Does not prove                                   |
| ------------------------- | ------------------------------------------- | ------------------------------------------------ |
| `GET /api/status/health`  | DB + Supabase + env probe at request time   | 30-day uptime, incidents, regions, RPO/RTO       |
| `GET /api/status`         | Same probes + coarse subsystem labels       | End-to-end reconciliation correctness per tenant |
| `GET /api/public/reality` | Optional `reality_*` tables when configured | SOC2, PCI, durability “11 nines”                 |

## Pilot / procurement

Use measurable thresholds in `docs/launch/enterprise-buyer-pack.md` (pilot rubric). Do not cite this file as legal or contractual warranty.
