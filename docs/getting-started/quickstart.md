# Quickstart

## Fast path (core local)

```bash
pnpm run bootstrap
pnpm run demo
pnpm run dev:stack
```

## Full path

1. Install Node 24.x and pnpm 10.13.1.
2. Run `pnpm run bootstrap`.
3. Re-run `pnpm run repo-integrity` to validate monorepo contract manually.
4. Run `pnpm run doctor -- --skip-pipeline` for strict diagnostics once env/runtime services are available.
5. Run `pnpm run demo` to validate deterministic execution + replay proof.

## Success criteria

- `repo-integrity` passes.
- `doctor --first-run` passes.
- `demo` prints run fingerprint + replay verified.
- `dev:stack` starts API and web processes (with required local runtime dependencies available).
