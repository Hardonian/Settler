# Final Reality Map

_Last updated: 2026-03-06_

## 1) Repository truth snapshot

### Root-level classification (high-signal)

- **Canonical runtime/governance**: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`, `CODEOWNERS`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `vercel.json`, `next.config.js`.
- **Canonical product/runtime directories**: `packages/`, `docs/`, `scripts/`, `tests/`, `examples/`, `launch/`, `config/`, `contracts/`, `prisma/`, `supabase/`.
- **Move-to-archive candidates (status/banner style docs)**: `GO_LIVE_COMPLETE.md`, `REALITY_MODE_SUMMARY.md`, `RELEASE_PREP_SUMMARY.md`, `MERGE_SUMMARY.md`, `HARDENING_SUMMARY.md`, `LAUNCH_READY.md`.
- **Likely stale/duplicate narrative docs**: multiple overlapping root launch/readiness markdown files (retain canonical equivalents under `/docs` and archive the rest in phased cleanup).

## 2) Route truth snapshot

Source of truth: `qa/route-registry.json` generated from App Router filesystem scan.

- **Page routes discovered**: 227
- **Route files discovered**: 413
- **Key metadata assets present**: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`

### Critical route reality map

| Route                        | Source file                                   | Purpose                        | In nav/CTA   | Test/Verifier                    | Health            |
| ---------------------------- | --------------------------------------------- | ------------------------------ | ------------ | -------------------------------- | ----------------- |
| `/home` (redirects from `/`) | `packages/web/src/app/page.tsx`               | Primary marketing landing page | Yes          | `node scripts/verify-routes.mjs` | Healthy (200)     |
| `/docs`                      | `packages/web/src/app/docs/page.tsx`          | Docs entry point               | Yes          | `node scripts/verify-routes.mjs` | Healthy (200)     |
| `/pricing`                   | `packages/web/src/app/pricing/page.tsx`       | Pricing / plan path            | Yes          | `node scripts/verify-routes.mjs` | Healthy (200)     |
| `/api/v1/health`             | `packages/web/src/app/api/v1/health/route.ts` | Liveness contract              | Programmatic | `node scripts/verify-routes.mjs` | Healthy (non-500) |
| `/api/v1/ready`              | `packages/web/src/app/api/v1/ready/route.ts`  | Readiness contract             | Programmatic | `node scripts/verify-routes.mjs` | Healthy (non-500) |
| `/api/v1/meta`               | `packages/web/src/app/api/v1/meta/route.ts`   | Metadata/version contract      | Programmatic | `node scripts/verify-routes.mjs` | Healthy (non-500) |

## 3) Route risk findings closed in this pass

- Fixed a verifier regression in `scripts/verify-routes.mjs` (`appRoute` undefined) that could hide route parity failures.
- Added `scripts/verify-route-parity.ts` for manifest-level critical-route regression checks.
- Added `scripts/verify-vercel-runtime-parity.ts` to enforce deployment/runtime invariants.

## 4) Remaining optional cleanup (non-blocking)

- Move redundant launch/status markdown files from root into `docs/archive/` with an index.
- Continue consolidating overlapping docs into canonical entry points (`README`, `docs/getting-started`, `docs/architecture`, `docs/api`, `docs/ops`, `docs/security`).
