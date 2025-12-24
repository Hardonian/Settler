# Vercel SDK Integration

This directory contains integrations for Vercel's Next.js SDKs, providing enhanced functionality when deployed on Vercel.

## Available SDKs

### ✅ @vercel/analytics

- **Status**: Already integrated
- **Location**: `src/app/layout.tsx`
- **Usage**: Automatic page view and event tracking

### ✅ @vercel/speed-insights

- **Status**: Already integrated
- **Location**: `src/app/layout.tsx`
- **Usage**: Real-time performance monitoring

### ✅ @vercel/kv

- **Status**: Integrated
- **Location**: `src/lib/vercel/kv.ts`
- **Usage**: Serverless Redis for caching and data storage
- **Environment Variables**: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`

### ✅ @vercel/edge-config

- **Status**: Integrated
- **Location**: `src/lib/vercel/edge-config.ts`
- **Usage**: Edge configuration for feature flags and A/B testing
- **Environment Variables**: `EDGE_CONFIG`
- **Integration**: Automatically used by feature flag resolver

### ✅ @vercel/blob

- **Status**: Integrated
- **Location**: `src/lib/vercel/blob.ts`
- **Usage**: Serverless file storage
- **Environment Variables**: `BLOB_READ_WRITE_TOKEN`

## Usage Examples

### KV (Redis) Storage

```typescript
import { kv, cacheGet, cacheSet } from "@/lib/vercel/kv";

// Simple get/set
await kv.set("user:123", { name: "John", email: "john@example.com" });
const user = await kv.get("user:123");

// With expiration
await kv.set("session:abc", sessionData, { ex: 3600 }); // 1 hour

// Caching helper
const { value, cached } = await cacheGet("expensive-query", 3600);
if (!cached) {
  const data = await expensiveQuery();
  await cacheSet("expensive-query", data, 3600);
}
```

### Edge Config (Feature Flags)

```typescript
import { edgeConfig, getFeatureFlagFromEdgeConfig } from "@/lib/vercel/edge-config";

// Get feature flag
const flagValue = await getFeatureFlagFromEdgeConfig("new_dashboard");

// Get any config value
const configValue = await edgeConfig.get("api_endpoint");

// Check if key exists
const exists = await edgeConfig.has("feature_enabled");
```

The feature flag system automatically uses Edge Config if configured. See `src/lib/flags/resolver.ts`.

### Blob Storage

```typescript
import { blob, uploadFileFromForm } from "@/lib/vercel/blob";

// Upload a file
const result = await blob.put("documents/report.pdf", file, {
  access: "public",
  contentType: "application/pdf",
});

// Delete a file
await blob.del(result.url);

// Get file metadata
const metadata = await blob.head(result.url);

// List files
const { blobs } = await blob.list({ prefix: "documents/", limit: 10 });

// Upload from form
const { url, pathname, size } = await uploadFileFromForm(formData, "file");
```

## Configuration

### Setting up Vercel KV

1. Go to Vercel Dashboard → Your Project → Storage → KV
2. Create a new KV database
3. Copy the connection strings to your environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Setting up Edge Config

1. Go to Vercel Dashboard → Your Project → Storage → Edge Config
2. Create a new Edge Config
3. Add your configuration values (JSON format)
4. Copy the connection string to `EDGE_CONFIG` environment variable

### Setting up Blob Storage

1. Go to Vercel Dashboard → Your Project → Storage → Blob
2. Create a new Blob store
3. Copy the token to `BLOB_READ_WRITE_TOKEN` environment variable

## Fallback Behavior

All SDKs are designed to gracefully degrade if not configured:

- **KV**: Returns `null` for get operations, logs warnings for write operations
- **Edge Config**: Returns `null` if not configured, feature flags fall back to environment variables
- **Blob**: Throws errors if not configured (since file uploads require it)

## Best Practices

1. **Always check if configured**: Use the `is*Configured()` functions before critical operations
2. **Error handling**: All utilities include error handling, but wrap in try-catch for critical paths
3. **Caching**: Use KV for frequently accessed data with appropriate TTLs
4. **Feature flags**: Use Edge Config for dynamic feature flags that need to change without deployments
5. **File storage**: Use Blob for user-uploaded files, generated reports, and static assets

## Migration from Existing Systems

### Redis → Vercel KV

If you're currently using Upstash Redis, you can gradually migrate:

```typescript
// Old way
import { Redis } from "@upstash/redis";
const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });

// New way (Vercel KV)
import { kv } from "@/lib/vercel/kv";
// Same API, but uses Vercel KV if configured
```

### Feature Flags → Edge Config

The feature flag resolver automatically checks Edge Config first, then falls back to environment variables and database config.

## Performance Considerations

- **KV**: Sub-millisecond latency, perfect for caching
- **Edge Config**: Global edge network, instant updates
- **Blob**: CDN-backed, optimized for file serving

All SDKs are optimized for Vercel's edge network and provide better performance when deployed on Vercel.
