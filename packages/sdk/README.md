# @settler/sdk

Production-grade TypeScript SDK for the Settler Reconciliation API. Built with full type safety, automatic retries, request deduplication, and more.

## Features

- ✅ **Full TypeScript Support** - Complete type inference and IntelliSense
- ✅ **Automatic Retries** - Exponential backoff with configurable retry logic
- ✅ **Request Deduplication** - Prevents duplicate in-flight requests
- ✅ **Token Refresh** - Automatic token renewal before expiry
- ✅ **Webhook Verification** - Built-in webhook signature verification
- ✅ **Middleware Support** - Custom logging, metrics, and request/response interceptors
- ✅ **Pagination Helpers** - Async iterators for easy pagination
- ✅ **Strongly Typed Errors** - NetworkError, AuthError, ValidationError, RateLimitError
- ✅ **Zero Config** - Sensible defaults, override when needed
- ✅ **Small Bundle** - <50KB minified and gzipped

## Installation

```bash
npm install @settler/sdk
# or
yarn add @settler/sdk
# or
pnpm add @settler/sdk
```

## Quickstart (5 minutes)

### 1. Install the SDK

```bash
npm install @settler/sdk
```

### 2. Create a client

```typescript
import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: 'sk_your_api_key_here',
});
```

### 3. Make your first API call

```typescript
// List available adapters
const adapters = await client.adapters.list();
console.log('Available adapters:', adapters.data.map(a => a.name));

// Create a reconciliation job
const job = await client.jobs.create({
  name: 'Shopify-Stripe Reconciliation',
  source: {
    adapter: 'shopify',
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: 'your-shop.myshopify.com',
    },
  },
  target: {
    adapter: 'stripe',
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: 'order_id', type: 'exact' },
      { field: 'amount', type: 'exact', tolerance: 0.01 },
      { field: 'date', type: 'range', days: 1 },
    ],
    conflictResolution: 'last-wins',
  },
});

console.log('Job created:', job.data.id);
```

**That's it!** You've made your first API call. 🎉

## Usage Examples

### Basic Operations

```typescript
import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create a job
const job = await client.jobs.create({ /* ... */ });

// Get a job
const jobDetails = await client.jobs.get(job.data.id);

// Run a job manually
const execution = await client.jobs.run(job.data.id);

// Get a report
const report = await client.reports.get(job.data.id, {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
});

// Delete a job
await client.jobs.delete(job.data.id);
```

### Pagination with Async Iterators

```typescript
// Iterate over all jobs
for await (const job of client.jobs.listPaginated()) {
  console.log(job.name);
}

// Or collect all at once
import { collectPaginated } from '@settler/sdk';

const allJobs = await collectPaginated(client.jobs.listPaginated());
```

### Error Handling

```typescript
import {
  SettlerClient,
  NetworkError,
  AuthError,
  ValidationError,
  RateLimitError,
} from '@settler/sdk';

try {
  const job = await client.jobs.create({ /* ... */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    console.error('Field:', error.field);
  } else if (error instanceof AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded. Retry after:', error.retryAfter);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Webhook Signature Verification

```typescript
import { verifyWebhookSignature } from '@settler/sdk';

// In your webhook handler
app.post('/webhooks/settler', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-settler-signature'] as string;
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  // Process webhook event...
});
```

### Custom Middleware

```typescript
import { SettlerClient, createLoggingMiddleware, createMetricsMiddleware } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
  enableLogging: true, // Enable built-in logging middleware
});

// Add custom middleware
client.use(async (context, next) => {
  console.log(`Making ${context.method} request to ${context.path}`);
  const response = await next();
  console.log(`Received ${response.status} response`);
  return response;
});

// Add metrics middleware
const metrics = {
  increment: (name: string, tags?: Record<string, string>) => {
    // Send to your metrics service
  },
  histogram: (name: string, value: number, tags?: Record<string, string>) => {
    // Send to your metrics service
  },
};

client.use(createMetricsMiddleware(metrics));
```

### Token Refresh (for JWT tokens)

```typescript
const client = new SettlerClient({
  apiKey: 'initial_token', // Can be a JWT token
  tokenRefresh: {
    refreshFn: async () => {
      // Call your token refresh endpoint
      const response = await fetch('https://your-api.com/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      const data = await response.json();
      return {
        token: data.accessToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };
    },
    refreshThreshold: 5 * 60 * 1000, // Refresh 5 minutes before expiry
  },
});
```

### Retry Configuration

```typescript
const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
  retry: {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 2,
    retryOnRateLimit: true,
    shouldRetry: (error, attempt) => {
      // Custom retry logic
      return attempt < 3 || error.statusCode === 429;
    },
  },
});
```

### Request Deduplication

Request deduplication is enabled by default for GET requests. If you make the same GET request multiple times before the first one completes, only one request will be made and all callers will receive the same response.

```typescript
// Both of these will result in only one actual HTTP request
const promise1 = client.jobs.get('job_123');
const promise2 = client.jobs.get('job_123');

