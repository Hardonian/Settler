# @settler/sdk

Official Node.js and TypeScript SDK for the Settler Reconciliation API.

## Installation

```bash
npm install @settler/sdk
# or
pnpm add @settler/sdk
```

## Usage

```typescript
import { Settler } from "@settler/sdk";

const settler = new Settler({ apiKey: "sk_test_123" });

const run = await settler.runs.create({
  templateId: "tmpl_abc123",
});
```
