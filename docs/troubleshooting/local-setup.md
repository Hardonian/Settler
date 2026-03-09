# Local Setup Troubleshooting

## `pnpm install` fails

- Confirm Node version compatible with workspace expectations.
- Remove stale lock/cache and retry.

## CLI command not found

- Build CLI: `pnpm --filter @settler/cli build`
- Run with workspace execution: `pnpm --filter @settler/cli dev -- --help`

## API not healthy

- Start API dev server: `pnpm --filter @settler/api dev`
- Check `/health` and `/health/ready`.

## Web route mismatch

- Validate API route dynamics: `pnpm --filter @settler/web validate:api-routes`
