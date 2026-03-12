# Platform Documentation Inventory (Canonical Set)

This inventory is the curated operational subset of documentation required to understand and run the platform without guesswork.

For full-repository inventory, see [`docs/_meta/doc-inventory.md`](./doc-inventory.md).

| Document                                     | Purpose                                                                       | Subsystem                | Accuracy status     | Referenced by other docs                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------ | ------------------- | ---------------------------------------------------------------------- |
| `README.md`                                  | Repository-level platform entrypoint and quality gates                        | Platform-wide            | Current             | `docs/README.md`, `docs/platform-index.md`                             |
| `docs/README.md`                             | Documentation hub                                                             | Documentation system     | Current             | `README.md`, `docs/platform-index.md`                                  |
| `docs/platform-index.md`                     | Canonical platform truth index and navigation root                            | Platform-wide            | Current (canonical) | `README.md`, `docs/README.md`, setup/architecture docs                 |
| `docs/architecture/platform-architecture.md` | Unified explanation of kernel, control plane, CLI, console, enterprise layers | Architecture             | Current (canonical) | `docs/platform-index.md`, `docs/architecture/README.md`                |
| `docs/architecture/system-architecture.md`   | System topology and component relationships                                   | Architecture             | Current             | `docs/architecture/platform-architecture.md`                           |
| `docs/architecture/rust-kernel-boundary.md`  | Rust kernel responsibilities, guardrails, fallback model                      | Kernel                   | Current             | `docs/platform-index.md`, `docs/capabilities.md`                       |
| `docs/capabilities.md`                       | Canonical capability registry across API, CLI, console, and kernel            | Product capabilities     | Current (canonical) | `docs/platform-index.md`, `docs/setup/operator-runbook.md`             |
| `docs/setup/env-matrix.md`                   | Canonical environment variable + secret matrix                                | Configuration / Security | Current (canonical) | `docs/platform-index.md`, `docs/setup/operator-runbook.md`             |
| `docs/setup/operator-runbook.md`             | Operational runbook for setup, deploy, health, fallback, rollback             | Operations               | Current (canonical) | `docs/platform-index.md`, `docs/operations/README.md`                  |
| `docs/setup/deployment-readiness.md`         | Deployment preconditions and rollout controls                                 | Deployment               | Current             | `docs/platform-index.md`, `docs/setup/operator-runbook.md`             |
| `docs/setup/feature-flag-matrix.md`          | Runtime feature toggles and rollback implications                             | Runtime controls         | Current             | `docs/platform-index.md`, `docs/setup/operator-runbook.md`             |
| `docs/setup/enterprise-enablement.md`        | Enterprise-only enablement controls and guardrails                            | Enterprise               | Current             | `docs/platform-index.md`, `docs/capabilities.md`                       |
| `docs/operations/README.md`                  | Health endpoints, escalation, and runbook entry points                        | Operations               | Current             | `docs/platform-index.md`                                               |
| `docs/INCIDENT_RESPONSE_PLAYBOOK.md`         | Incident workflow and containment model                                       | Safety / Response        | Current             | `docs/platform-index.md`, `docs/setup/operator-runbook.md`             |
| `docs/TENANT_ISOLATION_VERIFICATION.md`      | Verification evidence for multi-tenant safety                                 | Security                 | Current             | `docs/platform-index.md`, security docs                                |
| `docs/deployment/DEPLOYMENT_BLUEPRINT.md`    | Deployment architecture and assumptions                                       | Deployment               | Current             | `docs/platform-index.md`                                               |
| `docs/sre/DEPLOYMENT_GUIDE.md`               | SRE deployment procedure                                                      | SRE                      | Current             | `docs/platform-index.md`, runbooks                                     |
| `docs/sre/SRE_RUNBOOK.md`                    | Ongoing SRE operations and incident flow                                      | SRE / Operations         | Current             | `docs/platform-index.md`, `docs/setup/operator-runbook.md`             |
| `packages/cli/README.md`                     | CLI command capabilities for operators and automation                         | CLI                      | Current             | `docs/capabilities.md`, `docs/platform-index.md`                       |
| `packages/cli/KERNEL_RUNNER.md`              | Kernel execution integration from CLI                                         | CLI / Kernel             | Current             | `docs/platform-index.md`, `docs/architecture/platform-architecture.md` |
| `scripts/verify-capability-registry.mjs`     | Automated validation for capability registry completeness                     | Verification             | Current             | `package.json` scripts, `docs/platform-index.md`                       |

## Inventory usage

- Add new platform-critical docs here when they become canonical.
- Do not list marketing-only or historical documents unless they are operational dependencies.
- If a canonical target changes, update this table and `docs/platform-index.md` together.
