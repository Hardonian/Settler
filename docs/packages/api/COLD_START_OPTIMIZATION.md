# Cold Start Optimization for Serverless

## Overview

Settler API is designed to run on serverless platforms (Vercel, AWS Lambda, Cloudflare Workers). Cold starts can add 1-5 seconds of latency. This document outlines optimization strategies.

## Current Optimizations

### 1. Bundle Size Reduction

- **Tree-shaking**: Unused code is eliminated during build
- **ES Modules**: Using ES modules for better tree-shaking
- **Minimal Dependencies**: Only essential dependencies included

### 2. Connection Pooling

- Database connections are pooled and reused across invocations
- Pool is initialized on first request and kept warm

### 3. Lazy Loading

- Heavy modules are loaded only when needed
- Adapters are loaded dynamically

## Recommended Optimizations

### 1. Provisioned Concurrency (AWS Lambda)

```typescript
// For critical functions, use provisioned concurrency
// This keeps functions warm and eliminates cold starts
```

**Configuration:**

- Set provisioned concurrency to 2-5 instances for critical endpoints
- Use on-demand for less critical endpoints

### 2. Vercel Edge Functions

For low-latency endpoints, use Vercel Edge Functions:

```typescript
// api/v1/health/edge.ts
export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
}
```

### 3. Keep Functions Warm

Schedule periodic pings to keep functions warm:

```typescript
// CloudWatch Events: Schedule expression: rate(5 minutes)
export const warmup = async () => {
  await fetch("https://api.settler.io/health");
};
```

### 4. Optimize Imports

```typescript
// ❌ Bad: Import entire library
import * as lodash from "lodash";

// ✅ Good: Import only what you need
import { debounce } from "lodash/debounce";
```

### 5. Database Connection Optimization

- Use connection pooling (already implemented)
- Consider using serverless-friendly databases (PlanetScale, Neon)
- Use connection proxies (RDS Proxy, PgBouncer)

### 6. Reduce Initialization Code

- Move heavy initialization to lazy loading
- Cache expensive computations
- Use global variables for singletons (carefully)

## Monitoring

Track cold start metrics:

```typescript
// Add to middleware
const startTime = Date.now();
// ... request processing ...
const duration = Date.now() - startTime;
if (duration > 1000) {
  logger.warn("Slow request", { duration, path: req.path });
}
```

## Target Metrics

- **Cold Start**: < 500ms (p95)
- **Warm Start**: < 50ms (p95)
- **Bundle Size**: < 5MB (compressed)

## Future Improvements

1. **WebAssembly**: Move heavy computations to WASM
2. **Edge Computing**: Use Cloudflare Workers for edge endpoints
3. **Function Splitting**: Split large functions into smaller ones
4. **Caching**: Cache responses at edge (Cloudflare, Vercel Edge)
