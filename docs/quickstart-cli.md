# Settler CLI Quickstart

## Command-Line Tool for Reconciliation Operations

The Settler CLI provides a fast, scriptable way to manage reconciliation jobs, view reports, and debug issues.

---

## Installation

```bash
npm install -g @settler/cli
# or
yarn global add @settler/cli
# or
pnpm add -g @settler/cli
```

Verify installation:

```bash
settler --version
```

---

## Authentication

Set your API key as an environment variable:

```bash
export SETTLER_API_KEY='sk_your_api_key_here'
```

Or use the `--api-key` flag with each command:

```bash
settler jobs list --api-key sk_your_api_key
```

---

## Quick Start (5 Minutes)

### 1. List Available Adapters

```bash
settler adapters list
```

### 2. Create a Reconciliation Job

```bash
settler jobs create \
  --name "Shopify-Stripe Reconciliation" \
  --source shopify \
  --target stripe
```

Or use a config file:

```bash
settler jobs create --config job.yaml
```

### 3. Run the Job

```bash
settler jobs run <job_id>
```

### 4. View the Report

```bash
settler reports get <job_id>
```

---

## Commands Reference

### Jobs

#### List Jobs

```bash
settler jobs list
settler jobs list --status active
settler jobs list --format json
```

#### Create Job

```bash
settler jobs create \
  --name "My Job" \
  --source stripe \
  --target shopify \
  --config-file job.yaml
```

#### Get Job Details

```bash
settler jobs get <job_id>
settler jobs get <job_id> --format json
```

#### Run Job

```bash
settler jobs run <job_id>
settler jobs run <job_id> --wait  # Wait for completion
```

#### Delete Job

```bash
settler jobs delete <job_id>
```

#### View Job Logs

```bash
settler jobs logs <job_id>
settler jobs logs <job_id> --tail  # Follow logs
settler jobs logs <job_id> --since 1h
```

#### Replay Job Events

```bash
settler jobs replay <job_id> --from-date 2026-01-01
settler jobs replay <job_id> --event-id <event_id>
```

### Reports

#### Get Report

```bash
settler reports get <job_id>
settler reports get <job_id> --start-date 2026-01-01 --end-date 2026-01-31
settler reports get <job_id> --format json
```

#### List Reports

```bash
settler reports list
settler reports list --job-id <job_id>
```

#### Export Report

```bash
settler reports export <job_id> --format csv
settler reports export <job_id> --format json --output report.json
```

### Webhooks

#### List Webhooks

```bash
settler webhooks list
```

#### Create Webhook

```bash
settler webhooks create \
  --url https://your-app.com/webhooks/settler \
  --events reconciliation.completed,reconciliation.failed
```

#### Delete Webhook

```bash
settler webhooks delete <webhook_id>
```

### Adapters

#### List Adapters

```bash
settler adapters list
settler adapters list --format json
```

#### Get Adapter Details

```bash
settler adapters get stripe
```

### Debugging

#### Test Connection

```bash
settler debug test-connection --adapter stripe --api-key sk_test_...
```

#### Validate Config

```bash
settler debug validate-config job.yaml
```

#### Trace Request

```bash
settler debug trace --method GET --path /api/v1/jobs
```

---

## Configuration Files

### YAML Format

Create `job.yaml`:

```yaml
name: Shopify-Stripe Reconciliation
source:
  adapter: shopify
  config:
    apiKey: ${SHOPIFY_API_KEY}
    shopDomain: your-shop.myshopify.com
target:
  adapter: stripe
  config:
    apiKey: ${STRIPE_SECRET_KEY}
rules:
  matching:
    - field: order_id
      type: exact
    - field: amount
      type: exact
      tolerance: 0.01
    - field: date
      type: range
      days: 1
  conflictResolution: last-wins
schedule: "0 2 * * *" # Daily at 2 AM
```

Create the job:

```bash
settler jobs create --config job.yaml
```

### JSON Format

Create `job.json`:

```json
{
  "name": "Shopify-Stripe Reconciliation",
  "source": {
    "adapter": "shopify",
    "config": {
      "apiKey": "${SHOPIFY_API_KEY}",
      "shopDomain": "your-shop.myshopify.com"
    }
  },
  "target": {
    "adapter": "stripe",
    "config": {
      "apiKey": "${STRIPE_SECRET_KEY}"
    }
  },
  "rules": {
    "matching": [
      { "field": "order_id", "type": "exact" },
      { "field": "amount", "type": "exact", "tolerance": 0.01 }
    ],
    "conflictResolution": "last-wins"
  }
}
```

---

## Environment Variables

The CLI supports environment variable substitution in config files:

```yaml
config:
  apiKey: ${STRIPE_SECRET_KEY} # Uses STRIPE_SECRET_KEY env var
  shopDomain: ${SHOPIFY_DOMAIN:-default.myshopify.com} # With default
```

---

## Output Formats

### JSON

```bash
settler jobs list --format json | jq '.data[] | {id, name, status}'
```

### Table (Default)

```bash
settler jobs list  # Human-readable table
```

### CSV

```bash
settler reports export <job_id> --format csv > report.csv
```

---

## Scripting Examples

### Bash Script

```bash
#!/bin/bash

# Create job
JOB_ID=$(settler jobs create --config job.yaml --format json | jq -r '.data.id')

# Run job
settler jobs run "$JOB_ID" --wait

# Get report
settler reports get "$JOB_ID" --format json | jq '.data.summary'
```

### Node.js Script

```javascript
import { execSync } from "child_process";

const jobId = JSON.parse(execSync("settler jobs create --config job.yaml --format json").toString())
  .data.id;

execSync(`settler jobs run ${jobId} --wait`);

const report = JSON.parse(execSync(`settler reports get ${jobId} --format json`).toString());

console.log("Matched:", report.data.summary.matched);
```

---

## Troubleshooting

### "Command not found"

Make sure the CLI is installed globally:

```bash
npm install -g @settler/cli
```

### "Invalid API key"

Check your API key:

```bash
echo $SETTLER_API_KEY
```

Or use the `--api-key` flag.

### "Connection timeout"

Check your network connection and API endpoint:

```bash
settler debug test-connection
```

---

## Advanced Usage

### Custom Base URL

```bash
settler --base-url http://localhost:3000 jobs list
```

### Verbose Logging

```bash
settler --verbose jobs run <job_id>
```

### Dry Run

```bash
settler jobs create --config job.yaml --dry-run
```

---

## See Also

- [Full CLI Documentation](https://docs.settler.io/cli)
- [API Reference](https://docs.settler.io/api)
- [Integration Recipes](https://docs.settler.io/recipes)
