# Safe Breaking Changes Resolution Plan

**Status:** 11 vulnerabilities remaining (2 low, 9 high) after running `npm audit fix`
**Goal:** Resolve all vulnerabilities with zero production impact
**Approach:** Test-driven, phased rollout with immediate rollback capability

---

## Executive Summary

The remaining vulnerabilities require breaking changes, but they can be resolved safely using a careful, isolated approach:

1. **hono** (affects Prisma dev tools only - DEV DEPENDENCY)
2. **qs/express/body-parser** (affects API package)
3. **tar/bcrypt** (affects API and Web packages)
4. **undici/@vercel/blob** (affects Web package)

**Key Insight:** Most of these are isolated to specific packages and can be fixed independently.

---

## Vulnerability Analysis & Safe Resolution Strategy

### 1. hono/Prisma (LOWEST RISK - Dev Only)

**Vulnerability:** JWT algorithm confusion in hono (used by @prisma/dev)
**Severity:** High
**Actual Risk:** LOW - Only affects Prisma Studio/dev tools, not production code

**Safe Resolution Strategy:**
```bash
# Option A: Accept dev-only risk (RECOMMENDED)
# Add to package.json
"overrides": {
  "hono": "^4.11.4"
}

# Option B: Disable Prisma Studio if not used
# Remove @prisma/dev if Prisma Studio isn't needed
```

**Why Safe:**
- hono is ONLY used by @prisma/dev (Prisma Studio)
- Prisma Studio is a dev tool, not deployed to production
- Worst case: local dev tool has vulnerability, doesn't affect production

**Testing Required:**
- ✅ Verify Prisma generate still works
- ✅ Verify Prisma migrate still works
- ✅ Optional: Test Prisma Studio (if used)

---

### 2. qs/body-parser/express (MEDIUM RISK)

**Vulnerability:** DoS via memory exhaustion in qs
**Severity:** High
**Actual Risk:** MEDIUM - Affects API server

**Current Versions:**
- express: 4.18.2 (in packages/api)
- qs: < 6.14.1 (transitive dependency)

**Safe Resolution Strategy:**

#### Step 1: Check if we can upgrade qs directly
```bash
npm update qs --workspace=packages/api
npm audit
```

#### Step 2: If that doesn't work, upgrade express
```bash
cd packages/api
npm install express@^4.21.3
```

**Why Safe:**
- Express 4.x is stable, minor version updates are backwards compatible
- qs is a query string parser - update unlikely to break existing code
- API routes will continue to work the same way

**Testing Required:**
- ✅ Run API integration tests
- ✅ Test API endpoints with query parameters
- ✅ Test POST requests with body parsing
- ✅ Verify rate limiting still works
- ✅ Check error handling middleware

**Rollback Plan:**
```bash
cd packages/api
npm install express@^4.18.2
```

---

### 3. tar/bcrypt (MEDIUM-HIGH RISK)

**Vulnerability:** Arbitrary file overwrite in tar (via bcrypt native builds)
**Severity:** High
**Actual Risk:** MEDIUM - Affects bcrypt installation, not runtime

**Current Versions:**
- packages/api: bcrypt@^5.1.1
- packages/web: bcrypt@^6.0.0 (already updated!)

**Safe Resolution Strategy:**

#### Step 1: Upgrade bcrypt in packages/api
```bash
cd packages/api
npm install bcrypt@^6.0.0 @types/bcrypt@^6.0.0
```

**Why Safe:**
- bcrypt@6.x is a maintained major version
- API changes are minimal (mostly internal)
- Hashing algorithms are backward compatible
- Existing password hashes will still verify

