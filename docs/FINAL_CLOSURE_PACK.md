# Settler Final Strategic Closure Pack

## A) Product Canon

### One-sentence definition

Settler is a deterministic reconciliation engine for ingesting financial records, reconciling them with explicit rules, and producing auditable evidence with operator-managed exceptions.

### Three value props

1. Deterministic, replayable outputs with traceable evidence.
2. High-throughput exception operations with human authority preserved.
3. Contract-first API/SDK surfaces that integrate reconciliation into production controls.

### Elevator pitch

Teams use Settler when spreadsheets and generic data pipelines can no longer satisfy reconciliation accuracy, auditability, and operational scale. Settler gives them deterministic reconciliation runs, explicit exception workflows, and reproducible evidence exports in a single control plane.

### Why now / why this

Financial teams are under simultaneous pressure to close faster, reduce operational risk, and prove decisions to auditors and stakeholders. Generic AI automation and generic ETL do not provide reliable evidence chains. Settler focuses on the narrow wedge where deterministic outputs and policy-aware operations are mandatory.

### Moat paragraph

Settler’s moat is not a single model or integration. It is the combined system: deterministic reconciliation primitives, policy-aware decision boundaries, operator exception lifecycle tooling, and a traceability spine that makes every run reproducible and defensible. This stack increases integration gravity and expands naturally from reconciliation into broader financial controls.

## B) Information Architecture

### Canonical doc map

- `README.md`
- `docs/getting-started/README.md`
- `docs/product/README.md`
- `docs/architecture/README.md`
- `docs/api/README.md`
- `docs/security/README.md`
- `docs/ops/README.md`
- `docs/launch/README.md`
- `docs/archive/README.md`

### Canonical route map

- **Public product:** `/`, `/why-settler`, `/architecture`, `/comparison`, `/pricing`, `/security`, `/docs`
- **App/operator plane:** `/app/*`, `/dashboard/*`
- **Admin plane:** `/admin/*`

### Public vs app vs admin boundary

- Public routes explain value, trust, and integration shape.
- App routes execute ingestion, reconciliation, review, and evidence export workflows.
- Admin routes are privileged operational controls and must remain access-constrained.

### OSS/public/private boundary

OSS includes deterministic core reconciliation, API/web surfaces, and baseline governance. Enterprise layers extend controls and operations but cannot be required for OSS/public route stability.

## C) Contradiction Resolution Log

- Consolidated docs entrypoint to a single canonical map in `docs/README.md`.
- Removed stale docs index references to non-canonical setup files and replaced with active paths.
- Unified product definition language across docs to “deterministic reconciliation engine.”
- Standardized trust-path language around tenant isolation, evidence exports, and graceful degradation.

## D) Launch Narrative Pack

### Homepage section structure

1. Problem: reconciliation drift and opaque operations.
2. Workflow: ingest → normalize → reconcile → review exceptions → export evidence.
3. Output artifact: deterministic run and audit pack.
4. Operator/developer/buyer outcomes.
5. Architecture and trust deep links.

### README structure

1. Product definition
2. OSS vs enterprise boundary
3. Architecture primitives
4. Quickstart + demo + replay
5. Verification and docs map

### Docs landing structure

Reader-oriented entrypoints: engineer, operator, buyer, diligence.

### Demo flow

Run `pnpm demo`, inspect `examples/demo-output/*`, replay with `pnpm settler:replay ...`.

### Buyer trust path

Security posture → access controls/tenancy → incident response → RLS verification → runbooks.

### Developer trust path

Quickstart → API contract → deterministic replay proof → SDK integration.

## E) Residual Risk Register

1. **Legacy documentation sprawl remains in long-tail folders.**
   - Not launch-blocking because canonical map now exists and is linked first.
   - Follow-up: migrate high-traffic legacy docs into canonical folders, then archive remainder.
2. **Public route copy may still include older wording in secondary pages.**
   - Not launch-blocking because canonical product narrative is now centralized.
   - Follow-up: route-by-route copy pass on low-traffic pages.
3. **Comparison and pricing details can drift over time.**
   - Not launch-blocking if pricing page remains source of truth.
   - Follow-up: add docs lint check for canonical terminology and route link consistency.
