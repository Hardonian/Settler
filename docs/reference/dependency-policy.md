# Dependency Policy

## Rules

1. Every dependency must have an active runtime/tooling consumer.
2. Dev-only config dependencies should not exist as separate workspace packages unless they provide clear multi-package value.
3. Optional integrations should not be forced into core runtime install paths.
4. Prefer one canonical dependency per responsibility family unless documented exception exists.
5. Remove stale TS path aliases with no corresponding package/source.

## Canonical choices (current)

- Package manager + lock determinism: `pnpm` with single root lockfile.
- Runtime schema validation: `zod` where contracts require it.
- Monorepo task orchestration: `turbo`.

## Anti-patterns to block

- Skeleton workspace packages with no runtime source or consumer imports.
- Duplicate helper packages split by history rather than architecture.
- Root aliases that point to non-existent package paths.
