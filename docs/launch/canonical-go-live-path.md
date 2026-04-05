# Canonical go-live path (solo operator)

Status: **CANONICAL**  
Last updated: 2026-04-05

This is the single entry path for production launch, rollback, and day-2 rhythm. Other checklists (`docs/go-live-checklist.md`, `docs/launch/launch-checklist.md`) are supplementary; when they disagree with runtime-verified commands below, **this file wins** for “what to run next.”

## What “launch-ready” means here

- **Repository gate:** lint, typecheck, build, and tests pass in your environment; production secrets and cloud reachability are **your** responsibility.
- **Truth:** `/api/status` and `/api/status/health` report **point-in-time connectivity** (database, Supabase, required env). They do **not** prove historical uptime, SLA, RPO/RTO, or compliance.

## 0) Preconditions

- Node `>=24 <25` (see root `package.json` / `pnpm run check:node`).
- PostgreSQL for API when running full stack (`AGENTS.md` — Cursor Cloud table).
- `.env.local` or deployment env populated (never commit secrets).

## 1) Preflight (local / CI)

Run in order:

1. `pnpm run verify:setup` — workspace and tooling expectations.
2. `pnpm run doctor` — first-time: `pnpm run doctor -- --first-run` (see `package.json`).
3. `pnpm run validate:env` or `pnpm run validate:env:runtime` — typed env validation where applicable.
4. `pnpm run repo-integrity` — package/workspace integrity.

## 2) Secret / env validation

- `pnpm run validate:env:build` before builds that embed env.
- `pnpm run validate:env:runtime` for runtime-required variables.
- Billing / webhooks: `pnpm run validate:billing` when Stripe or billing paths changed.
- Do not treat “build passed” as “secrets populated in production.”

## 3) Staged deploy

- Deploy **web** and **API** per your host (Vercel, etc.); use `pnpm run vercel:preflight` when on Vercel.
- Record git SHA and migration version deployed.
- Prefer canary or single-tenant pilot before full traffic.

## 4) Smoke verification (post-deploy)

- `pnpm run test:smoke` against `NEXT_PUBLIC_APP_URL` (hits `/api/v1`, `/api/status/health`, billing-surface checks).
- `curl` or monitor: `GET /api/status` — expect `operational` or explicit `degraded` with reasons, never silent success on broken deps.
- `GET /api/status/health` — expect JSON with `kind: settler.runtime_connectivity` and `healthy: true|false`.

## 5) Rollback

- Revert to previous deployment revision in your platform (Vercel rollback, k8s previous image, etc.).
- If schema migrated forward: have a **reverse migration plan** or restore from backup before re-deploying old code (documented per environment).
- Re-run smoke from step 4 on rolled-back revision.

## 6) Degraded-mode controls

- Treat `degraded` from status endpoints as **operator-visible truth**, not an error to hide.
- Redis / TigerBeetle / optional services: expect explicit fallbacks per `AGENTS.md` (no silent correctness claims).

## 7) Incident — first hour

1. Confirm scope: `/api/status`, `/api/status/health`, error tracker (e.g. Sentry), DB connectivity.
2. Classify: **data path** vs **auth/tenant** vs **billing** vs **third-party**.
3. Stabilize: scale, rollback, or disable non-critical features per runbook.
4. Communicate: internal status only; do not invent uptime or RCA before evidence.

## 8) Day-2 operator rhythm

- Daily: skim errors, failed webhooks, reconciliation run failures.
- Weekly: `pnpm run verify:fast` or full profile from `docs/repo-os/verification-matrix.md` after material merges.
- After schema or policy changes: `pnpm run verify:tenant` and determinism/replay commands per matrix.

## 9) Founder unavailable 24–48h

- On-call must have: platform login, DB backup location, rollback steps above, and support alias.
- Without that, **safe mode** is freeze deploys, preserve logs, and restore from last known-good backup — not speculative schema fixes.

## Related canonical docs

- Verification commands: `docs/repo-os/verification-matrix.md`
- Claims vs evidence: `docs/launch/CLAIMS_AND_EVIDENCE_REGISTRY.md`
- Enterprise buyer context: `docs/launch/enterprise-buyer-pack.md`
