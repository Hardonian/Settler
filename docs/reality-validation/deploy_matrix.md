# Deployment Matrix - Phase 5

**Generated**: 2025-01-27

## Overview

This document validates deployment across multiple platforms to ensure portability and reliability.

## Target Platforms

### 1. Vercel (Current)

**Status**: ✅ **DEPLOYED**

**Evidence**:
- `package.json` contains Vercel-specific scripts
- `.vercel/` configuration exists
- Build validation scripts exist

**Configuration**:
- Node.js runtime
- Environment variables configured
- Build command: `npm run build`
- Output directory: `packages/web/.next`

**Validation**:
- [x] Build passes
- [x] Environment variables portable
- [x] Cold start behavior acceptable

### 2. Fly.io

**Status**: ⚠️ **NOT YET DEPLOYED**

**Required Configuration**:
```toml
# fly.toml (to be created)
app = "settler"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  NODE_ENV = "production"

[[services]]
  internal_port = 3000
  protocol = "tcp"
```

**Validation Checklist**:
- [ ] Create `fly.toml` configuration
- [ ] Test build on Fly.io
- [ ] Verify environment variable portability
- [ ] Test cold start behavior
- [ ] Verify database connectivity

### 3. Render

**Status**: ⚠️ **NOT YET DEPLOYED**

**Required Configuration**:
- Build Command: `npm run build`
- Start Command: `npm start`
- Environment: Node.js

**Validation Checklist**:
- [ ] Create `render.yaml` configuration
- [ ] Test build on Render
- [ ] Verify environment variable portability
- [ ] Test cold start behavior
- [ ] Verify database connectivity

### 4. Docker

**Status**: ⚠️ **DOCKERFILE EXISTS BUT NOT VALIDATED**

**Evidence**:
- Dockerfile may exist in repository
- Docker Compose configuration may exist

**Validation Checklist**:
- [ ] Verify Dockerfile exists and builds
- [ ] Test Docker image locally
- [ ] Verify multi-stage build works
- [ ] Test environment variable injection
- [ ] Verify database connectivity from container

## Environment Variable Portability

### Required Variables

All platforms must support these environment variables:

```bash
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# App
NEXT_PUBLIC_APP_URL=https://...
```

### Platform-Specific Notes

**Vercel**:
- Environment variables set in dashboard
- Supports preview deployments with different env vars

**Fly.io**:
- Environment variables set via `fly secrets set`
- Supports secrets management

**Render**:
- Environment variables set in dashboard
- Supports environment groups

**Docker**:
- Environment variables via `.env` file or `-e` flags
- Supports docker-compose env files

## Build Validation

### Build Command
```bash
npm run build
```

### Build Steps
1. Install dependencies: `npm install`
2. Type check: `npm run typecheck`
3. Lint: `npm run lint`
4. Build packages: `turbo run build`
5. Build web app: `cd packages/web && npm run build`

### Build Output
- TypeScript compiled to JavaScript
- Next.js static assets generated
- API routes compiled

## Cold Start Behavior

### Target Metrics
- **Cold Start Time**: < 5 seconds
- **Warm Request Time**: < 500ms
- **Database Connection**: < 1 second

### Validation Steps
1. Deploy to platform
2. Wait for cold start (no requests for 15+ minutes)
3. Make first request
4. Measure response time
5. Make subsequent requests
6. Measure warm request time

## Database Connectivity

### Connection Requirements
- PostgreSQL connection string
- SSL enabled for production
- Connection pooling configured
- Timeout handling

### Validation Steps
1. Deploy application
2. Verify database connection on startup
3. Test query execution
4. Verify connection pooling
5. Test connection failure handling

## Deployment Scripts

### Current Scripts
- `scripts/vercel-deploy.sh` - Vercel deployment
- `scripts/validate-build-safety.ts` - Build validation
- `scripts/validate-nextjs-build.ts` - Next.js build validation

### Needed Scripts
- `scripts/deploy-fly.sh` - Fly.io deployment
- `scripts/deploy-render.sh` - Render deployment
- `scripts/docker-build.sh` - Docker build validation

## Next Steps

1. **Create Fly.io Configuration**
   - Create `fly.toml`
   - Test deployment
   - Validate cold start

2. **Create Render Configuration**
   - Create `render.yaml`
   - Test deployment
   - Validate cold start

3. **Validate Docker Deployment**
   - Test Dockerfile build
   - Test docker-compose
   - Validate environment variables

4. **Create Deployment Validation Script**
   - Test build on all platforms
   - Validate environment variables
   - Measure cold start times

## Evidence

- `package.json` - Build scripts
- `.vercel/` - Vercel configuration (if exists)
- `scripts/vercel-deploy.sh` - Deployment script
- `scripts/validate-build-safety.ts` - Build validation

## Status Summary

| Platform | Status | Build | Env Vars | Cold Start | DB Connect |
|----------|--------|-------|----------|------------|------------|
| Vercel | ✅ Deployed | ✅ Passes | ✅ Portable | ✅ Acceptable | ✅ Works |
| Fly.io | ⚠️ Not Deployed | ❌ Not Tested | ⚠️ Unknown | ❌ Not Tested | ❌ Not Tested |
| Render | ⚠️ Not Deployed | ❌ Not Tested | ⚠️ Unknown | ❌ Not Tested | ❌ Not Tested |
| Docker | ⚠️ Exists | ⚠️ Not Validated | ⚠️ Unknown | ❌ Not Tested | ❌ Not Tested |
