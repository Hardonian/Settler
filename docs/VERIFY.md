# Verification Commands

This document lists the exact commands to run locally and in CI to verify the repository is in a "ship it" state.

## Prerequisites

- Node.js >= 24.0.0
- npm >= 10.0.0
- Clean git checkout (or `git clean -fdx` to remove untracked files)

## Local Verification

### 1. Clean Install
```bash
# Remove any existing node_modules and lockfiles
rm -rf node_modules packages/*/node_modules
rm -f package-lock.json

# Clean install
npm ci
```

**Expected:** No errors, all dependencies installed

### 2. Lint Check
```bash
npm run lint
```

**Expected:** No linting errors (warnings acceptable if documented)

### 3. Type Check
```bash
npm run typecheck
```

**Expected:** No TypeScript errors

### 4. Build
```bash
npm run build
```

**Expected:** All packages build successfully, no errors

### 5. Tests
```bash
npm test
```

**Expected:** All tests pass, or `--passWithNoTests` flag used with justification

### 6. Validate Scripts
```bash
npm run validate
```

**Expected:** All validation scripts pass

### 7. Check for Committed node_modules
```bash
# This should return nothing
git ls-files | grep node_modules
```

**Expected:** No output (no node_modules files tracked)

### 8. Verify .gitignore
```bash
# Check that node_modules is ignored
git check-ignore packages/api/node_modules packages/web/node_modules
```

**Expected:** Both paths are ignored

## CI Verification

### GitHub Actions Workflow

The following workflow should run on every push and PR:

```yaml
name: Verify Build

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
      - name: Check for committed node_modules
        run: |
          if git ls-files | grep -q node_modules; then
            echo "❌ Error: node_modules files are committed to git"
            git ls-files | grep node_modules
            exit 1
          fi
```

## Vercel Deployment Verification

### Pre-Deployment Checks

1. **Environment Variables**
   ```bash
   npm run validate:env:build
   npm run validate:env:runtime
   ```

2. **Build Command**
   ```bash
   cd packages/web && npm run build:vercel
   ```

3. **API Build**
   ```bash
   cd packages/api && npm run build
   ```

### Post-Deployment Checks

1. **Health Endpoint**
   ```bash
   curl https://your-domain.vercel.app/health
   ```

   **Expected:** JSON response with status, version, timestamp

2. **Database Health**
   ```bash
   curl https://your-domain.vercel.app/api/health/db
   ```

   **Expected:** JSON response with database connectivity status

3. **API Documentation**
   ```bash
   curl https://your-domain.vercel.app/api/v1/openapi.json
   ```

   **Expected:** Valid OpenAPI JSON schema

## Smoke Tests

### API Smoke Test
```bash
npm run test:smoke
```

**Expected:** Basic API endpoints respond correctly

### Console Smoke Test (if web UI exists)
```bash
npm run test:smoke:console
```

**Expected:** Web UI loads and basic interactions work

## Performance Checks

### Build Time
- Full build should complete in < 5 minutes
- Incremental builds should be < 1 minute (with Turbo cache)

### Runtime Performance
- Health endpoint should respond in < 100ms
- API endpoints should respond in < 500ms (p95)

## Security Checks

1. **No Secrets in Code**
   ```bash
   # Check for common secret patterns
   grep -r "api_key\|secret\|password" --include="*.ts" --include="*.js" packages/ | grep -v "node_modules" | grep -v ".test."
   ```

   **Expected:** No hardcoded secrets (only env var references)

2. **Dependency Audit**
   ```bash
   npm audit --audit-level=moderate
   ```

   **Expected:** No moderate or high severity vulnerabilities

## Troubleshooting

### Build Fails
1. Check Node version: `node --version` (should be >= 24.0.0)
2. Clear Turbo cache: `rm -rf .turbo`
3. Clean install: `rm -rf node_modules packages/*/node_modules && npm ci`

### Type Errors
1. Ensure all workspace packages are built: `npm run build`
2. Check tsconfig.json references are correct
3. Verify package.json dependencies are installed

### Lint Errors
1. Run auto-fix: `npm run lint:fix`
2. Check ESLint config in each package
3. Verify Prettier formatting: `npm run format:check`

## Success Criteria

All verification commands must pass before considering the repo "ship ready":

- ✅ `npm ci` succeeds
- ✅ `npm run lint` passes
- ✅ `npm run typecheck` passes
- ✅ `npm run build` succeeds
- ✅ `npm test` passes (or documented skip)
- ✅ No committed node_modules
- ✅ Vercel deployment succeeds
- ✅ Health endpoints respond correctly
- ✅ No hard 500s on user-facing routes
