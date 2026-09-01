# Settler

Critical revenue/infra repo in the Hardonia/AIAS sovereign stack.
Reconciliation intelligence and audit operating system — deterministic matching, hash-linked evidence, enterprise-grade tenant isolation.

## Architecture

Monorepo. TypeScript + Rust.

| Package | Role |
| --- | --- |
| `packages/api` | Express 5 control plane — 37 route modules, 46 middleware layers, 80+ services |
| `packages/web` | Next.js 16 operator console — 170+ routes |
| `packages/reconciliation-core` | Deterministic matching engine and run serialization |
| `packages/adapters` | 25+ verified source/target connectors (Stripe, Shopify, QuickBooks, etc.) |
| `packages/cli` | Foundry, replay, verification CLI tooling |
| `packages/types` | Shared TypeScript types |
| `packages/sdk` | Client SDK |
| `packages/proofs` | Proofpack generation utilities |
| `packages/edge-ai-core` | ML matching enhancement (optional) |
| `packages/react-settler` | React component library |
| `crates/settler-kernel` | Rust — CAS, cryptographic hashing, deterministic primitives |
| `crates/settler-verify-wasm` | WASM build for browser-side proof verification |

## Canonical Commands

```bash
# Setup
pnpm run bootstrap          # Create .env.local, install deps, validate
pnpm tb:start               # Start PostgreSQL + Redis + TigerBeetle (Docker)
pnpm dev                    # http://localhost:3000 (console), http://localhost:4000 (API)

# Verification (run before every PR)
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript strict check
pnpm test                   # Unit tests across all packages
pnpm build                  # Full build
pnpm verify                 # Full: lint → typecheck → build → test → integrity
pnpm verify:fast            # Fast: lint → typecheck → env contract → dist freshness

# Security-sensitive changes
pnpm run verify:tenant      # Tenant coverage (must be 100%)
pnpm run test:cross-tenant  # Cross-tenant isolation tests
pnpm run verify:security:fast

# Route, contract, or doc-truth changes
pnpm run verify:surface-docs
pnpm run verify:route-classes-doc
pnpm run verify:api-family-docs

# Determinism changes
pnpm run verify:determinism
pnpm run verify:replay
```

## Code Style Constraints

- **No AI slop or theater.** Concise, professional execution. No over-commenting, filler language, or generic placeholders.
- **Pragmatic Enterprise.** Architecture must be seed-ready, cost-effective (serverless/scale-to-zero), and avoid over-engineering.
- **TypeScript strictness.** Every repository method requires `tenantId`. TypeScript compilation fails if omitted.
- **Determinism by default.** Explicitly mark non-deterministic boundaries.
- **Evidence before claims.** Behavior assertions require tests, script output, or verification artifacts.

## Security Invariants (Non-Negotiable)

1. **Every repository method requires `tenantId`** — enforced by TypeScript interfaces and runtime guards.
2. **Every SQL query on tenant-scoped tables includes `tenant_id` in WHERE** — enforced by `assertTenantScoped()`.
3. **Row-Level Security (RLS) is enabled** on all tenant-scoped tables.
4. **Cross-tenant save is rejected** at the entity level with `Error('Tenant mismatch')`.
5. **Authorization middleware double-checks tenant membership** — 403 if user is not a member of resolved tenant.

Full specification: `SECURITY_INVARIANTS.md`.

## File Classification (Open-Core)

| Classification | Rule | Example Paths |
| --- | --- | --- |
| **OSS_PUBLIC** ✅ | Safe for public mirror | `packages/sdk/`, `packages/cli/`, `examples/` |
| **PLATFORM_PROPRIETARY** 🔒 | Private repo only | `packages/web/`, `packages/api/`, `prisma/` |
| **INTERNAL_BUSINESS** 📊 | Never in public mirror | `docs/internal/`, `strategic/` |
| **SECRET_RISK** ⚠️ | CI fails immediately if detected | `.env` files with real credentials, API keys |

Full rules: `REPO_POLICY.md`.

## Work Classification

Label every pull request as one of:

- **Maintenance** — cosmetic, polish, or consistency work
- **Leverage** — improves operator throughput, verification confidence, release safety, or contract coherence
- **Moat** — compounds reconciliation intelligence, evidence depth, policy memory, or audit trust

## Testing Expectations

- **All PRs**: `pnpm verify` must pass.
- **Security changes**: Add `pnpm run verify:tenant` + `pnpm run test:cross-tenant`.
- **Core engine changes**: Add `pnpm run verify:determinism` + `pnpm run verify:replay`.
- **Route changes**: Add `pnpm run verify:routes` + `pnpm run verify:surface-docs`.
- **No unverified claims** — behavior assertions require tests or verification artifacts.

## Deployment Targets

- **Web console**: Vercel (production), `localhost:3000` (dev)
- **API**: Vercel (production), `localhost:4000` (dev)
- **Local infra**: Docker Compose for PostgreSQL, Redis, TigerBeetle
- **CI**: GitHub Actions (23 workflows)
- **Rust kernel**: Cargo build, WASM target for browser verification

## Env / Secrets Policy

- **Never commit secrets** to the repo. Use `/home/scott/.local/etc/*.env`.
- Bootstrap creates `.env.local` from `.env.local.example` — safe defaults, no real credentials.
- Production secrets are managed via Doppler or Vercel environment variables.
- `.env.example` files are committed and document all required variables.

## Connective Tissue

- Revenue DB: `/home/scott/ai-lab/revenue-os/revenue-os.db`
- Deploy/verify: `/home/scott/ai-lab/scripts/bin/deploy-all.sh`
- Health: `systemctl --user status Settler.*` or port probe
- Ops truth: `python3 /home/scott/.hermes/scripts/ops-nerve-center.py`

## Notes

- Do not duplicate core services.
- Keep secrets out of repo; use `/home/scott/.local/etc/*.env`.
- Extend canonical docs before creating new top-level markdown files.
- If a document is superseded, move it to `docs/archive/`.
