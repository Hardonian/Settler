# GitOps-Friendly Configuration
## Version-Controlled Job Configuration

Settler supports GitOps-friendly configuration using YAML or JSON files. This allows you to version control your reconciliation jobs, track changes, and deploy via CI/CD.

---

## Configuration File Format

### YAML Format (Recommended)

Create `settler-jobs.yaml`:

```yaml
version: "1.0"
jobs:
  - name: Shopify-Stripe Reconciliation
    source:
      adapter: shopify
      config:
        apiKey: ${SHOPIFY_API_KEY}
        shopDomain: ${SHOPIFY_DOMAIN}
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
    schedule: "0 2 * * *"  # Daily at 2 AM
    enabled: true
    tags:
      - production
      - ecommerce
  
  - name: Multi-Gateway Reconciliation
    sources:
      - adapter: stripe
        config:
          apiKey: ${STRIPE_SECRET_KEY}
      - adapter: paypal
        config:
          apiKey: ${PAYPAL_CLIENT_ID}
          secret: ${PAYPAL_SECRET}
    target:
      adapter: quickbooks
      config:
        clientId: ${QB_CLIENT_ID}
        clientSecret: ${QB_CLIENT_SECRET}
        realmId: ${QB_REALM_ID}
    rules:
      matching:
        - field: transaction_id
          type: fuzzy
          threshold: 0.8
        - field: amount
          type: exact
        - field: customer_email
          type: exact
      conflictResolution: manual-review
    schedule: "0 3 * * *"  # Daily at 3 AM
    enabled: true
    tags:
      - production
      - accounting
```

### JSON Format

Create `settler-jobs.json`:

```json
{
  "version": "1.0",
  "jobs": [
    {
      "name": "Shopify-Stripe Reconciliation",
      "source": {
        "adapter": "shopify",
        "config": {
          "apiKey": "${SHOPIFY_API_KEY}",
          "shopDomain": "${SHOPIFY_DOMAIN}"
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
      },
      "schedule": "0 2 * * *",
      "enabled": true,
      "tags": ["production", "ecommerce"]
    }
  ]
}
```

---

## Environment Variable Substitution

Configuration files support environment variable substitution:

### Basic Substitution

```yaml
config:
  apiKey: ${STRIPE_SECRET_KEY}
```

### With Default Value

```yaml
config:
  apiKey: ${STRIPE_SECRET_KEY:-sk_test_default}
```

### Nested Variables

```yaml
config:
  credentials:
    apiKey: ${STRIPE_SECRET_KEY}
    webhookSecret: ${STRIPE_WEBHOOK_SECRET}
```

---

## Using Configuration Files

### CLI

```bash
# Create job from config file
settler jobs create --config settler-jobs.yaml

# Apply all jobs from config file
settler jobs apply --config settler-jobs.yaml

# Validate config file
settler debug validate-config settler-jobs.yaml
```

### SDK

```typescript
import { SettlerClient } from '@settler/sdk';
import * as fs from 'fs';
import * as yaml from 'yaml';

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Load and parse config file
const configFile = fs.readFileSync('settler-jobs.yaml', 'utf-8');
const config = yaml.parse(configFile);

// Create jobs from config
for (const jobConfig of config.jobs) {
  if (jobConfig.enabled) {
    const job = await client.jobs.create(jobConfig);
    console.log(`Created job: ${job.data.id}`);
  }
}
```

### API

```bash
# Apply config file via API
curl -X POST https://api.settler.io/api/v1/jobs/apply \
  -H "X-API-Key: sk_your_api_key" \
  -H "Content-Type: application/yaml" \
  --data-binary @settler-jobs.yaml
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/settler-deploy.yml`:

```yaml
name: Deploy Settler Jobs

on:
  push:
    branches: [main]
    paths:
      - 'settler-jobs.yaml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate Config
        run: |
          npm install -g @settler/cli
          settler debug validate-config settler-jobs.yaml
      
      - name: Apply Jobs
        env:
          SETTLER_API_KEY: ${{ secrets.SETTLER_API_KEY }}
        run: |
          settler jobs apply --config settler-jobs.yaml
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
deploy-settler-jobs:
  stage: deploy
  image: node:18
  script:
    - npm install -g @settler/cli
    - settler debug validate-config settler-jobs.yaml
    - settler jobs apply --config settler-jobs.yaml
  only:
    changes:
      - settler-jobs.yaml
  variables:
    SETTLER_API_KEY: $SETTLER_API_KEY
```

