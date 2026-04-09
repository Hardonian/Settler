# Build Guardian & Maintainer Guide

## Overview

The Build Guardian system ensures Settler.dev builds cleanly on Vercel and locally, while the Maintainer role keeps the codebase healthy and future-proof.

## Quick Start

### Pre-Build Checks

```bash
# Run build guardian
npm run build:guardian

# Type check all packages
npm run typecheck

# Lint all packages
npm run lint

# Full validation
npm run validate
```

### Build Commands

```bash
# Build all packages
npm run build

# Build specific package
npm run build --filter=@settler/web
npm run build --filter=@settler/api

# Type check only
npm run typecheck
```

## Build Architecture

### Monorepo Structure

- **Root**: Turbo orchestrates builds across packages
- **packages/web**: Next.js application (Vercel deployment)
- **packages/api**: Express API server
- **packages/sdk**: Client SDK
- **packages/types**: Shared TypeScript types
- **packages/adapters**: Data adapters

### Build Pipeline

1. **Dependencies**: Install with `npm ci`
2. **Prisma**: Generate client (`npm run prisma:generate`)
3. **Type Check**: Run TypeScript compiler (`npm run typecheck`)
4. **Build**: Compile all packages (`npm run build`)
5. **Lint**: Run ESLint (`npm run lint`)

## Common Build Issues & Fixes

### TypeScript Errors

**Issue**: Type errors in strict mode

```typescript
// ❌ Bad
function process(data: any) { ... }

// ✅ Good
function process(data: ReconData): ReconResult { ... }
```

**Fix**: Enable strict mode gradually, fix types incrementally

### Missing Prisma Client

**Issue**: `@prisma/client` not found

```bash
# Fix
npm run prisma:generate
```

### Import Path Issues

**Issue**: Module not found errors

```typescript
// ❌ Bad - relative path
import { ReconEngine } from "../../../core/recon-engine";

// ✅ Good - package import
import { ReconEngine } from "@settler/core";
```

### Vercel Build Failures

**Common Causes**:

1. Missing environment variables
2. TypeScript errors
3. Missing dependencies
4. Build timeout (large bundles)

**Debug**:

```bash
# Check Vercel build logs
vercel logs

# Test build locally
npm run build
```

## Maintenance Checklist

### Weekly

- [ ] Run `npm run validate`
- [ ] Check for dependency updates (`npm outdated`)
- [ ] Review build times
- [ ] Check for dead code (`npm run dead-code`)

### Monthly

- [ ] Update dependencies (minor/patch)
- [ ] Review TypeScript strictness
- [ ] Audit unused exports
- [ ] Update documentation

### Quarterly

- [ ] Major dependency updates
- [ ] Architecture review
- [ ] Performance audit
- [ ] Security audit

## Configuration Files

### TypeScript

- `tsconfig.json` - Root config (strict mode enabled)
- `packages/*/tsconfig.json` - Package-specific configs

### Vercel

- `vercel.json` - Root Vercel config (crons)
- `packages/web/vercel.json` - Web app deployment config

### Turbo

- `turbo.json` - Build pipeline configuration

## Environment Variables

Required for build:

- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - Database connection
- `SUPABASE_URL` - Supabase endpoint
- `SUPABASE_ANON_KEY` - Supabase anonymous key

See `.env.example` for full list.

## Troubleshooting

### Build Fails on Vercel

1. Check Vercel build logs
2. Run build locally: `npm run build`
3. Check environment variables
4. Verify TypeScript configs
5. Check for missing dependencies

### Type Errors

1. Run `npm run typecheck` to see all errors
2. Fix errors incrementally
3. Use `@ts-expect-error` sparingly with comments
4. Consider disabling specific strict checks if needed

### Slow Builds

1. Enable Turbo caching
2. Check for unnecessary dependencies
3. Optimize bundle size
4. Use incremental builds

## Best Practices

### Code Organization

- Keep packages decoupled
- Use package imports (`@settler/*`)
- Avoid circular dependencies
- Maintain clear module boundaries

### Type Safety

- Use strict TypeScript
- Avoid `any` types
- Use proper interfaces
- Leverage type inference

### Build Performance

- Use Turbo caching
- Minimize dependencies
- Optimize bundle size
- Use incremental builds

## Support

For build issues:

1. Check this guide
2. Review build logs
3. Run `npm run build:guardian`
4. Open an issue with build logs
