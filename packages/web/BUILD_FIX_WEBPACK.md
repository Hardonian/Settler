# Webpack Build Fix - Prisma Client Bundling

## Issue
Webpack was analyzing `prismaClient.ts` during client-side bundling, causing "Assigning to rvalue" errors when it encountered `process.env.NEXT_RUNTIME = 'nodejs'` assignments.

## Root Cause
Even with `typeof window === 'undefined'` checks, webpack's static analysis was still processing the Prisma client initialization code during the build phase, attempting to bundle it for the client.

## Solution
1. **Created `prismaClient.server.ts`**: A clean server-only implementation with `server-only` package marker
2. **Updated `prismaClient.ts`**: Now re-exports from the server version to maintain backward compatibility
3. **Added `server-only` markers**: Both files now use `import 'server-only'` to prevent client bundling
4. **Removed problematic assignments**: Eliminated all top-level `process.env` assignments that webpack could analyze

## Files Changed
- `/workspace/packages/web/src/shared/db/prismaClient.server.ts` (created)
- `/workspace/packages/web/src/shared/db/prismaClient.ts` (refactored to re-export)
- `/workspace/packages/web/src/lib/metrics/business-server.ts` (updated to use server version)
- `/workspace/packages/web/package.json` (added `server-only` dependency)

## How It Works
- `server-only` package throws an error at runtime if imported in client code
- Next.js webpack configuration respects `server-only` and excludes these files from client bundles
- All existing imports continue to work via re-export pattern
- No breaking changes to existing code

## Verification
The build should now complete without webpack errors related to Prisma client bundling.
