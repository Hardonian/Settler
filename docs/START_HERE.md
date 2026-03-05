# START_HERE

This is the canonical onboarding index for Settler.

## 1) What to run first

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 2) Release-grade verification

```bash
pnpm verify
pnpm verify:oss
pnpm verify:routes
pnpm verify:boundaries
```

## 3) Canonical docs

- Product + setup: `README.md`
- Architecture: `docs/ARCHITECTURE.md`
- Security: `docs/SECURITY.md`
- Operations: `docs/OPERATIONS.md`
- API: `docs/API.md`
- Audit package: `docs/audit/*`

## 4) Guarantees (verified scope)

- OSS and enterprise boundaries are guarded by static verification scripts.
- Route and boundary checks are part of release verification scripts.
- Determinism/replay claims are limited to what automated checks verify in current scripts.
