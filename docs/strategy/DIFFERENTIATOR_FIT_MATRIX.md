# Settler Differentiator Fit Matrix

Last updated: 2026-03-06

## Current capability map

| Capability                            | Status                                   | Evidence                                                              | Gaps / blockers                                                         |
| ------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Trust Graph / Proof Explorer          | Partial                                  | Existing trust route and evidence APIs in web app                     | No unified run lineage + step/policy graph endpoint                     |
| Deterministic Replay Lab              | Partial                                  | Replay route exists for runs and replay verification scripts          | No operator lab UX for override modes and readiness scoring             |
| Failure Intelligence Layer            | **Implemented in this pass (v1)**        | `/api/control-plane/failures` + typed taxonomy and diagnosis engine   | Needs persistence and historical clustering                             |
| Policy Simulator / Governance Sandbox | Partial                                  | Policy verification scripts and policy abstractions exist             | No dedicated sandbox simulation route/UI in console                     |
| BYO Workflow / Adapter Layer          | Partial                                  | Connector routes and adapter package present                          | Mapping UX + completeness diagnostics remain fragmented                 |
| Eval Foundry / Benchmark Harness      | Partial                                  | Foundry verify scripts + CLI available                                | Needs first-class console suite management UX                           |
| Actionable Dashboard insights         | Partial                                  | Console surfaces exist and metrics APIs available                     | Prior dashboard lacked failure-intelligence actions                     |
| Manual / auto triggers                | **Implemented in this pass (manual v1)** | `/api/control-plane/triggers` now executes diagnostics/setup triggers | Auto-trigger policy engine + durable audit store pending                |
| Review/fixer orchestration readiness  | Partial                                  | Existing AI troubleshooting/support routes                            | Needs full org/workspace/project inheritance checks surfaced in console |
| API hardening / no hard-500           | Partial                                  | Security middleware and typed error helpers exist                     | Some legacy routes still return ad-hoc envelopes/statuses               |

## Canonical terminology guidance

Prefer: **Run, Replay, Proof, Policy, Insight, Recommendation, Trigger, Auto-fix, Review, Remediation, Adapter, Exception, Drift, Match/Mismatch, Case, Workspace/Project/Org**.

Avoid introducing new synonyms in user-facing control-plane UI.

## Route inventory additions in this pass

- `GET /api/control-plane/keys`
- `GET /api/control-plane/policies`
- `PATCH /api/control-plane/policies/[policyId]`
- `GET /api/control-plane/metrics`
- `POST /api/control-plane/failures`
- `POST /api/control-plane/triggers`

These routes are now consumed by `/console/control-plane`.
