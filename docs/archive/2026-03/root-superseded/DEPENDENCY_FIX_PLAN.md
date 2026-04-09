# Dependency Fix Action Plan

This document provides step-by-step instructions to address the issues identified in the dependency audit.

## Phase 1: Critical Security Fixes (Day 1-2)

### Step 1: Run Safe Audit Fixes

```bash
# Navigate to project root
cd /home/user/Settler

# Run automatic fixes for non-breaking vulnerabilities
npm audit fix

# Verify what was fixed
npm audit
```

**Expected fixes:**

- devalue vulnerabilities
- diff vulnerability
- h3 vulnerability
- qs vulnerability

### Step 2: Fix Invalid Dependency Versions

#### Fix packages/web/package.json

```bash
cd packages/web
```

Edit the following in `package.json`:

```diff
-    "zod": "^4.1.13"
+    "zod": "^3.23.8"

-    "uuid": "^13.0.0"
+    "uuid": "^10.0.0"
```

#### Fix root package.json

```bash
cd /home/user/Settler
```

Edit the following in `package.json`:

```diff
-    "dotenv": "^17.2.3"
+    "dotenv": "^16.4.5"
```

### Step 3: Install Fixed Dependencies

```bash
cd /home/user/Settler
npm install
```

### Step 4: Run Audit Again

```bash
npm audit
```

**Expected result:** Vulnerabilities reduced from 14 to ~3-4

---

## Phase 2: Resolve Dependency Inconsistencies (Day 3-5)

### Step 1: Standardize Stripe Versions

#### Update packages/api/package.json

```diff
-    "stripe": "^14.25.0"
+    "stripe": "^20.0.0"
```

#### Update packages/adapters/package.json

```diff
-    "stripe": "^14.21.0"
+    "stripe": "^20.0.0"
```

**Note:** Review breaking changes in Stripe API v20

- Migration guide: https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md

### Step 2: Standardize bcrypt Versions

#### Update packages/api/package.json

```diff
-    "bcrypt": "^5.1.1"
+    "bcrypt": "^6.0.0"

-    "@types/bcrypt": "^5.0.2"
+    "@types/bcrypt": "^6.0.0"
```

### Step 3: Standardize uuid Versions

#### Update packages/api/package.json

```diff
-    "uuid": "^9.0.1"
+    "uuid": "^10.0.0"

-    "@types/uuid": "^9.0.7"
+    "@types/uuid": "^10.0.0"
```

#### Update packages/edge-ai-core/package.json

```diff
-    "uuid": "^9.0.1"
+    "uuid": "^10.0.0"

-    "@types/uuid": "^9.0.7"
+    "@types/uuid": "^10.0.0"
```

### Step 4: Standardize dotenv Versions

#### Update packages/api/package.json

```diff
-    "dotenv": "^16.3.1"
+    "dotenv": "^16.4.5"
```

#### Update packages/cli/package.json

```diff
-    "dotenv": "^16.3.1"
+    "dotenv": "^16.4.5"
```

### Step 5: Install and Test

```bash
cd /home/user/Settler
npm install

# Run tests to verify nothing broke
npm run test

# Run builds to verify compatibility
npm run build
```

---

## Phase 3: Address Remaining Security Vulnerabilities (Day 6-7)

### Option A: Force Fix (May Cause Breaking Changes)

```bash
# This will downgrade prisma which may break things
npm audit fix --force
```

**⚠️ WARNING:** This will:

- Downgrade prisma from 7.1.0 to 6.19.2 (breaking change)
- Upgrade bcrypt to 6.0.0 (already done in Phase 2)
- Downgrade @vercel/blob to 0.0.2 (breaking change)

### Option B: Manual Targeted Fixes (Recommended)

#### Fix tar vulnerability

```bash
# Check current bcrypt version after Phase 2
# Should already be on 6.0.0, which includes fixed tar version
npm ls bcrypt
```

#### Fix undici vulnerability via @vercel/blob

Edit `packages/web/package.json`:

```diff
-    "@vercel/blob": "^0.26.0"
+    "@vercel/blob": "^0.27.0"
```

Check for latest safe version:

```bash
npm view @vercel/blob versions --json | tail -20
```

#### Fix hono/prisma vulnerability

Check if hono is actually needed:

```bash
npm ls hono
```

If hono is only used by @prisma/dev (dev dependency):

```bash
# Consider if dev-mode vulnerability is acceptable
# or wait for prisma update
```

Monitor Prisma releases:

- https://github.com/prisma/prisma/releases

---

## Phase 4: Remove Redundant Dependencies (Week 2)

### Step 1: Remove Duplicated Dev Dependencies from Workspace Packages

These are already in the root package.json and don't need to be in individual packages:

#### packages/web/package.json

```diff
  "devDependencies": {
    "@next/bundle-analyzer": "^16.0.7",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.11",
    "@types/node": "^24.0.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/uuid": "^10.0.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4",
-   "eslint-config-prettier": "^10.1.8",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
-   "prettier": "^3.1.1",
-   "typescript": "^5.3.3"
  }
```

#### packages/api/package.json

```diff
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/compression": "^1.7.5",
    "@types/cookie-parser": "^1.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.13",
-   "@types/node": "^24.0.0",
    "@types/pdfkit": "^0.13.3",
    "@types/pg": "^8.10.9",
    "@types/uuid": "^10.0.0",
    "@types/xml2js": "^0.4.14",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "artillery": "^2.0.0",
    "eslint": "^8.57.1",
-   "eslint-config-prettier": "^10.1.8",
    "jest": "^29.7.0",
    "k6": "^0.0.0",
    "supertest": "^7.1.4",
    "ts-jest": "^29.1.1",
    "tsx": "^4.7.0",
-   "typescript": "^5.3.3"
  }
```

