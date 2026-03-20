# Core vs Full Setup

## Core setup (recommended first)

Use core product surfaces first (`@settler/web`, `@settler/api`, shared runtime libraries).

Follow the canonical setup sequence defined in [SETUP.md](../SETUP.md) for the most reliable experience.

## Full setup (advanced/integration-heavy)

Includes JobForge adapters, extended QA/security verification, and full workspace checks.

After completing the canonical setup sequence, run:
```bash
pnpm run verify
pnpm run repo-integrity
pnpm run verify:security:full
```

## Notes

- Some advanced checks require external services/credentials.
- Keep optional integrations disabled unless actively needed.
- Always begin with the canonical setup sequence before running full verification.