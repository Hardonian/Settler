# Workspace Contracts

## Required workspace truths

- Every active workspace must have a valid `package.json`.
- Internal workspace dependencies must resolve to real workspace packages.
- Script references must target existing files.
- Package category determines required scripts (build/typecheck/lint/test as applicable).

## Contract enforcement

Primary checker: `pnpm run repo-integrity`.

Known current baseline caveat: repository has pre-existing integrity failures outside this pruning pass; these remain to be resolved separately.

## Dependency contract

- Do not add dependency edges without consumer evidence.
- Do not keep dead workspace packages in active graph.
- Keep TS path aliases synchronized with real packages.
