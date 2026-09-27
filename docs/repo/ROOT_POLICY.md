# Repository Root Policy

`pnpm run verify:root` keeps the repository root deliberate and reviewable. The canonical allowlist is `config/root-policy.json`.

## Policy

- Durable source, configuration, and documentation entries must be explicitly allowlisted.
- Git-ignored build, test, cache, and local-tool output is excluded before policy evaluation.
- Non-ignored root entries that are not allowlisted fail verification.
- Root archives and temporary backup extensions fail verification even when allowlisted.
- Generated output belongs in an ignored directory and must not be committed.

The current generated-output locations include `.turbo/`, `artifacts/`, `qa-artifacts/`, `recon_mismatch/`, `recon_output/`, `scratch/`, `playwright-report/`, and `test-results/`.

## Contributor workflow

1. Run `pnpm run verify:root` before opening a pull request.
2. Relocate unexpected files into an existing canonical directory when possible.
3. Add a root entry to `config/root-policy.json` only when it is intentional and durable.
4. Never allowlist generated output to silence the gate; add it to `.gitignore` instead.
