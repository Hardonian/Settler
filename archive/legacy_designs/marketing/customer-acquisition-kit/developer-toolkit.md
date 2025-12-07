# Settler Developer Toolkit

Everything you need to build with Settler. SDKs, CLI, Playground, and more.

---

## Table of Contents

- [TypeScript/JavaScript SDK](#typescriptjavascript-sdk)
- [CLI Tool](#cli-tool)
- [Web Playground](#web-playground)
- [API Client Libraries](#api-client-libraries)
- [Development Tools](#development-tools)

---

## TypeScript/JavaScript SDK

The official Settler SDK for TypeScript and JavaScript. Full type safety, IntelliSense support, and zero configuration.

### Installation

```bash
npm install @settler/sdk
# or
yarn add @settler/sdk
# or
pnpm add @settler/sdk
```

### Quick Start

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create a reconciliation job
const job = await settler.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: "your-shop.myshopify.com",
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    conflictResolution: "last-wins",
  },
});

console.log("Job created:", job.data.id);
```

### Configuration

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: "sk_live_abc123...", // Required
  baseUrl: "https://api.settler.io", // Optional (default)
  timeout: 30000, // Optional (30 seconds)
});
```

### Jobs API

**Create Job:**

```typescript
const job = await settler.jobs.create({
  name: "My Reconciliation Job",
  source: {
    adapter: "shopify",
    config: { apiKey: "...", shopDomain: "..." },
  },
  target: {
    adapter: "stripe",
    config: { apiKey: "..." },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});
```

**List Jobs:**

```typescript
const jobs = await settler.jobs.list({
  limit: 10,
  status: "active",
});

console.log(`Found ${jobs.count} jobs`);
jobs.data.forEach((job) => {
  console.log(`- ${job.name} (${job.id})`);
});
```

**Get Job:**

```typescript
const job = await settler.jobs.get("job_abc123");
console.log("Job status:", job.data.status);
```

**Update Job:**

```typescript
const updated = await settler.jobs.update("job_abc123", {
  status: "paused",
  rules: {
    matching: [{ field: "order_id", type: "exact" }],
  },
});
```

**Run Job:**

```typescript
const execution = await settler.jobs.run("job_abc123", {
  dateRange: "2026-01-01/2026-01-31",
});

console.log("Execution ID:", execution.data.id);
```

**Delete Job:**

```typescript
await settler.jobs.delete("job_abc123");
```

### Reports API

**Get Report:**

```typescript
const report = await settler.reports.get("job_abc123", {
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  includeMatches: true,
  includeUnmatched: true,
});

console.log(`Matched: ${report.data.summary.matched}`);
console.log(`Unmatched: ${report.data.summary.unmatched}`);
console.log(`Accuracy: ${report.data.summary.accuracy}%`);
```

**List Reports:**

```typescript
const reports = await settler.reports.list({
  limit: 10,
  jobId: "job_abc123",
});
```

### Webhooks API

**Create Webhook:**

```typescript
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile",
  events: ["reconciliation.matched", "reconciliation.mismatch", "reconciliation.error"],
  secret: "optional_secret",
});

console.log("Webhook ID:", webhook.data.id);
console.log("Webhook Secret:", webhook.data.secret);
```

**List Webhooks:**

```typescript
const webhooks = await settler.webhooks.list();
```

**Verify Webhook:**

```typescript
import { verifyWebhook } from "@settler/sdk/webhooks";

const isValid = verifyWebhook(
  req.body,
  req.headers["x-settler-signature"],
  process.env.WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

### Adapters API

**List Adapters:**

```typescript
const adapters = await settler.adapters.list();

adapters.data.forEach((adapter) => {
  console.log(`${adapter.name} (${adapter.id})`);
  console.log(`  Required: ${adapter.config.required.join(", ")}`);
});
```

**Get Adapter:**

```typescript
const adapter = await settler.adapters.get("stripe");
console.log("Adapter version:", adapter.data.version);
```

### Error Handling

```typescript
import Settler, { SettlerError } from "@settler/sdk";

try {
  const job = await settler.jobs.create({...});
} catch (error) {
  if (error instanceof SettlerError) {
    switch (error.type) {
      case "ValidationError":
        console.error("Validation error:", error.details);
        break;
      case "RateLimitError":
        console.error("Rate limit exceeded. Retry after:", error.retryAfter);
        // Implement exponential backoff
        break;
      case "NotFoundError":
        console.error("Resource not found");
        break;
      default:
        console.error("Unexpected error:", error.message);
    }
  } else {
    console.error("Network error:", error);
  }
}
```

### TypeScript Types

Full TypeScript types are included:

```typescript
import type {
  ReconciliationJob,
  ReconciliationReport,
  Webhook,
  Adapter,
  MatchingRule,
  AdapterConfig,
} from "@settler/sdk";

function processJob(job: ReconciliationJob) {
  console.log("Job ID:", job.id);
  console.log("Status:", job.status);
}
```

### Advanced Usage

**Custom Request Interceptor:**

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
  onRequest: (config) => {
    console.log("Making request:", config.method, config.url);
    return config;
  },
  onResponse: (response) => {
    console.log("Response status:", response.status);
    return response;
  },
});
```

**Retry Logic:**

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    retryableStatuses: [429, 500, 503],
  },
});
```

---

## CLI Tool

The Settler CLI lets you manage reconciliation jobs from the command line.

### Installation

```bash
npm install -g @settler/cli
# or
npx @settler/cli
```

### Configuration

Set your API key:

```bash
settler config set api-key sk_live_abc123...
```

Or use environment variable:

```bash
export SETTLER_API_KEY=sk_live_abc123...
```

### Commands

**Jobs:**

```bash
# List jobs
settler jobs list

