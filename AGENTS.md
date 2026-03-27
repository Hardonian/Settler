# Settler – AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service     | Port | Command                                     | Notes                               |
| ----------- | ---- | ------------------------------------------- | ----------------------------------- |
| Next.js Web | 3000 | `cd packages/web && pnpm run dev`           | Marketing site + Developer Console  |
| Express API | 4000 | `cd packages/api && PORT=4000 pnpm run dev` | Requires `.env.local` sourced first |
| PostgreSQL  | 5432 | System service                              | `sudo pg_ctlcluster 16 main start`  |

### Starting the dev stack

1. Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
2. Source env vars: `set -a && source .env.local && set +a`
3. Start API: `cd packages/api && PORT=4000 pnpm run dev`
4. Start Web: `cd packages/web && pnpm run dev`

Or use the combined command: `pnpm run dev:stack` (starts API + Web together).

### Non-obvious gotchas

- **Prisma v7 driver adapter**: The API's `packages/api/src/infrastructure/db/prisma.ts` uses `@prisma/adapter-pg` for the Prisma v7 "client" engine. Without this adapter, PrismaClient throws `PrismaClientConstructorValidationError`.
- **API requires env vars loaded from `.env.local`**: The API validates env vars on startup. Run `set -a && source .env.local && set +a` before starting the API, or use the `dev:stack` script which does this automatically.
- **Redis is optional**: The API falls back to in-memory cache when Redis is unavailable. Redis warnings in the API logs are expected in local dev.
- **TigerBeetle is optional**: Disabled by default (`TIGERBEETLE_ENABLED=false`). The API uses a fallback implementation.
- **Sentry blocks production builds**: The `@sentry/nextjs` v7 plugin runs `sentry-cli` even when `disable: true`. Production builds (`pnpm build`) fail without valid Sentry credentials. Dev mode (`next dev`) is unaffected.
- **Database schema**: The golden schema migration at `supabase/migrations/20240101000000_settler_golden_schema.sql` requires `analytics`, `auth`, and `app_private` schemas pre-created. Run with `BEGIN`/`COMMIT` removed for non-Supabase PostgreSQL.
- **Node.js 24 required**: The `engines` field requires `>=24.0.0 <25.0.0`. Use `nvm use 24` before running any commands.
- **Husky hooks**: Pre-commit runs lint-staged and conflict-marker checks. Pre-push runs `pnpm verify:fast` (release-critical gates only; internal link integrity is `pnpm verify:internal-links` or CI job `verify-internal-links`).
- **`@settler/reconciliation-core`**: Web `package.json` runs `prebuild` → `pnpm --filter @settler/reconciliation-core run build` so `dist/` is current before `next build`; the package is also listed in `transpilePackages` for dev-time resolution.

### Lint / Test / Build

See `CONTRIBUTING.md` and root `package.json` scripts. Key commands:

- Lint: `pnpm lint`
- Test: `pnpm test` (runs all workspace tests via Turborepo)
- API tests: `pnpm --filter @settler/api test`
- Web tests: `pnpm --filter @settler/web test`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build` (blocked by Sentry in production mode; dev mode works fine)