**Breaking Changes in bcrypt@6:**
- Dropped Node.js < 18 support (we're on 22, so safe)
- Minor TypeScript type improvements
- Updated native binary (no API changes)

**Testing Required:**
- ✅ Test user login (password verification)
- ✅ Test user registration (password hashing)
- ✅ Test password reset flows
- ✅ Verify existing user passwords still work
- ✅ Run authentication tests

**Compatibility Test:**
```typescript
// Add to packages/api/src/__tests__/bcrypt-upgrade-test.ts
import bcrypt from 'bcrypt';

describe('bcrypt v6 compatibility', () => {
  it('should hash and verify passwords', async () => {
    const password = 'test123';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should verify old hashes', async () => {
    // Use a hash generated with bcrypt@5
    const oldHash = '$2b$10$...'; // Get from existing DB
    const isValid = await bcrypt.compare('password', oldHash);
    expect(isValid).toBe(true);
  });
});
```

**Rollback Plan:**
```bash
cd packages/api
npm install bcrypt@^5.1.1 @types/bcrypt@^5.0.2
```

---

### 4. undici/@vercel/blob (LOW-MEDIUM RISK)

**Vulnerability:** Unbounded decompression in undici
**Severity:** Unknown (likely Medium)
**Actual Risk:** LOW-MEDIUM - Affects Vercel Blob storage client

**Current Version:**
- packages/web: @vercel/blob@^0.26.0

**Safe Resolution Strategy:**

#### Step 1: Check for safe upgrade path
```bash
npm view @vercel/blob versions --json | grep -A5 "0.26"
```

#### Step 2: Try upgrading to latest patch
```bash
cd packages/web
npm install @vercel/blob@latest
```

#### Step 3: If force downgrade is needed (last resort)
```bash
cd packages/web
npm install @vercel/blob@^0.23.0 # Pre-vulnerable undici version
```

**Why Safe:**
- @vercel/blob API is stable
- Mainly used for file uploads/downloads
- Vercel maintains backward compatibility

**Testing Required:**
- ✅ Test file upload functionality
- ✅ Test file download/retrieval
- ✅ Test blob deletion
- ✅ Verify image optimization pipeline
- ✅ Check CSV upload feature

**Rollback Plan:**
```bash
cd packages/web
npm install @vercel/blob@^0.26.0
```

---

## Implementation Plan - Zero-Risk Approach

### Phase 1: Dev Dependencies (Day 1)

**Risk Level:** ZERO - Dev only

```bash
# Add override for hono (affects only Prisma dev tools)
```

Edit root `package.json`:
```json
{
  "overrides": {
    "rimraf": "^5.0.0",
    "raw-body": "^2.5.2",
    "hono": "^4.11.4"
  }
}
```

```bash
npm install
npm audit
```

**Expected:** 9 vulnerabilities remaining (removed 2 hono-related)

**Validation:**
```bash
npm run prisma:generate
npm run build
```

**Rollback:** Remove hono from overrides

---

### Phase 2: qs/express Upgrade (Day 2-3)

**Risk Level:** LOW - Well-tested upgrade path

#### Step 1: Create test branch
```bash
git checkout -b fix/qs-vulnerability
```

#### Step 2: Upgrade express
```bash
cd packages/api
npm install express@^4.21.3 qs@^6.14.1
cd ../..
npm install
```

#### Step 3: Run comprehensive tests
```bash
# Unit tests
cd packages/api
npm test

# Integration tests
cd ../..
npm run test:smoke
npm run test:e2e

# Manual API testing
npm run dev
# Test critical endpoints:
# - POST /api/reconciliation
# - GET /api/reconciliation?filters=...
# - POST /api/auth/login
```

#### Step 4: Stage deployment test
```bash
# Deploy to staging
npm run deploy:vercel -- --env=staging

# Run smoke tests against staging
npm run test:smoke:staging
```

#### Step 5: Production deployment (if all tests pass)
```bash
git add packages/api/package.json package-lock.json
git commit -m "fix: upgrade express to resolve qs DoS vulnerability"
git push origin fix/qs-vulnerability

# Create PR, get review, merge
# Deploy via CI/CD
```

**Rollback:** Merge rollback PR with old express version

---

### Phase 3: bcrypt Upgrade (Day 4-5)

**Risk Level:** MEDIUM - Requires auth testing

#### Step 1: Create dedicated test branch
```bash
git checkout -b fix/bcrypt-vulnerability
```

#### Step 2: Add compatibility tests FIRST
```typescript
// packages/api/src/__tests__/bcrypt-compatibility.test.ts
import bcrypt from 'bcrypt';

describe('bcrypt compatibility tests', () => {
  // Test password hashing
  it('should hash passwords', async () => {
    const hash = await bcrypt.hash('testpass', 10);
    expect(hash).toBeTruthy();
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  // Test password verification
  it('should verify passwords', async () => {
    const password = 'mypassword';
    const hash = await bcrypt.hash(password, 10);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });

  // Critical: Test old hash verification
  it('should verify existing user hashes', async () => {
    // Get actual hash from database
    // Replace with real hash from your DB
    const existingHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    const result = await bcrypt.compare('test123', existingHash);
    expect(result).toBe(true);
  });
});
```

#### Step 3: Run tests with OLD version
```bash
cd packages/api
npm test bcrypt-compatibility
```

#### Step 4: Upgrade bcrypt
```bash
npm install bcrypt@^6.0.0 @types/bcrypt@^6.0.0
cd ../..
npm install
```

#### Step 5: Run tests with NEW version
```bash
cd packages/api
npm test bcrypt-compatibility
npm test # All tests

# Run auth-specific tests
npm test -- --testPathPattern="auth|login|password"
```

#### Step 6: Integration testing
```bash
# Test full auth flow
npm run dev

# Manual tests:
# 1. Login with existing user
# 2. Create new user
# 3. Change password
# 4. Reset password flow
# 5. Failed login attempts
```

#### Step 7: Staging deployment
```bash
# Deploy to staging with real user data copy
npm run deploy:vercel -- --env=staging

# Critical: Test with REAL existing users
# Have team members try to log in
```

#### Step 8: Gradual production rollout
```bash
# Commit changes
git add packages/api/package.json
git commit -m "fix: upgrade bcrypt to v6 (resolves tar vulnerability)"

# Create PR with detailed testing notes
# Get security review
# Merge and deploy during low-traffic window
# Monitor auth error rates
```

**Monitoring After Deploy:**
```bash
# Watch for auth failures
npm run monitor:errors -- --filter=auth

# Check Sentry for bcrypt-related errors
# Monitor login success rate
```

**Rollback:**
```bash
cd packages/api
npm install bcrypt@^5.1.1 @types/bcrypt@^5.0.2
# Redeploy immediately
```

---

### Phase 4: @vercel/blob Upgrade (Day 6)

**Risk Level:** LOW-MEDIUM - Isolated to file uploads

#### Step 1: Research upgrade path
```bash
npm view @vercel/blob versions
npm view @vercel/blob@latest dist.dependencies
```

#### Step 2: Test branch
```bash
git checkout -b fix/vercel-blob-undici
```

#### Step 3: Upgrade to latest
```bash
cd packages/web
npm install @vercel/blob@latest
cd ../..
npm install
```

#### Step 4: Test file upload features
```bash
npm run dev

# Test:
# - CSV upload (/api/upload)
# - Image uploads
# - File retrieval
# - File deletion
```

#### Step 5: Run e2e tests
```bash
npm run test:csv-upload
npm run test:e2e
```

#### Step 6: Deploy to staging
```bash
npm run deploy:vercel -- --env=staging

# Test file operations on staging
```

#### Step 7: Production deployment
```bash
git add packages/web/package.json
git commit -m "fix: update @vercel/blob to resolve undici vulnerability"
# PR, review, merge, deploy
```

**Rollback:**
```bash
cd packages/web
npm install @vercel/blob@^0.26.0
```

---

## Testing Checklist

### Pre-Deployment Tests

For each phase, complete this checklist:

- [ ] Unit tests pass: `npm test`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Integration tests pass: `npm run test:e2e`
- [ ] Smoke tests pass: `npm run test:smoke`

### Phase-Specific Tests

#### Express/qs:
- [ ] API endpoints respond correctly
- [ ] Query parameters parse correctly
- [ ] POST body parsing works
- [ ] File upload works
- [ ] Rate limiting works
- [ ] Error middleware catches errors

#### bcrypt:
- [ ] Existing users can log in
- [ ] New user registration works
- [ ] Password hashing produces valid format
- [ ] Password comparison works
- [ ] Password reset flow works
- [ ] Failed login lockout works

#### @vercel/blob:
- [ ] CSV file upload works
- [ ] File retrieval works
- [ ] Image optimization works
- [ ] File deletion works
- [ ] Large file uploads work

---

## Monitoring & Validation

### Post-Deploy Monitoring (24-48 hours)

1. **Error Rates**
```bash
npm run monitor:errors
```

2. **Sentry Alerts**
- Check for new error types
- Monitor error frequency
- Look for bcrypt-related errors

3. **Authentication Metrics**
- Login success rate
- Login failure rate
- Password reset requests

4. **API Performance**
- Response times
- Request throughput
- Error rates by endpoint

5. **File Operations**
- Upload success rate
- Download success rate
- Storage usage

### Success Criteria

Each phase is successful if:
- ✅ Zero new production errors
- ✅ All monitored metrics stable or improved
- ✅ npm audit shows vulnerabilities resolved
- ✅ User-facing features work identically
- ✅ Performance metrics unchanged or better

---

## Emergency Rollback Procedure

If ANY issue is detected:

1. **Immediate Rollback**
```bash
git revert HEAD
git push origin main --force-with-lease
```

2. **Redeploy Previous Version**
```bash
npm run deploy:vercel -- --force
```

3. **Verify Rollback**
```bash
# Check that old version is live
curl https://yourapp.com/api/health

# Verify npm audit shows original vulnerabilities
npm audit
```

4. **Post-Mortem**
- Document what went wrong
- Identify root cause
- Update testing checklist
- Create fix plan

---

## Alternative: Gradual Package-by-Package Approach

If you want even more safety, resolve one package at a time:

### Week 1: hono override only
- Zero risk, dev only
- Monitor for 1 week

### Week 2: express/qs upgrade
- Low risk
- Monitor for 1 week

### Week 3: bcrypt upgrade
- Medium risk
- Monitor for 1 week

### Week 4: @vercel/blob upgrade
- Low risk
- Monitor for 1 week

Total time: 4 weeks, but ZERO production risk

---

## Risk Matrix

| Vulnerability | Risk Level | Time to Fix | Production Impact |
|--------------|------------|-------------|-------------------|
| hono         | ZERO       | 5 min       | None (dev only)   |
| qs/express   | LOW        | 2-3 days    | Minimal           |
| tar/bcrypt   | MEDIUM     | 3-5 days    | Auth flows only   |
| undici/blob  | LOW-MED    | 1-2 days    | File uploads only |

---

## Final Recommendation

**Recommended Approach: Phased with Staging**

1. **Week 1:** Fix hono + qs/express (low risk)
2. **Week 2:** Fix bcrypt (requires careful auth testing)
3. **Week 3:** Fix @vercel/blob (isolated feature)

**Total Timeline:** 3 weeks with full testing
**Alternative Fast Track:** 1 week if staging tests pass

**Decision Point:**
- If you have good test coverage → 1 week
- If you want maximum safety → 3 weeks
- If you're risk-averse → 4 weeks (one at a time)

---

**Next Step:** Choose your timeline and start with Phase 1 (hono override - zero risk)
