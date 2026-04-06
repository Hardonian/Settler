# Integration Recipes (bounded)

This document now distinguishes **verified** and **illustrative** integrations.

## Verified now

- `stripe-basic-adapter` registry entry + executable example:
  - `marketplace/adapters/registry.json`
  - `examples/external-integration/stripe-basic-adapter/smoke.js`
- Verification command: `pnpm run verify:adapters`

## Illustrative only (non-verified)

Any adapter or flow not present in registry + executable example should be treated as illustrative and requires custom validation before buyer claims.
