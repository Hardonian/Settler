# Builder.io Fusion Deployment Guide

This guide documents the exact settings required to compile and deploy the Settler monorepo with Builder.io Fusion.

## App Root

Set the **App Root Directory** to the repository root:

```
/
```

The build relies on Turbo at the repo root to compile shared packages before the Next.js app.

## Commands

### Setup (Install) Command

```bash
npm install
```

### Development Command

```bash
npm run dev
```

### Build Command

```bash
npm run build
```

### Output Directory

Use the default Next.js output:

```
.next
```

## Required Environment Variables

Set these variables for **Production** and **Preview** environments in Builder.io Fusion:

### Public (Browser) Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SETTLER_API_KEY` (used by the SDK demo flows)

### Server Variables

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `SETTLER_API_KEY`

### Build Behavior

- `NODE_ENV=production`
- `SENTRY_SKIP_AUTO_INSTALL=1` (prevents build-time Sentry CLI installs)

## Notes

- The build compiles TypeScript packages in the monorepo. Ensure the install step includes dependencies (do **not** omit them).
- If you only want to run the Next.js app locally, you can use `cd packages/web && npm run dev`, but Fusion should use the root commands above so Turbo can build shared packages first.
