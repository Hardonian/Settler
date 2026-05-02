import os

# Directories to create
dirs = [
    "openapi",
    "docs/api",
    "packages/sdk-js",
    "packages/sdk-js/src"
]

for d in dirs:
    os.makedirs(d, exist_ok=True)

# 1. OpenAPI Spec
openapi_content = """openapi: 3.1.0
info:
  title: Settler Reconciliation API
  description: Enterprise-grade API for automated reconciliation, exception management, and proofpack generation.
  version: 1.0.0
servers:
  - url: https://api.settler.dev/api/v1
    description: Production API
security:
  - bearerAuth: []
paths:
  /runs:
    post:
      summary: Create a new reconciliation run
      responses:
        '201':
          description: Run created
  /runs/{id}:
    get:
      summary: Get a run by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Run details
  /runs/{id}/exceptions:
    get:
      summary: Get exceptions for a run
      responses:
        '200':
          description: List of exceptions
  /runs/{id}/adjudications:
    post:
      summary: Record an adjudication decision
      responses:
        '201':
          description: Adjudication recorded
  /runs/{id}/proofpack:
    get:
      summary: Get audit-ready proofpack
      responses:
        '200':
          description: Proofpack data
  /runs/{id}/delta:
    get:
      summary: Get changes/deltas
      responses:
        '200':
          description: Delta details
  /webhooks/test:
    post:
      summary: Test a webhook endpoint
      responses:
        '200':
          description: Webhook test successful
  /usage:
    get:
      summary: Get usage metering data
      responses:
        '200':
          description: Usage details
  /templates:
    get:
      summary: List managed reconciliation templates
      responses:
        '200':
          description: Templates list
  /templates/{id}/run:
    post:
      summary: Run a specific template
      responses:
        '201':
          description: Template run started
  /webhooks/events:
    get:
      summary: List webhook events
      responses:
        '200':
          description: List of events
  /webhooks/events/{id}/replay:
    post:
      summary: Replay a webhook event
      responses:
        '200':
          description: Event replayed
  /status:
    get:
      summary: API health and status
      responses:
        '200':
          description: Status information
  /audit-exports:
    get:
      summary: List audit exports
      responses:
        '200':
          description: Audit exports list
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
"""
with open("openapi/settler.v1.yaml", "w") as f:
    f.write(openapi_content)

# 2. Docs Quickstart
quickstart_content = """# API Quickstart

Welcome to the Settler API. The Settler API provides enterprise-grade reconciliation infrastructure, allowing you to embed explainable matching, audit-ready evidence, and reusable decision memory into your finance ops.

## Authentication
Use Bearer authentication with your API key:
`Authorization: Bearer <your_api_key>`

## Creating a Run
```bash
curl -X POST https://api.settler.dev/api/v1/runs \\
  -H "Authorization: Bearer sk_test_123" \\
  -H "Content-Type: application/json" \\
  -d '{"templateId": "tmpl_abc123"}'
```

## Getting Exceptions
```bash
curl -X GET https://api.settler.dev/api/v1/runs/run_xyz789/exceptions \\
  -H "Authorization: Bearer sk_test_123"
```
"""
with open("docs/api/quickstart.md", "w") as f:
    f.write(quickstart_content)

# 3. Docs Webhooks
webhooks_content = """# Webhooks

Settler uses webhooks to notify your application when events occur, such as a reconciliation run completing or an exception being auto-adjudicated.

## Signing
All webhook payloads are signed using an HMAC-SHA256 signature in the `Settler-Signature` header. 
Verify the signature to ensure the webhook was sent by Settler.

## Retries
If your endpoint does not respond with a 2xx status code, Settler will retry delivery with exponential backoff for up to 3 days.

## Replaying Events
You can manually replay events via the Dashboard or the API:
`POST /api/v1/webhooks/events/:id/replay`
"""
with open("docs/api/webhooks.md", "w") as f:
    f.write(webhooks_content)

# 4. Docs Errors
errors_content = """# API Errors

The Settler API uses standard HTTP status codes and returns a typed JSON error envelope.

## Error Codes
- `RATE_LIMITED`: Too many requests. Respect the `Retry-After` header.
- `QUOTA_EXCEEDED`: API or billing quota exceeded. Upgrade your plan.
- `IDEMPOTENCY_CONFLICT`: A request with this idempotency key is already in progress.
- `CAPABILITY_UNAVAILABLE`: Feature not enabled for your plan tier.
- `TENANT_ACCESS_DENIED`: Invalid API key or permission denied.
- `VALIDATION_FAILED`: Invalid request payload. Check the `details` array.
"""
with open("docs/api/errors.md", "w") as f:
    f.write(errors_content)

# 5. SDK JS
sdk_readme = """# @settler/sdk

Official Node.js and TypeScript SDK for the Settler Reconciliation API.

## Installation
```bash
npm install @settler/sdk
# or
pnpm add @settler/sdk
```

## Usage
```typescript
import { Settler } from '@settler/sdk';

const settler = new Settler({ apiKey: 'sk_test_123' });

const run = await settler.runs.create({
  templateId: 'tmpl_abc123'
});
```
"""
with open("packages/sdk-js/README.md", "w") as f:
    f.write(sdk_readme)

sdk_package = """{
  "name": "@settler/sdk-js",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "echo 'No tests yet'"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
"""
with open("packages/sdk-js/package.json", "w") as f:
    f.write(sdk_package)

sdk_tsconfig = """{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
"""
with open("packages/sdk-js/tsconfig.json", "w") as f:
    f.write(sdk_tsconfig)

sdk_src = """export class Settler {
  private apiKey: string;

  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
  }
  
  public runs = {
    create: async (params: any) => {
      // Implementation stub
      return { id: 'run_123', status: 'pending' };
    }
  }
}
"""
with open("packages/sdk-js/src/index.ts", "w") as f:
    f.write(sdk_src)

print("Done creating DX files")
