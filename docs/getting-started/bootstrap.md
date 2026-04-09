# Bootstrap

`pnpm run bootstrap` is the canonical first-run setup command, as defined in [SETUP.md](../SETUP.md).

It performs:

1. Create `.env.local` from `.env.local.example` (if missing).
2. Install dependencies (`pnpm install`).
3. Run `pnpm run repo-integrity`.
4. Run `pnpm run doctor -- --skip-pipeline --first-run`.

Bootstrap is idempotent for repeated local runs and keeps core onboarding independent from optional integrations.

For the complete canonical setup sequence, see [SETUP.md](../SETUP.md).
