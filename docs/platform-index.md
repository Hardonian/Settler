# Settler Platform Truth Index

This document is the canonical entry point for understanding, operating, and verifying Settler.

If documentation conflicts, prefer this index and the canonical documents linked in each section.

## 1) Platform Overview

Settler is a deterministic reconciliation platform with a TypeScript control plane, optional Rust kernel compute boundary, operator console, and CLI workflows for replayable verification.

- Product and repository entry: [`README.md`](../README.md)
- Docs hub: [`docs/README.md`](./README.md)
- Platform architecture truth: [`docs/architecture/platform-architecture.md`](./architecture/platform-architecture.md)
- Current launch posture: [`docs/LAUNCH_READINESS_AUDIT.md`](./LAUNCH_READINESS_AUDIT.md)

## 2) Documentation Inventory (Phase 1)

Canonical inventory for core platform operation and architecture:

- [`docs/_meta/platform-document-inventory.md`](./_meta/platform-document-inventory.md)

This inventory tracks document purpose, subsystem coverage, current accuracy, and cross-references.

## 3) Architecture Overview

- Canonical architecture narrative: [`docs/architecture/platform-architecture.md`](./architecture/platform-architecture.md)
- System topology: [`docs/architecture/system-architecture.md`](./architecture/system-architecture.md)
- Data model: [`docs/architecture/data-model.md`](./architecture/data-model.md)
- Reconciliation pipeline: [`docs/architecture/reconciliation-pipeline.md`](./architecture/reconciliation-pipeline.md)
- Kernel boundary: [`docs/architecture/rust-kernel-boundary.md`](./architecture/rust-kernel-boundary.md)

## 4) Capability Registry

Canonical capability map (subsystem, kernel op, CLI path, console surface, enterprise relevance, source docs):

- [`docs/capabilities.md`](./capabilities.md)

## 5) Enterprise Feature Map

- Enterprise enablement controls: [`docs/setup/enterprise-enablement.md`](./setup/enterprise-enablement.md)
- Feature and rollout flags: [`docs/setup/feature-flag-matrix.md`](./setup/feature-flag-matrix.md)
- Enterprise QA and readiness: [`docs/ENTERPRISE_QA.md`](./ENTERPRISE_QA.md)

## 6) Kernel Integration Model

- Kernel integration and guardrails: [`docs/architecture/rust-kernel-boundary.md`](./architecture/rust-kernel-boundary.md)
- Determinism constraints: [`docs/kernel/DETERMINISM.md`](./kernel/DETERMINISM.md)
- CLI runtime surface: [`packages/cli/KERNEL_RUNNER.md`](../packages/cli/KERNEL_RUNNER.md)

## 7) Operational Safety Controls

- Operator runbook (incident + rollback): [`docs/setup/operator-runbook.md`](./setup/operator-runbook.md)
- Incident response playbook: [`docs/INCIDENT_RESPONSE_PLAYBOOK.md`](./INCIDENT_RESPONSE_PLAYBOOK.md)
- Security invariants: [`SECURITY_INVARIANTS.md`](../SECURITY_INVARIANTS.md)
- Tenant isolation verification: [`docs/TENANT_ISOLATION_VERIFICATION.md`](./TENANT_ISOLATION_VERIFICATION.md)

## 8) Environment Configuration Matrix

- Canonical env/secret matrix: [`docs/setup/env-matrix.md`](./setup/env-matrix.md)
- Deployment readiness preconditions: [`docs/setup/deployment-readiness.md`](./setup/deployment-readiness.md)

## 9) Deployment Guide

- Deployment blueprint: [`docs/deployment/DEPLOYMENT_BLUEPRINT.md`](./deployment/DEPLOYMENT_BLUEPRINT.md)
- SRE deployment guide: [`docs/sre/DEPLOYMENT_GUIDE.md`](./sre/DEPLOYMENT_GUIDE.md)
- Route parity verification: [`docs/deployment/route-parity.md`](./deployment/route-parity.md)

## 10) Operator Runbook

- Canonical operator runbook: [`docs/setup/operator-runbook.md`](./setup/operator-runbook.md)
- Operational guide: [`docs/operations/README.md`](./operations/README.md)
- SRE runbook: [`docs/sre/SRE_RUNBOOK.md`](./sre/SRE_RUNBOOK.md)

## 11) Verification and Health Checks

Primary quality gates:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`

Additional operational verification:

- `pnpm run verify:setup`
- `pnpm run settler:doctor`
- `pnpm run kernel:health`
- `pnpm verify`
- `pnpm verify:security:fast`
- `pnpm verify:capability-registry`

## 12) Launch Readiness Status

- Launch readiness audit: [`docs/LAUNCH_READINESS_AUDIT.md`](./LAUNCH_READINESS_AUDIT.md)
- Go-live checklist: [`docs/go-live-checklist.md`](./go-live-checklist.md)
- Deployment checklist: [`docs/DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md)

## 13) Document Consolidation and Cleanup Decisions

- Legacy `docs/DOCUMENTATION_INDEX.md` is superseded and retained only as a pointer to this index.
- Legacy `docs/SOURCE_OF_TRUTH.md`, `docs/ARCHITECTURE.md`, and `docs/ARCHITECTURE_OVERVIEW.md` are compatibility-retained and explicitly superseded.
- Root-level `launch/` files are treated as historical campaign artifacts; canonical launch/readiness docs live in `docs/launch/`.
- Canonical setup guidance is consolidated under `docs/setup/`.
- Canonical architecture guidance is consolidated under `docs/architecture/` with `platform-architecture.md` as the authoritative summary.

## 14) Documentation Governance References

- Governance map: [`docs/_meta/document-governance-map.md`](./_meta/document-governance-map.md)
- Status matrix: [`docs/_meta/document-status-matrix.md`](./_meta/document-status-matrix.md)
- Path normalization notes: [`docs/_meta/path-normalization-notes.md`](./_meta/path-normalization-notes.md)