# Get job details
settler jobs get job_abc123

# Create job
settler jobs create \
  --name "Shopify-Stripe Reconciliation" \
  --source-adapter shopify \
  --source-config '{"apiKey":"...","shopDomain":"..."}' \
  --target-adapter stripe \
  --target-config '{"apiKey":"..."}' \
  --rules '{"matching":[{"field":"order_id","type":"exact"}]}'

# Run job
settler jobs run job_abc123

# Update job
settler jobs update job_abc123 --status paused

# Delete job
settler jobs delete job_abc123
```

**Reports:**

```bash
# Get report
settler reports get job_abc123 \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --format json

# List reports
settler reports list --limit 10
```

**Webhooks:**

```bash
# List webhooks
settler webhooks list

# Create webhook
settler webhooks create \
  --url https://your-app.com/webhooks/reconcile \
  --events reconciliation.matched,reconciliation.mismatch

# Delete webhook
settler webhooks delete wh_abc123
```

**Adapters:**

```bash
# List adapters
settler adapters list

# Get adapter details
settler adapters get stripe
```

### Interactive Mode

```bash
settler interactive
```

Launches an interactive CLI session with autocomplete and help.

---

## Web Playground

The Settler Web Playground lets you test the API without writing code.

**URL:** [settler.io/playground](https://settler.io/playground)

### Features

- **Code Editor** — Write and test API requests
- **Request Builder** — Visual request builder
- **Response Viewer** — Pretty-printed JSON responses
- **Examples** — Pre-built examples for common use cases
- **Documentation** — Inline API documentation
- **Share** — Share playground sessions

### Example Session

1. **Select Adapter:**
   - Choose "Shopify" as source
   - Choose "Stripe" as target

2. **Configure:**
   - Enter API keys (sandbox mode)
   - Set matching rules

3. **Test:**
   - Click "Run" to execute
   - View results in real-time

4. **Export:**
   - Copy code snippet
   - Export as cURL, TypeScript, Python, etc.

### Try Without Signup

The playground works in sandbox mode without requiring an account. Perfect for:

- Testing adapters
- Exploring API capabilities
- Learning the API
- Prototyping integrations

---

## API Client Libraries

### cURL

```bash
curl -X POST https://api.settler.io/api/v1/jobs \
  -H "X-API-Key: sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shopify-Stripe Reconciliation",
    "source": {
      "adapter": "shopify",
      "config": {
        "apiKey": "shpat_...",
        "shopDomain": "your-shop.myshopify.com"
      }
    },
    "target": {
      "adapter": "stripe",
      "config": {
        "apiKey": "sk_live_..."
      }
    },
    "rules": {
      "matching": [
        {"field": "order_id", "type": "exact"},
        {"field": "amount", "type": "exact", "tolerance": 0.01}
      ]
    }
  }'
```

### Python (Coming Soon)

```python
from settler import Settler

