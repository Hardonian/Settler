# Route Surface Map

_Last verified: 2026-03-09_

## Sources used

- `pnpm run build` (`@settler/web` Next.js route manifest in build output).
- `pnpm run verify:routes` (runtime probe of critical routes).
- `packages/api/src/routes/**` + `packages/web/src/app/api/**` file inventory.

## Route families

- **Web app pages**: Next.js app routes under `packages/web/src/app/**` (dynamic + static).
- **Web API routes**: Next.js handlers under `packages/web/src/app/api/**/route.ts`.
- **Core API service**: Express handlers under `packages/api/src/routes/**` mounted via `packages/api/src/routes/v1/index.ts`.

## Handler parity status

- Declared Next.js routes are compiled into build manifest (no orphan route entries observed in build output).
- `verify:routes` completed without hard-500 responses on critical public and `/app` probes.
- Method mismatch handling for API routes is provided by framework defaults (405/404), with app-level Problem+JSON wrappers used for explicit API errors in Settler handlers.

## Error and tenancy notes

- API tests include tenant-isolation and route-inventory checks (`packages/api/src/__tests__/multi-tenancy/*`, `route-inventory.test.ts`).
- Runtime checks show graceful degradation behavior for missing optional integrations (e.g., env-dependent systems) rather than hard 500 on user routes.

## Residual risk

- Full exhaustiveness against every generated route is large; operational verification currently relies on targeted route probes plus build-time manifest generation.
- Continue extending `scripts/verify-routes.mjs` coverage set as new public routes are added.
