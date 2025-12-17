# Vercel Build Fix — Sentry CLI Timeout

## Problem

Build fails during `npm ci` when Sentry tries to download the CLI binary:

```
npm error [sentry-cli] Downloading from https://downloads.sentry-cdn.com/sentry-cli/1.77.3/sentry-cli-Linux-x86_64
npm error Error: Unable to download sentry-cli binary
npm error Error code: ETIMEDOUT
```

## Solution

Set the `SENTRY_SKIP_AUTO_INSTALL` environment variable in Vercel to skip Sentry CLI installation during builds.

### Steps

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**

2. **Add Environment Variable**
   - **Name:** `SENTRY_SKIP_AUTO_INSTALL`
   - **Value:** `1`
   - **Environment:** Production, Preview, Development (all)

3. **Redeploy**
   - Trigger a new deployment
   - The build should now skip Sentry CLI installation

## Alternative: Make Sentry Optional

If you don't need Sentry immediately, you can:

1. Remove `@sentry/nextjs` from `packages/web/package.json` dependencies
2. The Sentry client code will gracefully degrade (already implemented)
3. Add Sentry back when you're ready to configure it

## Why This Happens

- `@sentry/nextjs` includes `@sentry/cli` as a dependency
- During `npm ci`, Sentry tries to download platform-specific binaries
- Network timeouts can occur during this download
- Setting `SENTRY_SKIP_AUTO_INSTALL=1` tells Sentry to skip this step

## Note

Sentry will still work at runtime - the CLI is only needed for:
- Source map uploads (can be done separately)
- Release management (can be done via API)

The Next.js Sentry SDK will work fine without the CLI during builds.
