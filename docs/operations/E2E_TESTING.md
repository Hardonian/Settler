# E2E Testing Guide

This guide explains how to run and maintain E2E tests for Settler.dev.

## Prerequisites

1. Node.js 24+ installed
2. Dependencies installed: `npm install`
3. Application running locally or staging URL configured

## Running E2E Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/checkout-flow.spec.ts
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### Run Tests Against Staging

```bash
E2E_BASE_URL=https://staging.settler.dev npx playwright test
```

---

## Test Coverage

### Current Tests

**File:** `tests/e2e/checkout-flow.spec.ts`

**Coverage:**
- ✅ Homepage → Pricing navigation
- ✅ Pricing plans display
- ✅ Billing cycle toggle (monthly/annual)
- ✅ Unauthenticated user redirect
- ✅ Stripe configuration error handling
- ✅ Plan code validation
- ✅ Billing success page handling
- ✅ Usage limit enforcement (429 responses)

---

## Test Structure

### Test Organization

```
tests/
  e2e/
    checkout-flow.spec.ts      # Checkout flow tests
    usage-limits.spec.ts       # Usage limit tests (TODO)
    authentication.spec.ts     # Auth flow tests (TODO)
```

### Test Naming Convention

- Use descriptive test names
- Group related tests with `test.describe()`
- Use `test.beforeEach()` for setup

---

## Writing New Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page).toHaveURL(/\/expected-path/);
  });
});
```

### Best Practices

1. **Use Page Object Model** for complex flows
2. **Mock external services** (Stripe, Supabase) when possible
3. **Use data-testid** for reliable element selection
4. **Clean up test data** after tests
5. **Use fixtures** for authentication

---

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '24'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

### Vercel Preview Deployments

Run tests against preview deployments:

```bash
E2E_BASE_URL=$VERCEL_URL npx playwright test
```

---

## Test Data Management

### Test Users

Create test users in Supabase:
- Email: `test+checkout@settler.dev`
- Password: `TestPassword123!`

### Test API Keys

Create test API keys for usage limit tests:
- Store in environment: `E2E_API_KEY`

### Stripe Test Mode

Use Stripe test mode for checkout tests:
- Test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

---

## Debugging Failed Tests

### View Test Report

```bash
npx playwright show-report
```

### View Screenshots

Screenshots are saved to `test-results/` on failure.

### View Videos

Videos are saved to `test-results/` on failure (if configured).

### View Traces

Traces are saved on first retry. View with:
```bash
npx playwright show-trace test-results/trace.zip
```

---

## Common Issues

### Issue: Tests Timeout

**Solution:**
- Increase timeout in `playwright.config.ts`
- Check if application is running
- Verify network connectivity

### Issue: Element Not Found

**Solution:**
- Use `page.waitForSelector()` before interacting
- Check if element is visible
- Verify selector is correct

### Issue: Authentication Fails

**Solution:**
- Check test user credentials
- Verify Supabase configuration
- Check for rate limiting

---

## Maintenance

### Update Tests When UI Changes

1. Run tests to identify failures
2. Update selectors if needed
3. Update assertions if behavior changed
4. Verify tests still pass

### Add Tests for New Features

1. Create test file: `tests/e2e/feature-name.spec.ts`
2. Write test cases
3. Run tests locally
4. Add to CI/CD pipeline

### Review Test Coverage

Monthly review:
- Are all critical flows tested?
- Are edge cases covered?
- Are error scenarios tested?

---

## Next Steps

1. ✅ Run E2E tests locally
2. ✅ Add tests to CI/CD pipeline
3. ✅ Set up test data management
4. ✅ Document test procedures
5. ✅ Create test runbooks

For questions or issues, contact: engineering@settler.dev
