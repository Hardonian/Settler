# Production Readiness Criteria

**Last Updated:** 2025-01-27  
**Purpose:** Define what "production-ready" means for this repository and how it's verified

## Definition of Production-Ready

A commit is considered "production-ready" when:

1. ✅ **Repository Integrity**
   - No committed `node_modules` directories
   - All workspace packages have valid `package.json` files
   - No phantom internal package references
   - All scripts referenced in `package.json` exist and execute

2. ✅ **Build Success**
   - TypeScript compilation succeeds without errors
   - All workspace packages build successfully
   - Vercel build command (`npm run build:vercel`) succeeds
   - Build artifacts are generated correctly

3. ✅ **Code Quality**
   - Linting passes without errors
   - Type checking passes without errors
   - Code formatting is consistent
   - No security vulnerabilities (critical/high severity)

4. ✅ **Tests**
   - Unit tests pass
   - Integration tests pass
   - Test coverage meets threshold (70% minimum)

5. ✅ **Deployment Parity**
   - CI build matches Vercel build
   - Build artifacts are consistent
   - No environment-specific build differences

6. ✅ **Error Handling**
   - Error boundaries are in place
   - Routes handle errors gracefully (no hard 500s)
   - User-facing error messages are clear
   - Server-side guards prevent crashes

## CI Checks

The following checks run automatically on every PR and push to `main`/`develop`:

### 1. Workspace Integrity Check (`workspace-integrity` job)

**Command:** `npm run check:workspace`

**Checks:**
- No `node_modules` directories committed to git
- All workspace packages have valid `package.json`
- No phantom internal package references (`@settler/*`)

**Failure Criteria:** Any check fails → CI fails

### 2. Environment Validation (`validate-env` job)

**Command:** `npm run validate:env`

**Checks:**
- Environment variable schema is valid
- Required environment variables are documented

**Failure Criteria:** Schema invalid → CI fails

### 3. Lint and Type Check (`lint-and-typecheck` job)

**Commands:**
- `npm run lint`
- `npm run format:check`
- `npm run typecheck`

**Checks:**
- ESLint rules pass
- Prettier formatting is correct
- TypeScript compilation succeeds

**Failure Criteria:** Any check fails → CI fails

### 4. Tests (`test` job)

**Command:** `npm run test`

**Checks:**
- Unit tests pass
- Integration tests pass
- Test coverage meets threshold

**Failure Criteria:** Tests fail or coverage below threshold → CI fails

### 5. Build (`build` job)

**Commands:**
- `npm run build`
- `npm run build:vercel` (in packages/web)

**Checks:**
- All workspace packages build successfully
- Build artifacts are generated (`packages/api/dist`, `packages/web/.next`)
- Vercel build command succeeds

**Failure Criteria:** Build fails or artifacts missing → CI fails

### 6. Smoke Test (`smoke-test` job)

**Command:** `npm run check:production`

**Checks:**
- Production readiness checks pass
- Build artifacts exist

**Failure Criteria:** Checks fail → CI fails (warnings allowed)

### 7. Security Scan (`security-scan` job)

**Commands:**
- `npm audit`
- Snyk scan
- Semgrep SAST

**Checks:**
- No critical vulnerabilities
- Security best practices followed

**Failure Criteria:** Critical vulnerabilities found → CI fails

## Manual Verification Commands

### One-Button Verification

```bash
# Run all production readiness checks
npm run check:production

# Run workspace integrity check
npm run check:workspace

# Run doctor (system health check)
npm run doctor
```

### Build Verification

```bash
# Build all packages
npm run build

# Build Vercel target specifically
cd packages/web && npm run build:vercel

# Verify build artifacts
test -d packages/web/.next && echo "✅ Web build OK"
test -d packages/api/dist && echo "✅ API build OK"
```

### Workspace Integrity

```bash
# Check workspace integrity
npm run check:workspace

# Verify no node_modules committed
git ls-files | grep "node_modules/" && echo "❌ node_modules found" || echo "✅ No node_modules"
```

## Vercel Deployment Configuration

### Build Settings

**Root Directory:** Repository root  
**Framework:** Next.js  
**Build Command:** `cd packages/web && npm run build:vercel`  
**Output Directory:** `packages/web/.next`  
**Install Command:** `npm ci --prefer-offline --no-audit --omit=optional`

### Environment Variables

Required environment variables are validated at build time. See `config/env.schema.ts` for the complete list.

### Build Process

1. **Install:** `npm ci` (frozen lockfile, no optional deps)
2. **Pre-build:** Prisma generate, typecheck
3. **Build:** Next.js build with Vercel optimizations
4. **Post-build:** Verify artifacts

## Error Handling Standards

### Client-Side

- **Error Boundaries:** `ErrorBoundary` component wraps critical sections
- **Route Errors:** `error.tsx` files handle route-level errors
- **Global Errors:** `global-error.tsx` handles uncaught errors

### Server-Side

- **API Routes:** Try-catch blocks with proper error responses
- **Route Handlers:** Error boundaries prevent 500 errors
- **Database:** Connection errors handled gracefully
- **External APIs:** Timeout and retry logic

### User-Facing

- **Error Messages:** Clear, actionable messages (no technical details)
- **Fallbacks:** Graceful degradation when features fail
- **Loading States:** Proper loading indicators

## Monitoring and Observability

- **Sentry:** Error tracking and performance monitoring
- **Vercel Analytics:** Web vitals and user analytics
- **Logging:** Structured logging for debugging

## Deployment Checklist

Before deploying to production:

- [ ] CI passes all checks
- [ ] `npm run check:production` passes
- [ ] `npm run check:workspace` passes
- [ ] Build artifacts verified
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Smoke tests pass against preview deployment
- [ ] Error monitoring configured
- [ ] Rollback plan documented

## Drift Prevention

The following mechanisms prevent drift between repo and Vercel:

1. **CI Enforcement:** All checks must pass before merge
2. **Workspace Integrity:** Validates package structure
3. **Build Parity:** Vercel build command tested in CI
4. **No node_modules:** Prevents dependency drift
5. **Locked Dependencies:** `package-lock.json` ensures consistency

## Troubleshooting

### Build Fails in CI but Works Locally

1. Check Node version matches (`.nvmrc`)
2. Verify `package-lock.json` is committed
3. Check for environment variable differences
4. Review CI logs for specific errors

### Vercel Build Differs from CI

1. Verify `vercel.json` is correct
2. Check environment variables in Vercel dashboard
3. Compare build logs (CI vs Vercel)
4. Ensure `build:vercel` script matches CI build

### Workspace Integrity Fails

1. Run `npm run check:workspace` locally
2. Verify all packages have `package.json`
3. Check for committed `node_modules`
4. Verify internal dependencies resolve

## Related Documentation

- `ops/vercel_parity_report.md` - Detailed drift analysis
- `scripts/check-workspace-integrity.ts` - Workspace check implementation
- `scripts/check-production-readiness.ts` - Production readiness checks
- `.github/workflows/ci.yml` - CI workflow definition