Apply similar changes to:

- packages/cli/package.json
- packages/edge-ai-core/package.json
- packages/sdk/package.json
- packages/types/package.json
- packages/protocol/package.json
- packages/adapters/package.json
- packages/react-settler/package.json

### Step 2: Hoist Common Testing Dependencies to Root

Add to root `package.json` devDependencies (if not already present):

```json
"devDependencies": {
  "@types/jest": "^29.5.11",
  "jest": "^29.7.0",
  "ts-jest": "^29.1.1",
  "@typescript-eslint/eslint-plugin": "^8.0.0",
  "@typescript-eslint/parser": "^8.0.0"
}
```

---

## Phase 5: Identify and Remove Unused Dependencies (Week 2-3)

### Step 1: Install depcheck

```bash
npm install -g depcheck
```

### Step 2: Check Each Package

```bash
# Check web package
cd packages/web
depcheck

# Check api package
cd packages/api
depcheck

# Repeat for all packages
```

### Step 3: Review Flagged Dependencies

For packages/web, manually verify usage:

```bash
# Check if critters is used
grep -r "critters" packages/web/src/

# Check if lenis is used
grep -r "lenis" packages/web/src/

# Check if gray-matter is used
grep -r "gray-matter" packages/web/src/
```

For packages/api, manually verify:

```bash
# Check if pdfkit is used
grep -r "pdfkit" packages/api/src/

# Check if xml2js is used
grep -r "xml2js" packages/api/src/

# Check if multer is used
grep -r "multer" packages/api/src/
```

### Step 4: Remove Confirmed Unused Dependencies

Only remove dependencies that are confirmed unused by both depcheck and manual verification.

---

## Phase 6: Update Outdated Packages (Week 3-4)

### Step 1: Update Playwright

```bash
cd /home/user/Settler
npm install -D @playwright/test@latest
npm install -D @axe-core/playwright@latest
```

### Step 2: Fix @next/bundle-analyzer Version Mismatch

```bash
cd packages/web
npm install -D @next/bundle-analyzer@^14.2.35
```

### Step 3: Consider Sentry v8 Upgrade

**Note:** This is a major version upgrade with breaking changes.

1. Review migration guide:
   - https://docs.sentry.io/platforms/javascript/migration/v7-to-v8/

2. Update packages/web/package.json:

```diff
-    "@sentry/nextjs": "^7.91.0"
+    "@sentry/nextjs": "^8.40.0"
```

3. Update packages/api/package.json:

```diff
-    "@sentry/node": "^7.91.0"
-    "@sentry/profiling-node": "^7.91.0"
+    "@sentry/node": "^8.40.0"
+    "@sentry/profiling-node": "^8.40.0"
```

4. Test thoroughly before deploying.

---

## Phase 7: Implement Dependency Governance (Ongoing)

### Step 1: Add Dependency Management Scripts

Add to root `package.json`:

```json
"scripts": {
  "deps:check": "npm outdated --workspaces",
  "deps:audit": "npm audit --workspaces",
  "deps:list": "npm ls --all --workspaces",
  "deps:duplicates": "npm dedupe"
}
```

### Step 2: Set Up Automated Dependency Updates

Create `.github/renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true
  },
  "schedule": ["before 3am on Monday"]
}
```

Or enable Dependabot in `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      development-dependencies:
        dependency-type: "development"
```

### Step 3: Add Pre-commit Hook for Lock File

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Verify package-lock.json is in sync
npm install --package-lock-only --ignore-scripts
git diff --exit-code package-lock.json
```

---

## Verification Checklist

After completing all phases:

- [ ] `npm audit` shows 0 vulnerabilities
- [ ] All packages use consistent versions for shared dependencies
- [ ] `npm run build` succeeds across all packages
- [ ] `npm run test` passes across all packages
- [ ] `npm run typecheck` passes across all packages
- [ ] `npm ls` shows no duplicate packages (or minimal duplicates)
- [ ] All environment variables still work
- [ ] Staging deployment succeeds
- [ ] Integration tests pass
- [ ] Production deployment plan reviewed

---

## Rollback Plan

If issues arise during any phase:

1. **Revert package.json changes:**

   ```bash
   git checkout HEAD -- package.json packages/*/package.json
   ```

2. **Restore package-lock.json:**

   ```bash
   git checkout HEAD -- package-lock.json
   ```

3. **Reinstall dependencies:**

   ```bash
   rm -rf node_modules packages/*/node_modules
   npm install
   ```

4. **Test:**
   ```bash
   npm run build
   npm run test
   ```

---

## Timeline Estimate

- **Phase 1 (Critical Security):** 1-2 days
- **Phase 2 (Version Consistency):** 2-3 days
- **Phase 3 (Remaining Vulnerabilities):** 1-2 days
- **Phase 4 (Remove Redundancies):** 2-3 days
- **Phase 5 (Remove Unused):** 3-5 days
- **Phase 6 (Update Outdated):** 3-5 days
- **Phase 7 (Governance):** 2-3 days

**Total:** 2-3 weeks for complete implementation

---

## Success Metrics

Track these metrics before and after:

- Security vulnerabilities: 14 → 0
- Dependency duplicates: (run `npm ls` to count)
- Total dependencies: ~150+ → target ~120-130
- npm install time: (measure before/after)
- Build time: (measure before/after)
- Bundle size: (use bundle analyzer)

---

**Document created:** 2026-01-17
**Last updated:** 2026-01-17
**Owner:** Development Team
