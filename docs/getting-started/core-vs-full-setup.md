# Core vs Full Setup

## Core setup (recommended first)

Use core product surfaces first (`@settler/web`, `@settler/api`, shared runtime libraries).

Typical commands:

```bash
pnpm install
pnpm run build
pnpm run typecheck
```

## Full setup (advanced/integration-heavy)

Includes JobForge adapters, extended QA/security verification, and full workspace checks.

Typical commands:

```bash
pnpm run verify
pnpm run repo-integrity
pnpm run verify:security:full
```

## Notes

- Some advanced checks require external services/credentials.
- Keep optional integrations disabled unless actively needed.
