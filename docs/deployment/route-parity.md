# Route Parity and Runtime Parity

This repository now has explicit launch checks for route and deployment parity.

## Commands

- `pnpm qa:routes` – regenerates `qa/route-registry.json` from the Next.js App Router filesystem.
- `tsx scripts/verify-route-parity.ts` – verifies required public/product routes are present in the route manifest.
- `tsx scripts/verify-vercel-runtime-parity.ts` – verifies Vercel + Next.js runtime invariants (monorepo build alignment and Stripe webhook Node runtime pinning).
- `node scripts/verify-routes.mjs` – boots the web app and ensures critical routes never hard-500.

## Why this exists

The objective is to prevent regressions where:

1. A nav/CTA route is removed but links still exist.
2. Runtime-sensitive routes (e.g. Stripe webhook) silently drift away from Node.js.
3. Critical pages or API health endpoints return hard-500 in prod-like startup.

## CI integration recommendation

Add these commands to launch gating jobs in this order:

1. `pnpm qa:routes`
2. `tsx scripts/verify-route-parity.ts`
3. `tsx scripts/verify-vercel-runtime-parity.ts`
4. `node scripts/verify-routes.mjs`

If any command fails, treat it as a release blocker.
