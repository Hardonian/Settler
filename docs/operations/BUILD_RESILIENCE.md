# Build Resilience Guide

This document outlines the build hardening measures implemented to ensure reliable, efficient builds.

## Overview

The build system has been hardened with multiple layers of resilience:

1. **Prisma Client Resilience** - Handles engine type detection and build-time requirements
2. **Pre-Flight Checks** - Validates environment before build starts
3. **Build Optimization** - Optimizes build performance and caching
4. **Error Recovery** - Graceful handling of common build failures
5. **Webpack Configuration** - Prevents client-side bundling of server-only code

## Prisma Client Resilience

### Problem
Prisma may detect "client" engine type during Vercel builds, requiring `accelerateUrl` or `adapter` in the constructor.

### Solution
The Prisma client (`prismaClient.server.ts`) now:

- Detects build phase using environment variables
- Provides fallback `accelerateUrl` during build (safe, no queries executed)
- Uses `server-only` marker to prevent webpack bundling
- Implements graceful error handling and retry logic
- Handles PrismaClientConstructorValidationError automatically

### Usage
```typescript
import { prisma } from '@/shared/db/prismaClient';

// Use normally - resilience is built-in
const user = await prisma.user.findUnique({ where: { id } });
```

## Pre-Flight Checks

### Running Checks
```bash
npm run build:check
```

### What It Checks
- Node.js version compatibility (>= 24.0.0)
- Required environment variables
- Prisma Client generation
- TypeScript configuration
- Common build-breaking issues

### Integration
Pre-flight checks run automatically in CI/CD and can be run manually before builds.

## Build Optimization

### Vercel Build Optimizer
The `vercel-build-optimizer.js` script:

- Sets optimal environment variables
- Configures Prisma for binary engine
- Optimizes Node.js memory allocation
- Validates Prisma Client availability

### Next.js Configuration
Optimizations include:

- **Bundle Splitting**: Vendor and common chunks for better caching
- **Deterministic Module IDs**: Consistent builds across environments
- **Runtime Chunk**: Single runtime chunk for optimal caching
- **Package Import Optimization**: Tree-shaking for large libraries

### Webpack Configuration
- Prevents server-only code from being bundled in client
- Optimizes chunk splitting for production builds
- Configures aliases to ensure correct imports

## Error Recovery

### Prisma Client Errors
The Prisma client automatically:

1. Detects constructor validation errors
2. Retries with `accelerateUrl` fallback
3. Provides helpful error messages
4. Logs diagnostics for debugging

### Build Failures
Common build failures are caught early:

- Missing Prisma Client → Clear error message with fix
- Type errors → Fail fast with detailed messages
- Environment issues → Pre-flight checks catch before build

## Best Practices

### 1. Always Use Server-Only Imports
```typescript
// ✅ Correct
import { prisma } from '@/shared/db/prismaClient';

// ❌ Wrong (will cause webpack errors)
import { prisma } from '@/shared/db/prismaClient.server';
```

### 2. Run Pre-Flight Checks
Before deploying:
```bash
npm run build:check
```

### 3. Use Build Optimizer in CI/CD
Vercel automatically runs the build optimizer. For other platforms:
```bash
npm run build:optimize && npm run build
```

### 4. Monitor Build Performance
- Check build logs for warnings
- Monitor build times
- Review bundle sizes with `npm run analyze`

## Troubleshooting

### Prisma Client Constructor Error
**Error**: `PrismaClientConstructorValidationError`

**Solution**: The build system automatically handles this. If it persists:
1. Ensure `PRISMA_CLIENT_ENGINE_TYPE=binary` is set
2. Run `npm run prisma:generate` before build
3. Check `vercel.json` has correct Prisma configuration

### Webpack Bundling Errors
**Error**: `Assigning to rvalue` or Prisma code in client bundle

**Solution**: 
1. Ensure `server-only` package is installed
2. Check imports use `@/shared/db/prismaClient` (not `.server.ts`)
3. Verify no client components import Prisma directly

### Build Timeout
**Error**: Build exceeds time limit

**Solution**:
1. Check `NODE_OPTIONS='--max-old-space-size=4096'` is set
2. Review bundle size with `npm run analyze`
3. Consider code splitting for large pages
4. Enable Turborepo caching

## Monitoring

### Build Metrics
- Build duration (target: < 5 minutes)
- Bundle size (monitor with bundle analyzer)
- Cache hit rate (Turborepo)

### Error Tracking
- Prisma initialization errors
- TypeScript compilation errors
- Webpack bundling errors

## Future Improvements

- [ ] AST-based import validation
- [ ] Automated bundle size monitoring
- [ ] Build performance regression detection
- [ ] Enhanced error recovery for edge cases
