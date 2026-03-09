# Quickstart

## Fast path

```bash
pnpm run bootstrap
pnpm run doctor -- --skip-pipeline
pnpm run demo
pnpm run dev:stack
```

## Full path

1. Install Node 24.x and pnpm 10.13.1.
2. Run `pnpm run bootstrap`.
3. If anything fails, run `pnpm run doctor` for strict diagnostics.
4. Validate monorepo contract with `pnpm run repo-integrity`.
5. Run the deterministic proof flow with `pnpm run demo`.

## Success criteria

- `repo-integrity` passes.
- `demo` prints run fingerprint + replay verified.
- `dev:stack` starts both API and web workspaces.
