# Settler Release Status

**Current Production Line:** `v1.6.0` (Deterministic Core & Migration Parity)  
**Target Milestone:** `v2.0.0` (Sovereign Multi-Agent Reconciliation OS)  
**Last Updated:** 2026-10-07

---

## 1. Release Milestone Status

### ✅ v1.6.0: Hardened Deterministic Foundation

- **Database & RLS Parity:** Reconciled 520 camelCase/snake_case Prisma mapping bugs, eliminated initplan query bottlenecks, and established verified checksum migration sequence (`docs/MIGRATION_RECONCILIATION_2026-10-02.md`).
- **Security & Supply Chain:** Cleared all known dependency vulnerabilities to pass strict `osv-scanner` CI gate; patched `wasmtime` to 49.0.2 in `crates/settler-kernel`.
- **Relocatable Replay:** Made cryptographic replay verification cross-platform relocatable (Windows & Linux).
- **Toolchain Alignment:** Unified workspace package versions at `1.6.0` across 26 packages; consolidated overrides under `pnpm-workspace.yaml`.

---

## 2. In-Flight Milestones (Roadmap to v2.0.0)

| ID | Milestone | Target | Blockers / Dependencies |
| :--- | :--- | :--- | :--- |
| **FCR-003** | Matcher Engine Unification | Complete | Consolidate web and API matchers to `@settler/reconciliation-core` |
| **M3** | Durable Orchestration | Q4 2026 | Persist run inputs before execution with BullMQ idempotent retries |
| **M4** | Live DB Multi-Tenant Isolation | Q4 2026 | Automated negative isolation tests against isolated PostgreSQL |
| **M6** | Operator UX Journey | Q4 2026 | End-to-end browser path with truthful degraded state handling |
| **M7** | Stripe Test-Mode Pipeline | Q4 2026 | Live test-mode processor settlement line ingestion |
| **WASM** | In-Browser Proof Verifier | Q4 2026 | Client-side Merkle proof verification via `crates/settler-verify-wasm` |
