# Build Quick Reference

Quick reference guide for common build operations and troubleshooting.

## 🚀 Quick Commands

### Standard Builds
```bash
# Standard build
npm run build

# Safe build (with pre-flight checks)
npm run build:safe

# Vercel build (with optimization)
npm run build:vercel
```

### Pre-Flight Checks
```bash
# Run build checks only
npm run build:check

# Check environment
npm run validate:env:build
```

### Prisma Operations
```bash
# Generate Prisma Client
npm run prisma:generate

# Check Prisma status
npm run prisma:status
```

## 🔧 Common Issues & Fixes

### Prisma Client Constructor Error
**Error**: `PrismaClientConstructorValidationError`

**Fix**: Already handled automatically. If persists:
1. Run `npm run prisma:generate`
2. Check `PRISMA_CLIENT_ENGINE_TYPE=binary` is set
3. Verify `vercel.json` configuration

### Webpack Bundling Error
**Error**: `Assigning to rvalue` or Prisma in client bundle

**Fix**:
1. Ensure `server-only` package installed
2. Use `@/shared/db/prismaClient` (not `.server.ts`)
3. Check no client components import Prisma

### Build Timeout
**Error**: Build exceeds time limit

**Fix**:
1. Verify `NODE_OPTIONS='--max-old-space-size=4096'`
2. Run `npm run analyze` to check bundle size
3. Enable Turborepo caching

### Type Errors During Build
**Error**: TypeScript compilation errors

**Fix**:
1. Run `npm run typecheck` locally first
2. Check `tsconfig.json` configuration
3. Ensure all dependencies installed

## 📋 Build Checklist

Before deploying:
- [ ] Run `npm run build:check`
- [ ] Verify Prisma Client generated
- [ ] Check environment variables set
- [ ] Run `npm run typecheck`
- [ ] Test build locally: `npm run build`

## 🎯 Build Optimization Tips

1. **Use Turborepo Caching**: Enable remote caching for faster builds
2. **Monitor Bundle Size**: Run `npm run analyze` regularly
3. **Check Build Logs**: Review warnings and optimize accordingly
4. **Enable Deterministic Builds**: Already configured in webpack

## 📞 Support

For detailed information, see:
- [Build Resilience Guide](./BUILD_RESILIENCE.md)
- [Production Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
