# Operator Control Plane

## Overview

Settler's operator control plane is implemented as a tenant-aware surface spanning:

- **Operator UI**: `packages/web/src/app/console/control-plane/page.tsx`
- **Operational API endpoints**: `packages/web/src/app/api/control-plane/*`
- **Telemetry query backend**: `packages/web/src/lib/metrics/repository.ts`
- **Tenant and auth boundaries**: API key auth (`authenticateApiKey`) + Supabase session fallback.

The control plane is designed to operate as a real operations surface (no simulated dashboards), with graceful failure semantics and tenant isolation.

## Navigation Model

Primary operator navigation should expose:

1. Dashboard
2. Executions
3. Proof Explorer
4. Replay Lab
5. Failures
6. Policies
7. Tenants
8. Reports
9. Settings

Implementation note: these routes can be composed from `/app/*` and `/console/*` surfaces, but must preserve tenant-scoped access decisions.

## Core Subsystems

### 1) Metrics and Analytics

- `GET /api/control-plane/metrics` returns tenant-scoped metrics snapshot.
- Backed by `run_metrics`, `request_metrics`, `economic_metrics`, `drift_metrics`, and `policy_metrics` via `getMetricsSummary`.
- Includes machine-readable metadata:
  - `trace_id`
  - `timestamp`
  - `component`
  - `event_type`

### 2) Policy Operations

- `GET /api/control-plane/policies`
- `PATCH /api/control-plane/policies/[policyId]`

Policies are intended to be immutable-by-default with explicit operator toggles and auditable mutation paths.

### 3) Failure Intelligence

- `POST /api/control-plane/failures`
- Produces categorized failure insights and remediation guidance from system state.

### 4) API Key Operations

- `GET /api/control-plane/keys`
- `POST /api/control-plane/triggers`

Key actions must be logged via audit primitives and scoped by tenant policy.

## Isolation and Security Invariants

- All control-plane reads and writes require tenant context.
- No cross-tenant aggregation may be returned to non-admin users.
- Security wrappers (`withSecurity`) are mandatory for API routes.
- Graceful degradation: APIs return explicit degraded payloads instead of hard-500 behavior.

## Operational Readiness Checklist

- [ ] Metrics endpoints resolve tenant identity from auth context.
- [ ] Dashboard cards are populated from telemetry tables, not environment heuristics.
- [ ] Policy and key mutations emit audit events.
- [ ] Export/report actions enforce tenant predicates at query layer.
- [ ] QA coverage includes tenant-boundary regressions.
