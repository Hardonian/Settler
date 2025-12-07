# Quick Start Guide - TypeScript Refactor Changes

## What Changed?

This codebase has undergone a comprehensive TypeScript refactoring to improve type safety, error handling, and code quality.

## Key Changes for Developers

### 1. Error Handling Pattern

**Old Way** (❌ Don't use):

```typescript
catch (error: any) {
  logError('Failed', error);
  res.status(500).json({ error: error.message });
}
```

**New Way** (✅ Use this):

```typescript
import { handleRouteError } from "../utils/error-handler";

catch (error: unknown) {
  handleRouteError(res, error, "Failed to perform operation", 500, { context });
}
```

### 2. Typed Errors

Use typed error classes for better error handling:

```typescript
import { NotFoundError, ValidationError, RateLimitError } from "../utils/typed-errors";

// Throw typed errors
throw new NotFoundError("Job not found", "job", jobId);
throw new ValidationError("Invalid input", "email");
throw new RateLimitError("Rate limit exceeded", 60, 1000, 0);
```

### 3. Database Queries

**Old Way**:

```typescript
const results = await query<any>("SELECT * FROM users");
```

**New Way**:

```typescript
interface UserRow {
  id: string;
  email: string;
  name: string | null;
}

const results = await query<UserRow>("SELECT id, email, name FROM users");
```

### 4. Type Safety

- All `any` types should be replaced with proper types
- Use `unknown` for truly unknown values, then narrow with type guards
- ESLint will error on `any` types

### 5. Error Middleware

The error middleware now uses typed errors automatically. Just throw typed errors:

```typescript
import { NotFoundError } from "../utils/typed-errors";

if (!job) {
  throw new NotFoundError("Job not found", "job", id);
}
```

## Migration Checklist

For route files with remaining `any` types:

1. ✅ Import `handleRouteError`:

   ```typescript
   import { handleRouteError } from "../utils/error-handler";
   ```

2. ✅ Replace `catch (error: any)` with `catch (error: unknown)`

3. ✅ Use `handleRouteError()` instead of manual error handling

4. ✅ Replace `err?: any` in callbacks with `err?: unknown`

## TypeScript Strict Mode

The codebase now uses maximum strictness:

- `strictNullChecks`: Must handle null/undefined explicitly
- `noUncheckedIndexedAccess`: Array/object access may be undefined
- `noImplicitReturns`: Functions must explicitly return
- `exactOptionalPropertyTypes`: Optional properties are truly optional

## Common Patterns

### Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === "string";
}

if (isString(value)) {
  // TypeScript knows value is string here
  console.log(value.toUpperCase());
}
```

### Error Handling

```typescript
try {
  await operation();
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    // Handle validation error specifically
  }
  handleRouteError(res, error, "Operation failed");
}
```

### Database Queries

```typescript
// Always type your query results
const users = await query<{
  id: string;
  email: string;
  created_at: Date;
}>("SELECT id, email, created_at FROM users");
```

## Questions?

See:

- `TYPESCRIPT_REFACTOR_PROGRESS.md` - Detailed progress
- `REFACTOR_COMPLETE_SUMMARY.md` - Complete summary
- `packages/api/src/utils/typed-errors.ts` - Error classes
- `packages/api/src/utils/error-handler.ts` - Error utilities