const [job1, job2] = await Promise.all([promise1, promise2]);
// job1 === job2 (same response)
```

To disable deduplication:

```typescript
const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
  deduplicateRequests: false,
});
```

## API Reference

### SettlerClient

Main client class for interacting with the Settler API.

#### Constructor

```typescript
new SettlerClient(config: SettlerConfig)
```

**Config Options:**

- `apiKey` (required): Your Settler API key
- `baseUrl` (optional): API base URL (default: `https://api.settler.io`)
- `timeout` (optional): Request timeout in milliseconds (default: `30000`)
- `retry` (optional): Retry configuration
- `deduplicateRequests` (optional): Enable request deduplication (default: `true`)
- `tokenRefresh` (optional): Token refresh configuration
- `middleware` (optional): Array of custom middleware functions
- `enableLogging` (optional): Enable built-in logging middleware (default: `false`)
- `logger` (optional): Custom logger implementation

#### Methods

- `client.jobs` - Jobs client
- `client.reports` - Reports client
- `client.webhooks` - Webhooks client
- `client.adapters` - Adapters client
- `client.use(middleware)` - Add middleware to the chain
- `client.request<T>(method, path, options)` - Make a raw API request

### JobsClient

```typescript
// Create a job
await client.jobs.create(request: CreateJobRequest): Promise<ApiResponse<ReconciliationJob>>

// List jobs
await client.jobs.list(options?: PaginationOptions): Promise<ListResponse<ReconciliationJob>>

// Get a job
await client.jobs.get(id: string): Promise<ApiResponse<ReconciliationJob>>

// Run a job
await client.jobs.run(id: string): Promise<ApiResponse<Execution>>

// Delete a job
await client.jobs.delete(id: string): Promise<void>

// Paginated iterator
client.jobs.listPaginated(options?: PaginationOptions): AsyncIterableIterator<ReconciliationJob>
```

### ReportsClient

```typescript
// Get a report
await client.reports.get(jobId: string, options?: GetReportOptions): Promise<ApiResponse<ReconciliationReport>>

// List reports
await client.reports.list(options?: PaginationOptions): Promise<ListResponse<ReportSummary>>

// Paginated iterator
client.reports.listPaginated(options?: PaginationOptions): AsyncIterableIterator<ReportSummary>
```

### WebhooksClient

```typescript
// Create a webhook
await client.webhooks.create(request: CreateWebhookRequest): Promise<ApiResponse<Webhook>>

// List webhooks
await client.webhooks.list(options?: PaginationOptions): Promise<ListResponse<Webhook>>

// Get a webhook
await client.webhooks.get(id: string): Promise<ApiResponse<Webhook>>

// Delete a webhook
await client.webhooks.delete(id: string): Promise<void>

// Paginated iterator
client.webhooks.listPaginated(options?: PaginationOptions): AsyncIterableIterator<Webhook>
```

### AdaptersClient

```typescript
// List adapters
await client.adapters.list(options?: PaginationOptions): Promise<ListResponse<Adapter>>

// Get an adapter
await client.adapters.get(id: string): Promise<ApiResponse<Adapter>>

// Paginated iterator
client.adapters.listPaginated(options?: PaginationOptions): AsyncIterableIterator<Adapter>
```

## TypeScript Support

The SDK is written in TypeScript and provides full type inference:

```typescript
const job = await client.jobs.create({ /* ... */ });
// job is typed as ApiResponse<ReconciliationJob>

const report = await client.reports.get('job_123');
// report.data.summary.matched is typed as number
```

## Error Types

The SDK provides strongly typed error classes:

- `SettlerError` - Base error class
- `NetworkError` - Network-related errors (timeouts, connection failures)
- `AuthError` - Authentication errors (401, 403)
- `ValidationError` - Validation errors (400)
- `RateLimitError` - Rate limit errors (429)
- `ServerError` - Server errors (5xx)
- `UnknownError` - Unknown/unhandled errors

## Bundle Size

The SDK is optimized for size:
- **Minified**: ~45KB
- **Minified + Gzipped**: ~15KB

Tree-shaking is supported, so unused code will be eliminated by your bundler.

## Browser Support

The SDK works in:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Node.js 18+
- Deno
- Bun

## Contributing

See [CONTRIBUTING.md](../../docs/contributing.md) for contribution guidelines.

## License

MIT

## Support

- 📖 [Documentation](https://docs.settler.io)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [Issue Tracker](https://github.com/settler/settler/issues)
- 📧 [Email Support](mailto:support@settler.io)