### CircleCI

Create `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  deploy:
    docker:
      - image: node:18
    steps:
      - checkout
      - run:
          name: Install CLI
          command: npm install -g @settler/cli
      - run:
          name: Validate Config
          command: settler debug validate-config settler-jobs.yaml
      - run:
          name: Apply Jobs
          command: settler jobs apply --config settler-jobs.yaml
          environment:
            SETTLER_API_KEY: ${SETTLER_API_KEY}

workflows:
  deploy:
    jobs:
      - deploy:
          filters:
            branches:
              only: main
```

---

## Configuration Schema

### Job Configuration Schema

```yaml
name: string                    # Required: Job name
source:                         # Required: Single source adapter
  adapter: string              # Required: Adapter name
  config: object                # Required: Adapter configuration
sources:                        # Optional: Multiple source adapters
  - adapter: string
    config: object
target:                         # Required: Target adapter
  adapter: string              # Required: Adapter name
  config: object                # Required: Adapter configuration
rules:                          # Required: Matching rules
  matching:                    # Required: Array of matching rules
    - field: string            # Required: Field name
      type: string             # Required: exact | fuzzy | range
      tolerance?: number       # Optional: Tolerance for numeric fields
      threshold?: number       # Optional: Threshold for fuzzy matching (0-1)
      days?: number            # Optional: Days for range matching
  conflictResolution: string  # Optional: last-wins | first-wins | manual-review
schedule?: string              # Optional: Cron expression
enabled?: boolean              # Optional: Enable/disable job (default: true)
tags?: string[]                # Optional: Tags for organization
metadata?: object              # Optional: Custom metadata
```

---

## Best Practices

### 1. Version Control

- Store config files in Git
- Use meaningful commit messages
- Tag releases

### 2. Environment Separation

Use separate config files per environment:

- `settler-jobs.production.yaml`
- `settler-jobs.staging.yaml`
- `settler-jobs.development.yaml`

### 3. Secrets Management

Never commit secrets to Git. Use environment variables:

```yaml
# ❌ Bad
config:
  apiKey: sk_live_1234567890

# ✅ Good
config:
  apiKey: ${STRIPE_SECRET_KEY}
```

### 4. Validation

Always validate config files before applying:

```bash
settler debug validate-config settler-jobs.yaml
```

### 5. Testing

Test config changes in staging before production:

```bash
# Staging
SETTLER_API_KEY=$STAGING_KEY settler jobs apply --config settler-jobs.staging.yaml

# Production (after validation)
SETTLER_API_KEY=$PROD_KEY settler jobs apply --config settler-jobs.production.yaml
```

---

## Advanced Features

### Conditional Jobs

Use tags to conditionally apply jobs:

```yaml
jobs:
  - name: Production Job
    tags: [production]
    # ...
  
  - name: Development Job
    tags: [development]
    # ...
```

Apply only production jobs:

```bash
settler jobs apply --config settler-jobs.yaml --tags production
```

### Job Templates

Use templates for reusable configurations:

```yaml
templates:
  stripe-shopify:
    source:
      adapter: shopify
    target:
      adapter: stripe
    rules:
      matching:
        - field: order_id
          type: exact

jobs:
  - name: US Store
    extends: stripe-shopify
    source:
      config:
        shopDomain: us-store.myshopify.com
```

---

## Migration from API

Export existing jobs to config file:

```bash
# Export all jobs
settler jobs export --format yaml > settler-jobs.yaml

# Export specific job
settler jobs export <job_id> --format yaml >> settler-jobs.yaml
```

---

## See Also

- [Quickstart Guide](./QUICKSTART.md)
- [CLI Documentation](./QUICKSTART_CLI.md)
- [API Reference](./api.md)
