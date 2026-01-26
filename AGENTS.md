# AGENTS.md — Settler.dev

This file defines **hard constraints** for any code agent (OpenCode/Codex/Claude/etc.) operating in this repository. Treat it like an execution contract.

## 0) Prime directive
- **Ship working code, not advice.**
- **No hard 500s.** Routes must degrade gracefully (error boundaries, empty states, notFound).
- **Do not silence errors.** Fix root causes.
- **Preserve invariants**: architecture, security, tenant isolation, and runtime expectations.

## 1) Repo identity (OSS-first)
Settler is **open source first**:
- Public marketing/docs **must be readable without auth**.
- “Run locally / Self-host” is the primary path; Cloud is optional.
- Avoid enterprise-only UX patterns (forced sign-in walls, sales-gated docs).

## 2) Stack assumptions
Unless this repo explicitly differs:
- **Next.js App Router**, **TypeScript**, **Tailwind**
- **shadcn/ui** primitives for UI components
- **Supabase Postgres + RLS** (Row Level Security) for data protection
- **Stripe** for billing (Node runtime for webhooks; raw-body verification required)
- **Vercel** deploy target

## 3) Route groups + access rules
- `app/(marketing)/**` → always public, SEO-safe, no auth redirects
- `app/(app)/**` → authenticated, protected by middleware + server checks
- Auth enforcement must be **defense in depth**:
  - Middleware blocks unauthorized access
  - Server components / server actions verify session + tenant

## 4) Security invariants (do not break)
- **Least privilege** everywhere.
- **Tenant isolation** is mandatory:
  - Enforce via Supabase RLS AND server-side checks.
- Never leak secrets to client bundles.
- Never log credentials, tokens, or PII.
- Prefer `zod` (or existing validator) for input validation at all boundaries.

## 5) Data + migrations
- Database changes must be shipped as **explicit migrations**.
- If using Supabase migrations:
  - Include reversible statements where possible.
  - Update RLS policies alongside schema changes.
- Never “fix” by disabling RLS.

## 6) Stripe + billing rules
- Webhooks must run on **Node runtime** and verify **raw body** signatures.
- Never trust client state for billing entitlements.
- Feature access decisions must be verified server-side.

## 7) UI/UX standards
- Mobile-first, Chrome mobile safe:
  - Tap targets ≥ 44px, no horizontal scroll, no overflow traps.
- Accessibility:
  - keyboard navigation, visible focus states, ARIA labels for menus/dialogs.
- Use design tokens consistently (Tailwind + CSS vars).
- Prefer shadcn patterns; avoid one-off component styles.

## 8) Quality gates (must pass before declaring done)
Always run the repo’s scripts (discover from `package.json`). Typical order:
1. Install: `pnpm install` (or repo-defined package manager)
2. Lint: `pnpm lint`
3. Typecheck: `pnpm typecheck` (or `pnpm tsc`)
4. Tests: `pnpm test` (if present)
5. Build: `pnpm build`

**Deliverable is not complete unless build is green.**

## 9) Work method (required)
### Discovery-first
Before edits:
- Read `README.md`, `.env.example`, `middleware.ts`, `app/layout.tsx`, and any `CONTRIBUTING.md`.
- Identify auth/session helpers and current route protection.

### Small-batch fix loop
- Make minimal changes.
- Re-run the smallest relevant gate after each batch.
- Never “bulk refactor” without tests or a clear safety net.

## 10) Output requirements (what you must report back)
When you finish a task, provide:
- Root cause summary (what was broken and why)
- Files changed (full paths)
- Commands run + results (lint/typecheck/build/tests)
- Any remaining risks (should be minimal)

## 11) Local-first developer experience
Prefer features that improve OSS self-hosting:
- Clear setup steps and sane defaults
- Helpful errors for missing env vars
- Optional telemetry only (off by default)

---
If any instruction conflicts with repo-specific documentation, **repo-specific docs win**. Otherwise, this file is the default contract.
