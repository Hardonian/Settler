# Doctor

## Commands

- First-run friendly: `pnpm run doctor -- --skip-pipeline --first-run`
- Strict local diagnostics: `pnpm run doctor -- --skip-pipeline`
- Full (includes lint/typecheck/build): `pnpm run doctor`

## Checks performed

- Toolchain/runtime
- Environment readiness
- Next/Vercel/TypeScript/ESLint config loading
- Runtime safety scan for hard `500` responses
- Pipeline checks (unless skipped)

Doctor output is grouped and actionable; failures include next-step hints.
