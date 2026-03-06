# API and SDK

## Contract-first API summary

Settler API exposes deterministic reconciliation workflows across connections, pipelines, runs, results, rules, and review operations.

## Developer trust path

1. Read API reference: [`docs/API.md`](../API.md)
2. Run deterministic demo: [`docs/demo.md`](../demo.md)
3. Validate replay contract: [`docs/determinism.md`](../determinism.md)
4. Integrate with SDKs (`packages/sdk`, `packages/react-settler`, `packages/sdk-go`, `packages/sdk-python`)

## Operational API concerns

- Idempotency and retries are required for production ingestion and webhooks.
- Failure paths should emit explicit errors and preserve evidence continuity.
- Tenant boundary checks are mandatory at every read/write surface.
