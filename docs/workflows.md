# Workflows

Workflows orchestrate complex data operations pipelines.

## Workflow Definition

```json
{
  "id": "monthly-reconciliation",
  "name": "Monthly Reconciliation",
  "version": "1.0.0",
  "steps": [
    {
      "id": "ingest-stripe",
      "type": "ingestion",
      "config": {
        "adapter": "stripe",
        "config": {}
      },
      "onSuccess": "transform-data",
      "onFailure": "error-handler"
    },
    {
      "id": "transform-data",
      "type": "transform",
      "config": {
        "recipeId": "recipe_123"
      },
      "onSuccess": "validate-data"
    },
    {
      "id": "validate-data",
      "type": "validate",
      "config": {
        "rules": ["rule_1", "rule_2"]
      },
      "onSuccess": "reconcile"
    },
    {
      "id": "reconcile",
      "type": "recon",
      "config": {
        "jobId": "job_123"
      },
      "onSuccess": "generate-report"
    },
    {
      "id": "generate-report",
      "type": "audit",
      "config": {
        "format": "pdf"
      }
    }
  ],
  "triggers": [
    {
      "type": "schedule",
      "config": {
        "cron": "0 0 1 * *"
      }
    }
  ]
}
```

## Step Types

- **ingestion** - Ingest data from source
- **transform** - Transform data using recipe
- **validate** - Validate data using rules
- **map** - Apply field mapping
- **recon** - Perform reconciliation
- **drift_detection** - Detect schema drift
- **audit** - Generate audit report
- **webhook** - Trigger webhook
- **conditional** - Conditional branching
- **loop** - Loop over items
- **timer** - Wait for specified time

## Execution

Workflows can be triggered:
- **Manually** via API
- **Scheduled** via cron
- **Event-driven** via webhooks

## Error Handling

Each step can specify:
- `onSuccess` - Next step on success
- `onFailure` - Next step on failure
- `retry` - Retry configuration

---

**For API details, see [API_REFERENCE.md](./API_REFERENCE.md)**
