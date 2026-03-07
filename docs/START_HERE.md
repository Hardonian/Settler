# START_HERE

This is the canonical onboarding index for Settler.

## 1) See value first (recommended)

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

## 2) Core quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 3) Release-grade verification

```bash
pnpm verify
pnpm verify:oss
pnpm verify:routes
pnpm verify:boundaries
```

## 4) Canonical docs

- Product + setup: `README.md`
- Docs hub: `docs/README.md`
- Getting started: `docs/getting-started/README.md`
- Architecture: `docs/architecture/README.md`
- Security: `docs/security/README.md`
- Operations: `docs/ops/README.md`
- API: `docs/api/README.md`

## 5) Verified guarantees

- OSS and enterprise boundaries are guarded by static verification scripts.
- Route and boundary checks are part of release verification scripts.
- Determinism/replay claims are limited to what automated checks verify in current scripts.
