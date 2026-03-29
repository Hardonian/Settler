# Settler Repo Operating System (Repo-OS)

Status: **CANONICAL**  
Owner: Platform Engineering  
Last updated: 2026-03-29

Settler is not a generic CRUD app. It is a reconciliation-intelligence and exception/evidence operating system. This Repo-OS defines how humans and agents must execute work so the platform remains truthful, tenant-safe, deterministic, and compounding.

## 1. Canonical ownership map

- **Agent execution contract:** `AGENTS.md` (root)
- **Product/behavior doctrine:** `MODEL_SPEC.md` (root)
- **Contribution + quality gates:** `CONTRIBUTING.md` (root)
- **Repo-OS operating doctrine (this file):** `docs/repo-os/README.md`
- **Verification policy + command matrix:** `docs/repo-os/verification-matrix.md`
- **Execution checklist/report format:** `docs/repo-os/checklists/implementation-pass.md`
- **Reusable execution prompt header:** `prompts/IMPLEMENTATION_EXECUTION_HEADER.md`

If guidance conflicts, resolve in this order: `AGENTS.md` → `MODEL_SPEC.md` → `docs/repo-os/*` → `CONTRIBUTING.md` → other docs.

## 2. No-theatre rules

1. Never claim security, tenancy, determinism, or release readiness without local evidence.
2. Never hide degraded states. Expose them as explicit, machine-visible status and document fallback behavior.
3. Never introduce cross-tenant access paths (including cache key bleed, inferred metadata, or admin bypass assumptions).
4. Never ship silent contract drift across API routes, event schemas, route classes, policy outcomes, or evidence exports.
5. Never prioritize cosmetic cleanup over operator truth, reconciliation intelligence, evidence quality, or release-critical verification.

## 3. Hard architectural invariants

1. **Canonical run/detail truth**: every run has a deterministic, inspectable detail surface with provenance and timestamps.
2. **Operator truth first**: UI copy and API responses must differentiate `verified`, `degraded`, `unknown`, and `not-run` states.
3. **Deterministic behavior**: replayable decisions, stable identifiers, and explicit non-deterministic boundaries.
4. **Tenant isolation by default**: all read/write paths, queues, cache entries, and exports are tenant scoped.
5. **Evidence before claims**: new behavior must add or update tests, verification commands, or evidence artifacts.
6. **Fallback path correctness**: optional systems (Redis, TigerBeetle, external services) require truthful fallback semantics.

## 4. Trust, tenancy, and degraded-state doctrine

### Tenant/trust boundaries

- Tenant identity must be asserted at route boundaries and preserved through service/repository layers.
- Admin functionality must still be least-privilege and auditable; no implicit global reads.
- Any new shared cache/storage surface requires tenant key partitioning and tests.

### Auth, RLS, and least privilege

- RLS and authorization must be verified by command surfaces already in the repo (`verify:tenant`, cross-tenant tests, RLS evidence scripts).
- Security checks must clearly state whether they are static guardrail checks or runtime validation.

### Truthful degraded states

- Degraded mode is valid only when it is explicit and operator-visible.
- Degraded responses must contain enough context for triage (what failed, what fallback was used, whether correctness is reduced).
- Do not surface fallback success as full success.

## 5. Contract drift prevention

Before merging changes that affect routes, schemas, policies, or docs tied to claims:

- run surface verification commands (`verify:surface-docs`, `verify:route-classes-doc`, `verify:api-family-docs`, `verify:routes`);
- update canonical docs when behavior changed;
- include exact commands in implementation reports.

## 6. Work classification system

Every non-trivial implementation pass must classify itself:

- **Maintenance**: polish/consistency/cosmetic cleanup not materially improving truth, evidence, tenancy, or moat.
- **Leverage**: improves operator throughput, release confidence, verification quality, contract coherence, or safety posture.
- **Moat**: creates compounding reconciliation intelligence, evidence depth, policy memory, workflow lock-in, or audit trust.

If work is marked **Moat**, include explicit compounding loop impact in the report.

## 7. Feature pressure-test (required for major features)

1. What will Settler know after sustained usage that a clone cannot infer from UI behavior?
2. Which exception/adjudication/policy outcomes are captured as reusable institutional memory?
3. How does the feature strengthen evidence/proofpack quality and audit trust?
4. How does it increase workflow centrality and switching cost?
5. Which tenant-isolation and degraded-state failure modes were tested?

## 8. Common failure modes to guard against

- Cross-tenant data path leaks (queries, joins, cache keys, export jobs).
- Claiming “verified secure” based only on static checks.
- Non-deterministic run semantics hidden behind success statuses.
- Evidence artifacts not matching current runtime behavior.
- “Green build” claims without route/policy/security verification surfaces.

## 9. Anti-patterns

- “Follow existing patterns” without citing files/tests/scripts.
- Introducing new canonical docs without linking from `docs/README.md` or this Repo-OS map.
- Duplicating execution rules across random docs instead of extending canonical Repo-OS files.
- Reusing historical archived prompt text as active instruction.

## 10. Required implementation report sections

All implementation passes should report using the template in `docs/repo-os/checklists/implementation-pass.md`:

1. Executive summary
2. What was already present
3. Root gaps found
4. Files changed
5. Canonical ownership decisions
6. Verification run (commands + pass/fail/warn)
7. Remaining gaps / follow-ups
8. Next highest-leverage task
