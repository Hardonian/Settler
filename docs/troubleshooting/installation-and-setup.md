# Installation and Setup Troubleshooting

## `repo-integrity` fails

Run `pnpm run repo-integrity` and fix the first failing contract:

- missing workspace manifest
- stale script file reference
- missing TypeScript `build` / `typecheck` scripts
- invalid internal workspace dependency reference

## `bootstrap` fails

`bootstrap` runs install + repo-integrity + first-run doctor. Inspect the first failing stage and rerun:

```bash
pnpm run bootstrap
```

If env file generation failed, recreate:

```bash
cp .env.local.example .env.local
```

## `doctor` fails on runtime/toolchain checks

- Use Node 24.x for full parity with declared toolchain targets.
- `pnpm run doctor -- --skip-pipeline --first-run` is for first-run readiness.
- `pnpm run doctor -- --skip-pipeline` is strict and expects fuller env/runtime readiness.

## `dev:stack` does not start cleanly

- Ensure required env exists (`.env.local` created from `.env.local.example`).
- Ensure required backing runtime services are reachable (local DB/Supabase where configured).
- Re-run `pnpm install` then `pnpm run repo-integrity`.

## `pnpm install` fails with EACCES permission errors

EACCES errors typically occur when:

- Files in `node_modules` have incorrect ownership (from switching users or containers)
- The pnpm store has permission issues
- Previous interrupted installs left corrupted state

### Solution: Use the reinstall command

```bash
# Safe reinstall (recommended first attempt)
pnpm reinstall

# Force clear pnpm cache and reinstall (if above fails)
pnpm reinstall:force
```

### Manual fix (if reinstall doesn't work)

```bash
# On macOS/Linux: Fix ownership
sudo chown -R $(whoami) .

# Remove all node_modules and try again
rm -rf node_modules packages/*/node_modules
pnpm install

# If using a shared pnpm store, try clearing it
pnpm store prune
pnpm install
```

### On Windows

If you encounter permission errors on Windows:

1. Run PowerShell as Administrator, OR
2. Enable Developer Mode (Settings → Privacy & Security → For Developers)
3. Then run: `pnpm reinstall`

## `demo` fails

Run with a clean install and generated env first:

```bash
pnpm install
pnpm run bootstrap
pnpm run demo
```
