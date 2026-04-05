# API Family: status

Generated from route inventory. Routes: **2**.

| Method | Path | Criticality | Auth | Tenant | Test | Source |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/status` | medium | no | no | missing | `packages/web/src/app/api/status/route.ts` |
| GET | `/api/status/health` | medium | no | no | missing | `packages/web/src/app/api/status/health/route.ts` |

**Semantic note (canonical):** `GET /api/status/health` returns **`kind: settler.runtime_connectivity`** — point-in-time probes for database, Supabase, and required runtime env. It does **not** return product KPIs, engagement metrics, or historical uptime. See `docs/launch/CLAIMS_AND_EVIDENCE_REGISTRY.md`.