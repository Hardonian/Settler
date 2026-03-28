# @settler/sdk Jest harness

The SDK package mocks **global `fetch`** in `packages/sdk/src/__tests__/setup.ts` (wired via `jest.config.js` `setupFilesAfterEnv`). Tests against `SettlerClient` exercise request construction, retries, and error mapping against deterministic in-process responses — not the public internet.

MSW was removed from this package: MSW v2 depends on ESM-only transitive dependencies that do not run cleanly under the default `ts-jest` + pnpm layout without extra Babel configuration. The fetch mock mirrors the former MSW routes.

When adding client methods that call new HTTP paths, extend `handleFetch` in `setup.ts` so `pnpm --filter @settler/sdk test` stays accurate.
