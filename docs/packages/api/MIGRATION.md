# Migration Guide: From Raw Fetch to @settler/sdk

This guide helps you migrate from using raw `fetch` calls to the `@settler/sdk` package.

## Why Migrate?

- ✅ **Type Safety** - Full TypeScript inference and IntelliSense
- ✅ **Automatic Retries** - Built-in exponential backoff
- ✅ **Error Handling** - Strongly typed error classes
- ✅ **Request Deduplication** - Prevents duplicate requests
- ✅ **Token Refresh** - Automatic token renewal
- ✅ **Webhook Verification** - Built-in signature verification
- ✅ **Less Boilerplate** - Cleaner, more maintainable code

## Before: Raw Fetch

```typescript
// Basic request
async function createJob(jobData: any) {
  const response = await fetch("https://api.settler.io/api/v1/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.SETTLER_API_KEY!,
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// With retry logic
async function createJobWithRetry(jobData: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch("https://api.settler.io/api/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.SETTLER_API_KEY!,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        if (response.status === 429 && i < maxRetries - 1) {
          const retryAfter = response.headers.get("Retry-After");
          await new Promise((resolve) => setTimeout(resolve, parseInt(retryAfter || "1") * 1000));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

// Pagination
async function listAllJobs() {
  const jobs = [];
  let cursor: string | undefined;

  do {
    const url = new URL("https://api.settler.io/api/v1/jobs");
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetch(url.toString(), {
      headers: {
        "X-API-Key": process.env.SETTLER_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    jobs.push(...data.data);
    cursor = data.nextCursor;
  } while (cursor);

  return jobs;
}

// Webhook verification
function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  const parts = signature.split(",");
  const signaturePart = parts.find((p) => p.startsWith("v1="));
  if (!signaturePart) return false;
  return signaturePart.substring(3) === expectedSignature;
}
```

## After: Using @settler/sdk

```typescript
import { SettlerClient } from "@settler/sdk";

// Initialize client once
const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY!,
});

// Create job (with automatic retries)
async function createJob(jobData: CreateJobRequest) {
  return client.jobs.create(jobData);
  // ✅ Automatic retries
  // ✅ Type-safe
  // ✅ Proper error handling
}

// List all jobs (with pagination)
async function listAllJobs() {
  const jobs = [];
  for await (const job of client.jobs.listPaginated()) {
    jobs.push(job);
  }
  return jobs;
  // ✅ Automatic pagination
  // ✅ Type-safe
  // ✅ Clean async iteration
}

// Webhook verification
import { verifyWebhookSignature } from "@settler/sdk";

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  return verifyWebhookSignature(payload, signature, secret);
  // ✅ Built-in verification
  // ✅ Timing-safe comparison
  // ✅ Timestamp extraction support
}
```

## Step-by-Step Migration

### Step 1: Install the SDK

```bash
npm install @settler/sdk
```

### Step 2: Replace Fetch Calls

#### Before:

```typescript
const response = await fetch("https://api.settler.io/api/v1/jobs", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  },
  body: JSON.stringify(jobData),
});
```

#### After:

```typescript
import { SettlerClient } from "@settler/sdk";

const client = new SettlerClient({ apiKey });
const response = await client.jobs.create(jobData);
```

### Step 3: Update Error Handling

#### Before:

```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
} catch (error) {
  // Generic error handling
}
```

#### After:

```typescript
import { NetworkError, AuthError, ValidationError, RateLimitError } from "@settler/sdk";

try {
  const job = await client.jobs.create(jobData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof AuthError) {
    // Handle auth errors
  } else if (error instanceof RateLimitError) {
    // Handle rate limits
  } else if (error instanceof NetworkError) {
    // Handle network errors
  }
}
```

### Step 4: Replace Pagination Logic

#### Before:

```typescript
async function getAllItems() {
  const items = [];
  let cursor;
  do {
    const response = await fetch(`${baseUrl}?cursor=${cursor}`);
    const data = await response.json();
    items.push(...data.data);
    cursor = data.nextCursor;
  } while (cursor);
  return items;
}
```

#### After:

```typescript
import { collectPaginated } from "@settler/sdk";

async function getAllItems() {
  return collectPaginated(client.jobs.listPaginated());
  // Or use async iteration:
  // for await (const item of client.jobs.listPaginated()) {
  //   // process item
  // }
}
```

### Step 5: Update Webhook Handlers

#### Before:

```typescript
app.post("/webhooks", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-settler-signature"];
  // Manual verification logic...
});
```

#### After:

```typescript
import { verifyWebhookSignature } from "@settler/sdk";

app.post("/webhooks", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-settler-signature"] as string;
  if (!verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET!)) {
    return res.status(401).send("Invalid signature");
  }
  // Process webhook...
});
```

## Common Patterns

### Custom Headers

#### Before:

```typescript
const response = await fetch(url, {
  headers: {
    "X-API-Key": apiKey,
    "X-Custom-Header": "value",
  },
});
```

#### After:

```typescript
client.use(async (context, next) => {
  context.headers["X-Custom-Header"] = "value";
  return next();
});
```

### Request Timeout

#### Before:

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);
const response = await fetch(url, {
  signal: controller.signal,
});
```

#### After:

```typescript
const client = new SettlerClient({
  apiKey,
  timeout: 30000, // Already built-in!
});
```

### Retry Logic

#### Before:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
      if (response.status === 429 && i < maxRetries - 1) {
        await sleep(1000 * Math.pow(2, i));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i));
    }
  }
}
```

#### After:

```typescript
const client = new SettlerClient({
  apiKey,
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    multiplier: 2,
  },
});
// Retries are automatic!
```

## Benefits Summary

| Feature               | Raw Fetch                | @settler/sdk       |
| --------------------- | ------------------------ | ------------------ |
| Type Safety           | ❌ Manual types          | ✅ Full inference  |
| Retries               | ❌ Manual implementation | ✅ Built-in        |
| Error Handling        | ❌ Generic errors        | ✅ Typed errors    |
| Pagination            | ❌ Manual loops          | ✅ Async iterators |
| Webhook Verification  | ❌ Manual crypto         | ✅ Built-in helper |
| Request Deduplication | ❌ Not possible          | ✅ Automatic       |
| Token Refresh         | ❌ Manual logic          | ✅ Built-in        |
| Bundle Size           | N/A                      | ✅ <50KB           |

## Need Help?

- 📖 [Full Documentation](./README.md)
- 💬 [Discord Community](https://discord.gg/settler)
- 🐛 [Issue Tracker](https://github.com/settler/settler/issues)
