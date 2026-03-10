# Canonical Internal Event Protocol

This document defines the baseline contract for internal platform events used by execution telemetry, replay, alerting, operator views, support/triage linkage, and webhook-derived flows.

## Canonical envelope

Important internal events must use the `PlatformEvent` envelope in `platform/primitives.ts`.

Required/common fields:

- `eventId`: immutable event identifier
- `eventType`: canonical event taxonomy value (dot-separated)
- `eventVersion`: schema version for the event family (default `1`)
- `occurredAt`: event occurrence timestamp (`ISO-8601`)
- `tenantId`: tenant ownership boundary
- `executionId`: execution linkage (or best available execution scope)
- `correlation`: cross-system correlation block
  - `correlationId` (required)
  - `tenantId` (required)
  - optional links: `traceId`, `causationId`, `runId`, `actorId`, `alertId`, `replayId`, `supportIssueId`
- `source`: producer component (`platform.runtime`, `platform.tests`, etc.)
- `severity`: `debug|info|warning|error|critical`
- `payload`: event-specific fields
- `metadata`: optional producer metadata

## Naming and taxonomy

Event types are dot-separated verbs/nouns with consistent tense:

- lifecycle: `execution.started`, `execution.completed`, `execution.failed`
- connectors: `connector.sync.started`, `connector.sync.completed`, `connector.sync.failed`
- policy: `policy.evaluated`
- replay: `replay.started`, `replay.completed`, `replay.failed`
- alerts: `alert.created`, `alert.status.changed`
- support: `support.issue.created`, `support.issue.linked`
- webhooks: `webhook.received`, `webhook.rejected`
- operator/stream/degraded state: `operator.action.executed`, `stream.event.emitted`, `system.degraded`

## Compatibility and evolution rules

1. **Never silently break existing payloads.**
2. **Bump `eventVersion` for breaking schema changes.**
3. **Prefer additive fields for non-breaking changes.**
4. **Maintain temporary alias normalization for renamed event types.**
5. **Unknown event types must never silently coerce to a business event. Emit `system.degraded` with machine-visible metadata.**
6. **Consumers should parse both canonical and known legacy payload keys during migrations.**

Current alias normalization is implemented in `platform/event-protocol.ts`:

- `connector.sync.succeeded` → `connector.sync.completed`
- `execution.done` → `execution.completed`

## Producer and consumer alignment rules

- Producers should emit canonical fields instead of relying on consumer inference.
- Consumers should call `normalizePlatformEvent()` before routing/processing.
- Correlation fields must be propagated end-to-end (tenant, execution, run, actor where available).
- Tenant filtering must remain based on canonical `tenantId`.

## How to add a new event type safely

1. Add the new type to `PlatformEventType` in `platform/primitives.ts`.
2. Add normalization and alias mapping (if replacing an older name) in `platform/event-protocol.ts`.
3. Update producers to emit the canonical envelope.
4. Update relevant consumers to avoid guessing missing semantics.
5. Add contract tests in `platform/__tests__/event-protocol.test.ts` and targeted consumer tests.

## Anti-patterns

- Ad hoc event names per module for the same domain concept.
- Missing correlation fields on operationally significant events.
- Consumer-only fixes without producer contract updates.
- Breaking payload changes without `eventVersion` handling.

## CI taxonomy guard

Two layers now enforce taxonomy hygiene:

1. **AST lint rule** (`local/event-taxonomy`) in `eslint.config.js` blocks unknown or dynamic event types at authoring time.
2. **CI verifier** `pnpm run verify:event-taxonomy` parses TypeScript AST and fails on unknown event taxonomy usage.

The guard fails when:

- `eventBus.emitEvent("...")` uses an unknown event type.
- `eventBus.emitEvent(...)` uses dynamic event-type expressions.
- `platform/*` event literals use unknown types outside canonical or alias sets.

## Producer migration status

- `packages/api/src/services/recon-core/recon-core-engine.ts` emits canonical reconciliation families directly.
- `packages/api/src/services/support/support-intake-service.ts` emits `support.issue.created` with actor/run correlation context.
- `packages/api/src/services/webhooks/webhook-service.ts` emits `webhook.received` and `webhook.rejected` on delivery flows.
- `packages/api/src/services/alerts/manager.ts` emits `alert.created` and `alert.status.changed` for lifecycle observability.
- `packages/api/src/services/events/event-bus.ts` canonicalizes legacy names, handles v1→v2 adapters, and persists degraded events into operator runtime stream audits.
- Legacy producer names are accepted only through explicit alias mapping; unknown names are converted to `system.degraded` and marked in metadata/payload.

## Merge gate policy

Workflow `.github/workflows/event-protocol-guard.yml` enforces protocol checks on PRs touching event surfaces.

Required checks for those PRs:

- `pnpm run verify:event-taxonomy`
- `@settler/api` event contract tests (`event-bus.contract.test.ts`)
- reconciliation contract regression tests (`ReconciliationService.test.ts`)
