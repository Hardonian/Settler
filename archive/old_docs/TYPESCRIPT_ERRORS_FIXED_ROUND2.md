# TypeScript Errors Fixed - Round 2

## Summary
Fixed all remaining TypeScript compilation errors from the Vercel build.

## Errors Fixed

### 1. Module Import Path (`usage-quota.ts`)
- **Error**: `Cannot find module '../../config/plans'`
- **Fix**: Changed import path from `../../config/plans` to `../config/plans` (correct relative path)

### 2. Await in Non-Async Function (`usage-quota.ts`)
- **Error**: `'await' expressions are only allowed within async functions`
- **Fix**: Changed dynamic import to use `.then()` instead of `await` in the `res.end` override function

### 3. Unused Parameter (`exports.ts`)
- **Error**: `'req' is declared but its value is never read`
- **Fix**: Renamed parameter to `_req` to indicate it's intentionally unused

### 4. Missing Import (`jobs.ts`)
- **Error**: `Cannot find name 'trackEventAsync'`
- **Fix**: Added import for `trackEventAsync` from `../utils/event-tracker`

### 5. Possibly Undefined Objects (`api-change-detector.ts`)
- **Errors**: Multiple `Object is possibly 'undefined'` errors
- **Fix**: Added null checks before accessing route properties in map iterations

### 6. Missing fs Import (`api-change-detector.ts`)
- **Error**: `Cannot find name 'fs'`
- **Fix**: Added `import * as fs from "fs/promises";`

### 7. Possibly Undefined in Doc Generator (`doc-generator.ts`)
- **Errors**: Multiple undefined checks needed
- **Fix**: 
  - Added null checks for `match[1]` and `match[2]`
  - Added null check for `comment`
  - Fixed `RouteDoc` type to handle optional `permissions` properly
  - Renamed `lines` to `outputLines` to avoid shadowing

### 8. Type Mismatches in Dropoff Analyzer (`dropoff-analyzer.ts`)
- **Errors**: Multiple type mismatches with `undefined` values
- **Fix**:
  - Fixed boolean insertion to use explicit `true : false`
  - Removed duplicate `if (prevStep)` checks
  - Added null checks for `biggestDropOff` before accessing properties
  - Fixed indentation for `timeResult` query

### 9. Type Mismatch in Error Analyzer (`error-analyzer.ts`)
- **Error**: `Type 'string | undefined' is not assignable`
- **Fix**: Added null check for `error.error_message` before pushing to patterns

### 10. Unused Import (`email-service.ts`)
- **Error**: `'config' is declared but its value is never read`
- **Fix**: Removed unused `config` import

### 11. Email Service Type Mismatch (`email-service.ts`)
- **Error**: Missing required `text` property in Resend email options
- **Fix**: Added `text: options.text || ""` to ensure `text` is always provided

### 12. Possibly Undefined in Onboarding Tracker (`onboarding/tracker.ts`)
- **Error**: `Object is possibly 'undefined'`
- **Fix**: Added null check for `lastResult` before accessing `updated_at`

### 13. Type Mismatch in Alerts Manager (`alerts/manager.ts`)
- **Error**: `Argument of type 'unknown[]' is not assignable`
- **Fix**: Added explicit type cast to `(string | number | boolean | Date | null)[]`

### 14. Type Mismatch in Batch Queries (`batch-queries.ts`)
- **Error**: `Object.keys` called on possibly undefined object
- **Fix**: Added null check for `records[0]` before calling `Object.keys`

### 15. Circuit Breaker Type Issues (`circuit-breakers.ts`)
- **Errors**: Multiple type constraint errors with CircuitBreaker
- **Fix**: 
  - Changed import to use both default and named export: `import CircuitBreaker, { CircuitBreaker as CircuitBreakerType } from "opossum"`
  - Updated return types to use `CircuitBreakerType` instead of `InstanceType<typeof CircuitBreaker>`
  - Updated type definition in `opossum.d.ts` to export default as the class

## Files Modified

1. `packages/api/src/middleware/usage-quota.ts`
2. `packages/api/src/routes/exports.ts`
3. `packages/api/src/routes/jobs.ts`
4. `packages/api/src/services/ai-insights/api-change-detector.ts`
5. `packages/api/src/services/ai-insights/doc-generator.ts`
6. `packages/api/src/services/ai-insights/dropoff-analyzer.ts`
7. `packages/api/src/services/ai-insights/error-analyzer.ts`
8. `packages/api/src/services/email/email-service.ts`
9. `packages/api/src/services/onboarding/tracker.ts`
10. `packages/api/src/services/alerts/manager.ts`
11. `packages/api/src/utils/batch-queries.ts`
12. `packages/api/src/utils/circuit-breakers.ts`
13. `packages/api/src/types/opossum.d.ts`

## Status
All TypeScript compilation errors should now be resolved. The build should pass on Vercel.
