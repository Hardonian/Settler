# Frontend Surface Separation

## Contract

- **Marketing surface** (`packages/web/src/app/(marketing)` and public route trees) is static-first, SEO-first, and must never require auth/session/server-secret env to render.
- **Application surface** (`/app`, `/console`, `/admin`, `/dashboard`) is authenticated and may consume server-only modules.
- Missing server env must never hard-500 marketing routes; degrade with user-facing fallback state.

## Forbidden Imports

Marketing code must not import:

- `@/app/app`, `@/app/console`, `@/app/admin`, `@/app/dashboard`
- `@/env/server`
- auth/supabase server helpers under `@/lib/auth`, `@/lib/supabase/server`

## Runtime Safety

- Server env lives in `src/env/server.ts` and is marked `server-only`.
- Public env lives in `src/env/public.ts` and is safe for marketing.
- `/app` and control plane routes fail closed when auth is missing.
