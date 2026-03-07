# Launch Artifact Capture

Launch artifact generation supports primary browser capture plus deterministic fallback so release verification does not depend on one fragile runtime assumption.

## Commands

| Command                            | Mode     | Behavior                                                                                           |
| ---------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `pnpm run capture:launch`          | auto     | Try Playwright screenshots first, then fallback capture if browser launch fails.                   |
| `pnpm run capture:launch:primary`  | primary  | Require Playwright screenshot capture. Fails without fallback.                                     |
| `pnpm run capture:launch:fallback` | fallback | Skip browser and capture canonical launch documents + metadata from `launch/assets-manifest.json`. |
| `pnpm run verify:artifacts`        | verify   | Validate latest launch manifest, capture origin metadata, and every referenced file.               |

## Output layout

- Run directory: `artifacts/launch/<run-id>/`
- Canonical pointer: `artifacts/launch/latest.json`
- Run manifest: `artifacts/launch/<run-id>/manifest.json`

Manifest fields include:

- `mode`: selected capture mode (`primary` / `fallback`)
- `origin`: actual artifact provenance (`primary-playwright` / `fallback-launch-manifest`)
- `primaryFailure`: reason primary capture failed before fallback (if fallback used)
- `route` list, generated `artifacts`, and diagnostics

This prevents release reports from overstating screenshot provenance when fallback was used.

## Route config

Route targets are configured in `launch/capture-routes.json`.

## Failure behavior

The pipeline fails loudly if:

- no artifacts are produced,
- fallback source assets are missing/empty,
- manifest marks capture unsuccessful,
- verify step finds missing or empty artifacts,
- fallback mode lacks explicit primary failure diagnostics.