settler = Settler(api_key="sk_live_abc123...")

job = settler.jobs.create(
    name="Shopify-Stripe Reconciliation",
    source={
        "adapter": "shopify",
        "config": {
            "apiKey": "...",
            "shopDomain": "..."
        }
    },
    target={
        "adapter": "stripe",
        "config": {"apiKey": "..."}
    },
    rules={
        "matching": [
            {"field": "order_id", "type": "exact"},
            {"field": "amount", "type": "exact", "tolerance": 0.01}
        ]
    }
)

print(f"Job created: {job.id}")
```

### Ruby (Coming Soon)

```ruby
require 'settler'

settler = Settler::Client.new(api_key: 'sk_live_abc123...')

job = settler.jobs.create(
  name: 'Shopify-Stripe Reconciliation',
  source: {
    adapter: 'shopify',
    config: {
      apiKey: '...',
      shopDomain: '...'
    }
  },
  target: {
    adapter: 'stripe',
    config: { apiKey: '...' }
  },
  rules: {
    matching: [
      { field: 'order_id', type: 'exact' },
      { field: 'amount', type: 'exact', tolerance: 0.01 }
    ]
  }
)

puts "Job created: #{job.id}"
```

### Go (Coming Soon)

```go
package main

import (
    "fmt"
    "github.com/settler/settler-go"
)

func main() {
    client := settler.NewClient("sk_live_abc123...")

    job, err := client.Jobs.Create(settler.CreateJobRequest{
        Name: "Shopify-Stripe Reconciliation",
        Source: settler.AdapterConfig{
            Adapter: "shopify",
            Config: map[string]interface{}{
                "apiKey": "...",
                "shopDomain": "...",
            },
        },
        Target: settler.AdapterConfig{
            Adapter: "stripe",
            Config: map[string]interface{}{
                "apiKey": "...",
            },
        },
        Rules: settler.MatchingRules{
            Matching: []settler.MatchingRule{
                {Field: "order_id", Type: "exact"},
                {Field: "amount", Type: "exact", Tolerance: 0.01},
            },
        },
    })

    if err != nil {
        panic(err)
    }

    fmt.Printf("Job created: %s\n", job.ID)
}
```

---

## Development Tools

### VS Code Extension (Coming Soon)

- Syntax highlighting for Settler API
- IntelliSense for SDK methods
- Request/response preview
- Error highlighting

### Postman Collection

Import our Postman collection:

1. Download: [settler.io/postman.json](https://settler.io/postman.json)
2. Import into Postman
3. Set `SETTLER_API_KEY` environment variable
4. Start testing!

### Insomnia Plugin (Coming Soon)

- Pre-configured requests
- Environment templates
- Response validation

### GraphQL Playground (Coming Soon)

Settler will support GraphQL for complex queries:

```graphql
query {
  jobs(limit: 10) {
    id
    name
    status
    reports {
      summary {
        matched
        unmatched
        accuracy
      }
    }
  }
}
```

---

## Best Practices

### Error Handling

Always handle errors gracefully:

```typescript
try {
  const job = await settler.jobs.create({...});
} catch (error) {
  if (error instanceof SettlerError) {
    // Handle Settler-specific errors
  } else {
    // Handle network/other errors
  }
}
```

### Rate Limiting

Implement exponential backoff:

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Environment Variables

Never commit API keys:

```bash
# .env
SETTLER_API_KEY=sk_live_abc123...
SHOPIFY_API_KEY=shpat_...
STRIPE_SECRET_KEY=sk_live_...
```

```typescript
// Use dotenv or similar
import dotenv from "dotenv";
dotenv.config();

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY!,
});
```

### Logging

Log important operations:

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
  onRequest: (config) => {
    logger.info("API Request", {
      method: config.method,
      url: config.url,
      timestamp: new Date().toISOString(),
    });
  },
  onResponse: (response) => {
    logger.info("API Response", {
      status: response.status,
      timestamp: new Date().toISOString(),
    });
  },
});
```

---

## Support

**Documentation:** [docs.settler.io](https://docs.settler.io)  
**SDK GitHub:** [github.com/settler/settler-js](https://github.com/settler/settler-js)  
**Discord:** [discord.gg/settler](https://discord.gg/settler)  
**Email:** support@settler.io

---

**Last Updated:** 2026-01-15
