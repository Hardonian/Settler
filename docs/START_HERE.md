# START HERE

If you are new to Settler, follow this sequence.

## 1) See value first

```bash
pnpm install
cp .env.example .env
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
pnpm demo
pnpm settler:replay examples/demo-output/evidence.json
```

What this proves:

- You can execute a reconciliation run locally.
- You can inspect mismatches and evidence artifacts.
- You can replay the same run to verify deterministic behavior for that dataset + ruleset.

## 2) Run quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 3) Run release verification

```bash
pnpm verify
pnpm verify:oss
pnpm verify:routes
pnpm verify:boundaries
```

## 4) Canonical docs

| Path | Purpose |
|------|---------|
| [README.md](../README.md) | Product overview and quickstart |
| [docs/INDEX.md](./INDEX.md) | Full documentation map |
| [docs/ENGINE.md](./ENGINE.md) | How the reconciliation engine works |
| [docs/positioning/CANONICAL_POSITIONING.md](./positioning/CANONICAL_POSITIONING.md) | What Settler is and who it's for |
| [docs/getting-started/README.md](./getting-started/README.md) | Getting started guide |
| [docs/architecture/README.md](./architecture/README.md) | Architecture deep dive |
| [docs/security/README.md](./security/README.md) | Security documentation |
| [docs/api/README.md](./api/README.md) | API and SDK reference |
| [docs/ops/README.md](./ops/README.md) | Operations and runbooks |

## 5) Verified guarantees

- OSS and enterprise boundaries are guarded by static verification scripts.
- Route and boundary checks are part of release verification scripts.
- Determinism/replay claims are limited to what automated checks verify in current scripts.
- All claims are validated in [docs/positioning/CLAIM_VALIDATION.md](./positioning/CLAIM_VALIDATION.md).
