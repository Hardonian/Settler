# OSS vs Cloud/Enterprise

Settler is open-core: the OSS repository is fully runnable in self-hosted mode, and Cloud/Enterprise adds managed operations and premium controls without changing OSS determinism semantics.

## Feature matrix

| Capability                                                                | OSS (this repo)             | Cloud/Enterprise       |
| ------------------------------------------------------------------------- | --------------------------- | ---------------------- |
| Deterministic reconciliation core (connections, pipelines, runs, results) | ✅                          | ✅                     |
| Review queue + audit trail basics                                         | ✅                          | ✅                     |
| Marketing site + docs routes                                              | ✅                          | ✅                     |
| Enterprise route group (`/enterprise`)                                    | Optional code paths, gated  | ✅ Managed and enabled |
| Advanced governance / premium ops controls                                | Limited / OSS-safe defaults | ✅                     |
| Managed hosting and enterprise support                                    | Self-host                   | ✅                     |

## Boundary rules

### Imports

- OSS modules must never import from enterprise-only modules.
- Marketing routes must never import app-auth-only modules.
- Enforcement script: `pnpm verify:boundaries`.

### Runtime gating

- Site mode defaults must keep OSS routes functional when enterprise variables are absent.
- Enterprise route behavior must remain gated and optional.
- OSS verification command: `pnpm verify:oss`.

### Environment separation

#### OSS environment variables

- `SITE_MODE=oss`
- `NEXT_PUBLIC_SITE_MODE=oss`
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Enterprise-only environment variables (names only)

- `ENTERPRISE_SITE_URL`
- `NEXT_PUBLIC_ENTERPRISE_SITE_URL`

## Run OSS with enterprise environment absent

Use the repository verification wrapper to force OSS mode and explicitly unset enterprise-only variables:

```bash
pnpm verify:oss
```

This command must pass with `ENTERPRISE_SITE_URL` and `NEXT_PUBLIC_ENTERPRISE_SITE_URL` unset.
