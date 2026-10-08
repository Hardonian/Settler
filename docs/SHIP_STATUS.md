# Ship Status Report

**Release Line:** `v1.6.0`  
**Last Updated:** 2026-10-07  
**Status:** 🟢 Hardened Release Candidate — v1.6.0 Baseline Synchronized

---

## 1. Resolved Historical Blockers

1. **Committed node_modules:**  
   - **Resolved.** Verified: `git ls-files '**/node_modules/**'` is empty. CI workflow assertions (`scripts/__tests__/ci-resilience-contract.test.mjs`) enforce that build artifacts and ignored outputs never enter the git index.

2. **Node Version Authority:**  
   - **Resolved.** Node version locked to `>=24.15.0 <25.0.0` (active runtime: Node v24.15.0). Enforced by `scripts/assert-node-version.mjs`.

3. **Toolchain & pnpm Overrides:**  
   - **Resolved.** Deprecated `package.json#pnpm` overrides removed; consolidated into `pnpm-workspace.yaml`. Zero pnpm 10 warnings on invocation.

4. **Package Version Drift:**  
   - **Resolved.** All 26 workspace packages synchronized to `1.6.0` using native `node:fs` glob automation (`pnpm run version:bump 1.6.0`).

5. **Prisma ↔ Supabase Postgres Mapping:**  
   - **Resolved.** Reconciled 520 camelCase/snake_case mapping bugs across 789 fields. Restored operator tables. Baselined 32 verified checksum migrations.

6. **Security & Supply Chain Debt:**  
   - **Resolved.** Cleared 7 advisories (including critical `proxy-addr`, `vue`, `source-map-js`, and `wasmtime` 49.0.2). Enforced strict fail-closed `osv-scanner` CI gate.

7. **Floating Point Matching Precision (FCR-003):**  
   - **Resolved.** Hardened amount matching across web, demo, and API surfaces to enforce integer minor-unit (cents) arithmetic, eliminating IEEE 754 precision drift.

---

## 2. Invariants & Release Engineering Health

- ✅ **Workspaces:** All 26 workspace packages configured and recognized by pnpm.
- ✅ **CI Workflow Integrity:** 13/13 contract tests pass (`pnpm run verify:ci:workflows`).
- ✅ **Security Invariants:** Tenant isolation and RLS guards enforced across all tenant repository models.
- ✅ **Replay Stability:** Relocatable offline replay verified across Windows and Linux.

---

## 3. Definition of Done (DoD) for v2.0.0 Frontier

- [x] Monorepo version synchronization (`1.6.0`)
- [x] Clean git tree with zero committed artifacts or build outputs
- [x] Zero CVE dependency audit gate under strict mode
- [x] Deduplicated pnpm workspace overrides
- [x] Integer minor-unit matching unification across all surfaces
- [ ] Live PostgreSQL cross-tenant isolation negative suite in CI (`pnpm run test:cross-tenant`)
- [ ] Browser-side WASM verification in production operator console (`crates/settler-verify-wasm`)
- [ ] Stripe live test-mode end-to-end reconciliation closure
