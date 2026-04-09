# Data Engineering Domain Pack

Industry-specific templates and workflows for data engineering teams.

## Contents

### Schema Drift Detection

- **OpenAPI Schema Diff:** Compare OpenAPI schemas
- **Database Schema Drift:** Detect database schema changes
- **API Contract Versioning:** Manage API contract versions

### Data Pipeline Templates

- **Batch Reconciliation:** Batch data reconciliation
- **Stream Reconciliation:** Real-time stream reconciliation
- **Schema Evolution Workflow:** Automated schema evolution

## Usage

```javascript
const { SettlerClient } = require("@settler/sdk");

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Detect schema drift
const drifts = await client.drift.detect({
  expectedSchema: expectedSchema,
  actualSchema: actualSchema,
});

console.log("Schema drifts:", drifts);
```

## Templates

- `openapi-diff-template.json` - OpenAPI schema comparison
- `batch-reconciliation-workflow.json` - Batch reconciliation
- `schema-evolution-workflow.json` - Schema evolution

---

**For more information, see:** [Data Engineering Documentation](../../docs/VERTICAL_MODULES.md#data-engineering)
